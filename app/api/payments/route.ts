import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "finance:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 15));
    const search = searchParams.get("search")?.trim() || "";
    const module = searchParams.get("module") || "all";
    const paymentMode = searchParams.get("paymentMode") || "all";
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (module && module !== "all") {
      where += " AND p.source_module = ?";
      params.push(module);
    }

    if (paymentMode && paymentMode !== "all") {
      where += " AND p.payment_mode = ?";
      params.push(paymentMode);
    }

    if (search) {
      where += " AND (p.receipt_no LIKE ? OR p.payer_name LIKE ? OR a.full_name LIKE ? OR p.reference_number LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total FROM payments p LEFT JOIN advocates a ON p.advocate_id = a.id ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    const sql = `
      SELECT
        p.*,
        a.full_name as advocate_name,
        a.advocate_code,
        u.name as received_by_name
      FROM payments p
      LEFT JOIN advocates a ON p.advocate_id = a.id
      LEFT JOIN users u ON p.received_by_user_id = u.id
      ${where}
      ORDER BY p.payment_date DESC, p.id DESC
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
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}
