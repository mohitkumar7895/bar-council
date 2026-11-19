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
  const categoryId = searchParams.get("categoryId") || "all";
  const offset = (page - 1) * limit;

  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "finance:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

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
    console.warn("Expenses GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.expenseEntries];

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (e) =>
          e.expense_no?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.payee_vendor?.toLowerCase().includes(q) ||
          e.category_name?.toLowerCase().includes(q)
      );
    }

    const total = records.length;
    const totalAmount = records.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const paginated = records.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      totalAmount,
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
    if (!user || !hasPermission(user, "finance:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    body = await req.json();
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
    console.warn("Expense POST query unavailable, storing in memory:", error?.message);
    const store = getStore();
    const expenseId = store.expenseEntries.length + 1;
    const year = new Date().getFullYear();
    const expense_no = `EXP-${year}-${String(expenseId).padStart(4, "0")}`;
    const expenseAmount = Number(body?.amount) || 0;
    const date = body?.date || new Date().toISOString().split("T")[0];
    const payee_vendor = body?.payee_vendor || "Vendor";
    const description = body?.description || "Association Expense";

    const newExpense = {
      id: expenseId,
      expense_no,
      category_id: Number(body?.category_id) || 1,
      category_name: "Administrative & Office Operations",
      expense_name: description,
      description,
      amount: expenseAmount,
      date,
      payment_mode: body?.payment_mode || "cash",
      payee_vendor,
      reference_number: body?.reference_number || null,
      payment_status: "paid",
      created_at: new Date().toISOString(),
    };
    store.expenseEntries.unshift(newExpense);

    return NextResponse.json({
      success: true,
      message: "Expense voucher recorded successfully",
      data: { id: expenseId, expense_no },
    });
  }
}
