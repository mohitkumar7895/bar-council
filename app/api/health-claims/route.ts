import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "health_claims:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 15));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const offset = (page - 1) * limit;

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
    return NextResponse.json({ success: false, error: "Failed to fetch health claims" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "health_claims:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
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
    console.error("Health claim POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit claim" }, { status: 500 });
  }
}
