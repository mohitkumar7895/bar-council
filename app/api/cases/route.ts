import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "cases:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 15));
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (category && category !== "all") {
      where += " AND cr.category = ?";
      params.push(category);
    }

    if (status && status !== "all") {
      where += " AND cr.status = ?";
      params.push(status);
    }

    if (search) {
      where += " AND (cr.case_no LIKE ? OR cr.reference_number LIKE ? OR cr.applicant_name LIKE ? OR cr.respondent_name LIKE ? OR a.full_name LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total FROM cases_register cr LEFT JOIN advocates a ON cr.advocate_id = a.id ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    const sql = `
      SELECT
        cr.*,
        a.full_name as advocate_name,
        a.advocate_code
      FROM cases_register cr
      LEFT JOIN advocates a ON cr.advocate_id = a.id
      ${where}
      ORDER BY cr.filing_date DESC, cr.id DESC
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
    return NextResponse.json({ success: false, error: "Failed to fetch cases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "cases:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      reference_number,
      category = "general_grievance",
      applicant_name,
      respondent_name,
      advocate_id,
      filing_date = new Date().toISOString().split("T")[0],
      status = "pending",
      presiding_officer,
      notes,
    } = body;

    if (!reference_number || !applicant_name) {
      return NextResponse.json({ success: false, error: "Reference number and applicant name are required" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const [lastCase] = await query<any[]>("SELECT id FROM cases_register ORDER BY id DESC LIMIT 1");
    const nextId = (lastCase?.id || 0) + 1;
    const case_no = `CAS-${year}-${String(nextId).padStart(4, "0")}`;

    const res = await execute(
      `INSERT INTO cases_register (
        case_no, reference_number, category, applicant_name, respondent_name,
        advocate_id, filing_date, status, presiding_officer, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        case_no,
        reference_number,
        category,
        applicant_name,
        respondent_name || null,
        advocate_id ? Number(advocate_id) : null,
        filing_date,
        status,
        presiding_officer || null,
        notes || null,
      ]
    );

    await execute(
      `INSERT INTO activity_logs (user_id, action, module, record_id, details)
       VALUES (?, 'Case Registered', 'cases', ?, ?)`,
      [user.userId, case_no, `Registered association case ${case_no} (Ref: ${reference_number})`]
    );

    return NextResponse.json({
      success: true,
      message: "Case record created successfully",
      data: { id: res.insertId, case_no },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
