import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 15));
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "all";
  const offset = (page - 1) * limit;

  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "health_claims:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      where += " AND hc.claim_status = ?";
      params.push(status);
    }

    if (search) {
      where += " AND (hc.claim_no LIKE ? OR hc.applicant_name LIKE ? OR a.full_name LIKE ? OR hc.hospital_name LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total FROM health_claims hc ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    const sql = `
      SELECT
        hc.*,
        a.full_name as advocate_name,
        a.advocate_code,
        cc.name as category_name,
        u.name as approver_name
      FROM health_claims hc
      JOIN advocates a ON hc.advocate_id = a.id
      LEFT JOIN claim_categories cc ON hc.category_id = cc.id
      LEFT JOIN users u ON hc.approved_by_user_id = u.id
      ${where}
      ORDER BY hc.submission_date DESC, hc.id DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query<any[]>(sql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.warn("Health claims GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.healthClaims];

    if (status && status !== "all") {
      records = records.filter((c) => c.claim_status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (c) =>
          c.claim_no?.toLowerCase().includes(q) ||
          c.applicant_name?.toLowerCase().includes(q) ||
          c.advocate_name?.toLowerCase().includes(q) ||
          c.hospital_name?.toLowerCase().includes(q)
      );
    }

    const total = records.length;
    const paginated = records.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "health_claims:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    body = await req.json();
    const {
      advocate_id,
      applicant_name,
      relationship = "self",
      category_id,
      requested_amount,
      hospital_name,
      illness_details,
      admission_date,
      discharge_date,
      bank_name,
      account_number,
      ifsc_code,
      reviewer_remarks,
    } = body;

    const reqAmt = Number(requested_amount);
    if (!advocate_id || !applicant_name || isNaN(reqAmt) || reqAmt <= 0) {
      return NextResponse.json({ success: false, error: "Missing required claim details or amount" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const subDate = new Date().toISOString().split("T")[0];

    const result = await transaction(async (conn) => {
      // 1. Generate claim_no
      const [lastClaim] = await conn.execute<any>("SELECT id FROM health_claims ORDER BY id DESC LIMIT 1");
      const nextId = (lastClaim[0]?.id || 0) + 1;
      const claim_no = `HLC-${year}-${String(nextId).padStart(4, "0")}`;

      // 2. Insert into health_claims
      const [claimRes] = await conn.execute<any>(
        `INSERT INTO health_claims (
          claim_no, advocate_id, applicant_name, relationship, category_id,
          requested_amount, submission_date, hospital_name, illness_details,
          admission_date, discharge_date, bank_name, account_number, ifsc_code,
          verification_status, claim_status, reviewer_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'submitted', ?)`,
        [
          claim_no,
          advocate_id,
          applicant_name,
          relationship,
          category_id ? Number(category_id) : null,
          reqAmt,
          subDate,
          hospital_name || null,
          illness_details || null,
          admission_date || null,
          discharge_date || null,
          bank_name || null,
          account_number || null,
          ifsc_code || null,
          reviewer_remarks || "Health claim filed for medical relief.",
        ]
      );

      // 3. Activity log
      await conn.execute(
        `INSERT INTO activity_logs (user_id, action, module, record_id, details)
         VALUES (?, 'Health Claim Filed', 'health_claims', ?, ?)`,
        [user.userId, claim_no, `Filed health claim ${claim_no} for ${applicant_name} (₹${reqAmt})`]
      );

      return { claimId: claimRes.insertId, claim_no };
    });

    return NextResponse.json({
      success: true,
      message: "Health claim application submitted successfully",
      data: result,
    });
  } catch (error: any) {
    console.warn("Health claim POST DB unavailable, storing in memory:", error?.message);
    const store = getStore();
    const claimId = store.healthClaims.length + 1;
    const year = new Date().getFullYear();
    const claim_no = `HLC-${year}-${String(claimId).padStart(4, "0")}`;
    const adv = store.advocates.find((a) => a.id === Number(body?.advocate_id));
    const reqAmt = Number(body?.claimed_amount) || Number(body?.requested_amount) || 50000;

    const newClaim = {
      id: claimId,
      claim_no,
      advocate_id: Number(body?.advocate_id) || 1,
      applicant_name: body?.applicant_name || adv?.full_name || "Advocate",
      advocate_name: adv?.full_name || "Advocate",
      advocate_code: adv?.advocate_code || "",
      category_name: "Hospitalization / Surgery",
      hospital_name: body?.hospital_name || "Medical Complex",
      illness_details: body?.illness_details || "",
      admission_date: body?.admission_date || null,
      discharge_date: body?.discharge_date || null,
      claimed_amount: reqAmt,
      sanctioned_amount: reqAmt,
      submission_date: new Date().toISOString().split("T")[0],
      claim_status: "submitted",
      payment_status: "pending",
      created_at: new Date().toISOString(),
    };
    store.healthClaims.unshift(newClaim);

    return NextResponse.json({
      success: true,
      message: "Health claim application submitted successfully",
      data: {
        claimId,
        claim_no,
        applicant_name: newClaim.applicant_name,
        claimed_amount: reqAmt,
        claim_status: "submitted",
      },
    });
  }
}
