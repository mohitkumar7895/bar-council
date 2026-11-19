import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
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
    const categoryId = searchParams.get("categoryId") || "all";
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (categoryId && categoryId !== "all") {
      where += " AND ee.category_id = ?";
      params.push(categoryId);
    }

    if (search) {
      where += " AND (ee.expense_no LIKE ? OR ee.description LIKE ? OR ee.payee_vendor LIKE ? OR ee.reference_number LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM expense_entries ee ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;
    const totalAmount = Number(countRes?.total_amount) || 0;

    const sql = `
      SELECT
        ee.*,
        ec.name as category_name,
        u.name as user_name
      FROM expense_entries ee
      JOIN expense_categories ec ON ee.category_id = ec.id
      LEFT JOIN users u ON ee.user_id = u.id
      ${where}
      ORDER BY ee.date DESC, ee.id DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query<any[]>(sql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: records,
      totalAmount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "finance:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      date = new Date().toISOString().split("T")[0],
      category_id,
      description,
      amount,
      payment_mode = "Cash",
      payee_vendor,
      reference_number,
      payment_status = "paid",
      notes,
    } = body;

    const expenseAmount = Number(amount);
    if (!category_id || !description || !payee_vendor || isNaN(expenseAmount) || expenseAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Category, description, vendor, and positive amount are required" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const [lastExp] = await query<any[]>("SELECT id FROM expense_entries ORDER BY id DESC LIMIT 1");
    const nextId = (lastExp?.id || 0) + 1;
    const expense_no = `EXP-${year}-${String(nextId).padStart(4, "0")}`;

    const res = await execute(
      `INSERT INTO expense_entries (
        expense_no, date, category_id, description, amount, payment_mode,
        payee_vendor, reference_number, payment_status, notes, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense_no,
        date,
        Number(category_id),
        description,
        expenseAmount,
        payment_mode,
        payee_vendor,
        reference_number || null,
        payment_status,
        notes || null,
        user.userId,
      ]
    );

    await execute(
      `INSERT INTO activity_logs (user_id, action, module, record_id, details)
       VALUES (?, 'Record Expense', 'finance', ?, ?)`,
      [user.userId, expense_no, `Recorded expense voucher ${expense_no} for ₹${expenseAmount} to ${payee_vendor}`]
    );

    return NextResponse.json({
      success: true,
      message: "Expense voucher recorded successfully",
      data: { id: res.insertId, expense_no },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
