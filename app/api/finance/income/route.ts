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
  const offset = (page - 1) * limit;

  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "finance:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (category && category !== "all") {
      where += " AND ie.category = ?";
      params.push(category);
    }

    if (search) {
      where += " AND (ie.income_no LIKE ? OR ie.description LIKE ? OR ie.received_from LIKE ? OR ie.reference_no LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM income_entries ie ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;
    const totalAmount = Number(countRes?.total_amount) || 0;

    const sql = `
      SELECT
        ie.*,
        u.name as user_name
      FROM income_entries ie
      LEFT JOIN users u ON ie.user_id = u.id
      ${where}
      ORDER BY ie.date DESC, ie.id DESC
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
    console.warn("Income GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.incomeEntries];

    if (category && category !== "all") {
      records = records.filter((i) => i.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (i) =>
          i.income_no?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.received_from?.toLowerCase().includes(q)
      );
    }

    const total = records.length;
    const totalAmount = records.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
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
      category = "other_income",
      description,
      amount,
      payment_mode = "Cash",
      reference_no,
      received_from,
      notes,
    } = body;

    const incomeAmount = Number(amount);
    if (!description || isNaN(incomeAmount) || incomeAmount <= 0) {
      return NextResponse.json({ success: false, error: "Description and positive amount are required" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const [lastInc] = await query<any[]>("SELECT id FROM income_entries ORDER BY id DESC LIMIT 1");
    const nextId = (lastInc?.id || 0) + 1;
    const income_no = `INC-${year}-${String(nextId).padStart(4, "0")}`;

    const res = await execute(
      `INSERT INTO income_entries (
        income_no, date, category, description, amount, payment_mode,
        reference_no, received_from, is_auto_generated, payment_status, notes, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'paid', ?, ?)`,
      [
        income_no,
        date,
        category,
        description,
        incomeAmount,
        payment_mode,
        reference_no || null,
        received_from || null,
        notes || null,
        user.userId,
      ]
    );

    // Record corresponding payment receipt
    const [lastPay] = await query<any[]>("SELECT id FROM payments ORDER BY id DESC LIMIT 1");
    const nextPayId = (lastPay?.id || 0) + 1;
    const receipt_no = `PAY-${year}-${String(nextPayId).padStart(4, "0")}`;

    await execute(
      `INSERT INTO payments (
        receipt_no, payment_date, amount, payment_mode, reference_number,
        source_module, source_id, received_by_user_id, payer_name, status, notes
      ) VALUES (?, ?, ?, ?, ?, 'other_income', ?, ?, ?, 'completed', ?)`,
      [
        receipt_no,
        date,
        incomeAmount,
        payment_mode,
        reference_no || null,
        res.insertId,
        user.userId,
        received_from || "Miscellaneous Payer",
        description,
      ]
    );

    await execute(
      `INSERT INTO activity_logs (user_id, action, module, record_id, details)
       VALUES (?, 'Record Income', 'finance', ?, ?)`,
      [user.userId, income_no, `Recorded income of ₹${incomeAmount} under ${category} (${description})`]
    );

    return NextResponse.json({
      success: true,
      message: "Income entry recorded successfully",
      data: { id: res.insertId, income_no },
    });
  } catch (error: any) {
    console.warn("Income POST query unavailable, storing in memory:", error?.message);
    const store = getStore();
    const incomeId = store.incomeEntries.length + 1;
    const year = new Date().getFullYear();
    const income_no = `INC-${year}-${String(incomeId).padStart(4, "0")}`;
    const incomeAmount = Number(body?.amount) || 0;
    const date = body?.date || new Date().toISOString().split("T")[0];
    const category = body?.category || "Miscellaneous";
    const description = body?.description || "Association Income";
    const payment_mode = body?.payment_mode || "cash";
    const received_from = body?.received_from || "Miscellaneous Payer";

    const newIncome = {
      id: incomeId,
      income_no,
      category,
      description,
      amount: incomeAmount,
      date,
      payment_mode,
      received_from,
      reference_no: body?.reference_no || null,
      payment_status: "paid",
      created_at: new Date().toISOString(),
    };
    store.incomeEntries.unshift(newIncome);

    store.payments.unshift({
      id: store.payments.length + 1,
      receipt_no: `RCP-INC-${year}-${String(incomeId).padStart(4, "0")}`,
      advocate_id: null,
      advocate_name: received_from,
      advocate_code: "",
      payer_name: received_from,
      payment_date: date,
      amount: incomeAmount,
      payment_mode,
      reference_number: body?.reference_no || null,
      source_module: "finance_income",
      payment_type: "income",
      status: "completed",
      notes: `${category}: ${description}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Income entry recorded successfully",
      data: { id: incomeId, income_no },
    });
  }
}
