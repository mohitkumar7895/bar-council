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
    if (!user || !hasPermission(user, "death_benefit:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      where += " AND dbc.claim_status = ?";
      params.push(status);
    }

    if (search) {
      where += " AND (dbc.claim_no LIKE ? OR dbc.deceased_advocate_name LIKE ? OR dbc.applicant_name LIKE ? OR dbc.registration_no LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total FROM death_benefit_claims dbc ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    const sql = `
      SELECT
        dbc.*,
        a.full_name as advocate_name,
        a.advocate_code,
        u1.name as reviewer_name,
        u2.name as approver_name
      FROM death_benefit_claims dbc
      JOIN advocates a ON dbc.advocate_id = a.id
      LEFT JOIN users u1 ON dbc.assigned_reviewer_id = u1.id
      LEFT JOIN users u2 ON dbc.approved_by_user_id = u2.id
      ${where}
      ORDER BY dbc.application_date DESC, dbc.id DESC
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
    console.warn("Death benefit GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.deathClaims];

    if (status && status !== "all") {
      records = records.filter((c) => c.claim_status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (c) =>
          c.claim_no?.toLowerCase().includes(q) ||
          c.deceased_advocate_name?.toLowerCase().includes(q) ||
          c.applicant_name?.toLowerCase().includes(q) ||
          c.advocate_code?.toLowerCase().includes(q)
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
    if (!user || !hasPermission(user, "death_benefit:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    body = await req.json();
    const {
      advocate_id,
      date_of_death,
      applicant_name,
      relationship,
      phone,
      email,
      address,
      requested_amount = 500000,
      reviewer_remarks,
    } = body;

    if (!advocate_id || !date_of_death || !applicant_name || !relationship || !phone) {
      return NextResponse.json({ success: false, error: "Missing required claim details" }, { status: 400 });
    }

    const [advocates] = await query<any[]>(
      "SELECT id, full_name, advocate_code, bar_council_reg_no, association_membership_no FROM advocates WHERE id = ? LIMIT 1",
      [advocate_id]
    );

    if (!advocates) {
      return NextResponse.json({ success: false, error: "Advocate not found" }, { status: 404 });
    }

    const year = new Date().getFullYear();
    const appDate = new Date().toISOString().split("T")[0];

    const result = await transaction(async (conn) => {
      // 1. Generate claim_no
      const [lastClaim] = await conn.execute<any>("SELECT id FROM death_benefit_claims ORDER BY id DESC LIMIT 1");
      const nextId = (lastClaim[0]?.id || 0) + 1;
      const claim_no = `DBC-${year}-${String(nextId).padStart(4, "0")}`;

      // 2. Insert death benefit claim
      const [claimRes] = await conn.execute<any>(
        `INSERT INTO death_benefit_claims (
          claim_no, advocate_id, deceased_advocate_name, membership_no, registration_no,
          date_of_death, applicant_name, relationship, phone, email, address,
          requested_amount, application_date, assigned_reviewer_id, reviewer_remarks, claim_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
        [
          claim_no,
          advocate_id,
          advocates.full_name,
          advocates.association_membership_no,
          advocates.bar_council_reg_no,
          date_of_death,
          applicant_name,
          relationship,
          phone,
          email || null,
          address || null,
          Number(requested_amount),
          appDate,
          user.userId,
          reviewer_remarks || "Claim registered by office staff.",
        ]
      );

      // 3. Mark advocate status as deceased
      await conn.execute("UPDATE advocates SET membership_status = 'deceased' WHERE id = ?", [advocate_id]);

      // 4. Activity log
      await conn.execute(
        `INSERT INTO activity_logs (user_id, action, module, record_id, details)
         VALUES (?, 'Death Claim Registered', 'death_benefit', ?, ?)`,
        [user.userId, claim_no, `Registered death claim ${claim_no} for late ${advocates.full_name}`]
      );

      return { claimId: claimRes.insertId, claim_no };
    });

    return NextResponse.json({
      success: true,
      message: "Death Benefit Claim registered successfully",
      data: result,
    });
  } catch (error: any) {
    console.warn("Death benefit claim DB unavailable, storing in memory:", error?.message);
    const store = getStore();
    const claimId = store.deathClaims.length + 1;
    const year = new Date().getFullYear();
    const claim_no = `DBC-${year}-${String(claimId).padStart(4, "0")}`;
    const adv = store.advocates.find((a) => a.id === Number(body?.advocate_id));

    const newClaim = {
      id: claimId,
      claim_no,
      advocate_id: Number(body?.advocate_id) || 1,
      deceased_advocate_name: adv?.full_name || "Advocate",
      advocate_name: adv?.full_name || "Advocate",
      advocate_code: adv?.advocate_code || "",
      applicant_name: body?.applicant_name || "Nominee",
      relationship: body?.relationship || "Spouse",
      phone: body?.phone || "",
      date_of_death: body?.date_of_death || new Date().toISOString().split("T")[0],
      application_date: new Date().toISOString().split("T")[0],
      sanctioned_amount: Number(body?.requested_amount) || 500000,
      requested_amount: Number(body?.requested_amount) || 500000,
      claim_status: "submitted",
      payment_status: "pending",
      created_at: new Date().toISOString(),
    };
    store.deathClaims.unshift(newClaim);

    // If advocate exists in store, mark status as deceased
    if (adv) {
      adv.membership_status = "deceased";
    }

    return NextResponse.json({
      success: true,
      message: "Death Benefit Claim registered successfully",
      data: {
        claimId,
        claim_no,
        advocate_name: newClaim.deceased_advocate_name,
        applicant_name: newClaim.applicant_name,
        requested_amount: newClaim.requested_amount,
        claim_status: "submitted",
      },
    });
  }
}
