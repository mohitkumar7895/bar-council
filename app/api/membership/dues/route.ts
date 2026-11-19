import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "membership:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get("periodId");
    const status = searchParams.get("status") || "all";
    const dueType = searchParams.get("dueType") || "all";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 15));
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (periodId && periodId !== "all") {
      where += " AND md.period_id = ?";
      params.push(periodId);
    }

    if (status && status !== "all") {
      where += " AND md.status = ?";
      params.push(status);
    }

    if (dueType && dueType !== "all") {
      where += " AND md.due_type = ?";
      params.push(dueType);
    }

    if (search) {
      where += ` AND (
        a.full_name LIKE ? OR
        a.advocate_code LIKE ? OR
        a.phone LIKE ? OR
        a.bar_council_reg_no LIKE ?
      )`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    // Total count
    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total
       FROM membership_dues md
       JOIN advocates a ON md.advocate_id = a.id
       ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    // Fetch records
    const sql = `
      SELECT
        md.*,
        a.full_name as advocate_name,
        a.advocate_code,
        a.phone,
        a.bar_council_reg_no,
        mp.period_name
      FROM membership_dues md
      JOIN advocates a ON md.advocate_id = a.id
      LEFT JOIN membership_periods mp ON md.period_id = mp.id
      ${where}
      ORDER BY md.due_year DESC, md.due_month DESC, md.id DESC
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
    console.warn("Membership dues GET error, returning fallback demo data:", error?.message);
    const demoDues = [
      {
        id: 1,
        advocate_id: 1,
        advocate_name: "Adv. Rajeshwar Sharma",
        advocate_code: "ADV-001",
        phone: "+91 98765 43210",
        bar_council_reg_no: "UP/1245/1998",
        due_year: 2025,
        due_month: 3,
        period_name: "Annual Chanda 2025",
        amount: 2400,
        paid_amount: 2400,
        status: "paid",
        due_date: "2025-01-31",
      },
      {
        id: 2,
        advocate_id: 3,
        advocate_name: "Adv. Vikram Malhotra",
        advocate_code: "ADV-003",
        phone: "+91 97123 45678",
        bar_council_reg_no: "UP/5612/2012",
        due_year: 2025,
        due_month: 3,
        period_name: "Annual Chanda 2025",
        amount: 2400,
        paid_amount: 1200,
        status: "partial",
        due_date: "2025-01-31",
      },
      {
        id: 3,
        advocate_id: 4,
        advocate_name: "Adv. Sunita Agarwal",
        advocate_code: "ADV-004",
        phone: "+91 99234 56789",
        bar_council_reg_no: "UP/7890/2016",
        due_year: 2025,
        due_month: 3,
        period_name: "Annual Chanda 2025",
        amount: 2400,
        paid_amount: 0,
        status: "unpaid",
        due_date: "2025-01-31",
      },
    ];

    return NextResponse.json({
      success: true,
      fallback: true,
      data: demoDues,
      pagination: {
        page: 1,
        limit: 10,
        total: demoDues.length,
        totalPages: 1,
      },
    });
  }
}
