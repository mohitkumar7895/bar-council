import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 15));
  const search = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category") || "all";
  const status = searchParams.get("status") || "all";
  const offset = (page - 1) * limit;

  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "cases:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

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
    console.warn("Cases GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.cases];

    if (category && category !== "all") {
      records = records.filter((c) => c.category === category || c.case_type === category);
    }

    if (status && status !== "all") {
      records = records.filter((c) => c.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (c) =>
          c.case_no?.toLowerCase().includes(q) ||
          c.case_number?.toLowerCase().includes(q) ||
          c.case_title?.toLowerCase().includes(q) ||
          c.applicant_name?.toLowerCase().includes(q) ||
          c.advocate_name?.toLowerCase().includes(q)
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
    if (!user || !hasPermission(user, "cases:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    body = await req.json();
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
    console.warn("Case POST query unavailable, storing in memory:", error?.message);
    const store = getStore();
    const caseId = store.cases.length + 1;
    const year = new Date().getFullYear();
    const case_no = `CASE-${year}-${String(caseId).padStart(4, "0")}`;
    const adv = store.advocates.find((a) => a.id === Number(body?.advocate_id));

    const newCase = {
      id: caseId,
      case_no,
      case_number: body?.case_number || case_no,
      reference_number: body?.reference_number || `REF-${year}-${caseId}`,
      court_name: body?.court_name || "District & Sessions Court, Bahraich",
      case_title: body?.case_title || `${body?.applicant_name || "Applicant"} vs. ${body?.respondent_name || "Respondent"}`,
      case_type: body?.category || body?.case_type || "Civil Suit",
      category: body?.category || "Civil",
      applicant_name: body?.applicant_name || "Applicant",
      respondent_name: body?.respondent_name || "Respondent",
      advocate_id: body?.advocate_id ? Number(body.advocate_id) : null,
      advocate_name: adv?.full_name || "Advocate",
      advocate_code: adv?.advocate_code || "",
      party_represented: body?.party_represented || "Petitioner",
      stage: body?.stage || "Filing",
      filing_date: body?.filing_date || new Date().toISOString().split("T")[0],
      next_hearing_date: body?.next_hearing_date || null,
      status: body?.status || "open",
      created_at: new Date().toISOString(),
    };
    store.cases.unshift(newCase);

    return NextResponse.json({
      success: true,
      message: "Case record created successfully",
      data: { id: caseId, case_no },
    });
  }
}
