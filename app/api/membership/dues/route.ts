import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "membership:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
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
    console.error("Membership dues GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve membership dues" },
      { status: 500 }
    );
  }
}
