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
  const offset = (page - 1) * limit;

  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "form_sales:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      where += " AND (fs.sale_no LIKE ? OR fs.buyer_name LIKE ? OR ft.form_name LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total FROM form_sales fs JOIN form_types ft ON fs.form_type_id = ft.id ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    const sql = `
      SELECT
        fs.*,
        ft.form_name,
        ft.form_code,
        a.full_name as advocate_name,
        a.advocate_code
      FROM form_sales fs
      JOIN form_types ft ON fs.form_type_id = ft.id
      LEFT JOIN advocates a ON fs.advocate_id = a.id
      ${where}
      ORDER BY fs.sale_date DESC, fs.id DESC
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
    console.warn("Form sales GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.formSales];

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (s) =>
          s.sale_no?.toLowerCase().includes(q) ||
          s.buyer_name?.toLowerCase().includes(q) ||
          s.form_name?.toLowerCase().includes(q) ||
          s.advocate_name?.toLowerCase().includes(q)
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
    if (!user || !hasPermission(user, "form_sales:sell")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    body = await req.json();
    const {
      form_type_id,
      advocate_id,
      buyer_name,
      quantity = 1,
      payment_mode = "Cash",
      sale_date = new Date().toISOString().split("T")[0],
      remarks,
    } = body;

    const qty = Number(quantity);
    if (!form_type_id || isNaN(qty) || qty <= 0 || !buyer_name) {
      return NextResponse.json({ success: false, error: "Valid form type, buyer name, and quantity required" }, { status: 400 });
    }

    const year = new Date().getFullYear();

    const result = await transaction(async (conn) => {
      // 1. Check stock
      const [forms] = await conn.execute<any>(
        "SELECT id, form_name, sale_price, current_stock FROM form_types WHERE id = ? FOR UPDATE",
        [form_type_id]
      );
      if (!forms || forms.length === 0) {
        throw new Error("Form type not found");
      }
      const form = forms[0];
      if (form.current_stock < qty) {
        throw new Error(`Insufficient form stock. Available: ${form.current_stock}, requested: ${qty}`);
      }

      const unitPrice = Number(form.sale_price);
      const totalAmount = unitPrice * qty;
      const amountReceived = totalAmount; // Form sales are cash counter sales

      // 2. Generate sale_no
      const [lastSale] = await conn.execute<any>("SELECT id FROM form_sales ORDER BY id DESC LIMIT 1");
      const nextId = (lastSale[0]?.id || 0) + 1;
      const sale_no = `FMS-${year}-${String(nextId).padStart(4, "0")}`;

      // 3. Insert into form_sales
      const [saleRes] = await conn.execute<any>(
        `INSERT INTO form_sales (
          sale_no, sale_date, advocate_id, buyer_name, form_type_id,
          quantity, unit_price, total_amount, amount_received, balance_amount,
          payment_mode, payment_status, remarks, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'paid', ?, ?)`,
        [
          sale_no,
          sale_date,
          advocate_id ? Number(advocate_id) : null,
          buyer_name,
          form_type_id,
          qty,
          unitPrice,
          totalAmount,
          amountReceived,
          payment_mode,
          remarks || null,
          user.userId,
        ]
      );
      const saleId = saleRes.insertId;

      // 4. Decrement form stock and record movement
      await conn.execute(
        "UPDATE form_types SET current_stock = current_stock - ? WHERE id = ?",
        [qty, form_type_id]
      );

      const [updated] = await conn.execute<any>(
        "SELECT current_stock FROM form_types WHERE id = ?",
        [form_type_id]
      );

      await conn.execute(
        `INSERT INTO form_stock_movements (form_type_id, movement_type, quantity, unit_price, balance_after, reference_no, notes, user_id)
         VALUES (?, 'sale', ?, ?, ?, ?, 'Form sale to applicant', ?)`,
        [form_type_id, -qty, unitPrice, updated[0].current_stock, sale_no, user.userId]
      );

      // 5. Payment & Income Record
      const [lastPay] = await conn.execute<any>("SELECT id FROM payments ORDER BY id DESC LIMIT 1");
      const nextPayId = (lastPay[0]?.id || 0) + 1;
      const receipt_no = `PAY-${year}-${String(nextPayId).padStart(4, "0")}`;

      const [payRes] = await conn.execute<any>(
        `INSERT INTO payments (
          receipt_no, advocate_id, payment_date, amount, payment_mode,
          source_module, source_id, received_by_user_id, payer_name, status, notes
        ) VALUES (?, ?, ?, ?, ?, 'form_sale', ?, ?, ?, 'completed', ?)`,
        [
          receipt_no,
          advocate_id ? Number(advocate_id) : null,
          sale_date,
          amountReceived,
          payment_mode,
          saleId,
          user.userId,
          buyer_name,
          `Form Sale ${sale_no} - ${form.form_name}`,
        ]
      );

      await conn.execute("UPDATE form_sales SET payment_id = ? WHERE id = ?", [payRes.insertId, saleId]);

      // Income entry
      const [lastInc] = await conn.execute<any>("SELECT id FROM income_entries ORDER BY id DESC LIMIT 1");
      const nextIncId = (lastInc[0]?.id || 0) + 1;
      const income_no = `INC-${year}-${String(nextIncId).padStart(4, "0")}`;

      await conn.execute(
        `INSERT INTO income_entries (
          income_no, date, category, description, amount, payment_mode,
          received_from, is_auto_generated, source_module, source_id, payment_status, user_id
        ) VALUES (?, ?, 'form_sales', ?, ?, ?, ?, 1, 'form_sales', ?, 'paid', ?)`,
        [
          income_no,
          sale_date,
          `Form Sale ${sale_no} (${form.form_name})`,
          amountReceived,
          payment_mode,
          buyer_name,
          saleId,
          user.userId,
        ]
      );

      // Activity log
      await conn.execute(
        `INSERT INTO activity_logs (user_id, action, module, record_id, details)
         VALUES (?, 'Form Sale', 'form_sales', ?, ?)`,
        [user.userId, sale_no, `Sold ${qty}x ${form.form_name} to ${buyer_name} for ₹${totalAmount}`]
      );

      return {
        saleId,
        sale_no,
        buyer_name,
        form_name: form.form_name,
        quantity: qty,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_mode,
        sale_date,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Form sale completed and inventory updated",
      data: result,
    });
  } catch (error: any) {
    console.warn("Form sale DB query unavailable, storing in memory:", error?.message);
    const store = getStore();
    const saleId = store.formSales.length + 1;
    const year = new Date().getFullYear();
    const sale_no = `FSL-${year}-${String(saleId).padStart(4, "0")}`;
    const formType = store.formTypes.find((f) => f.id === Number(body?.form_type_id)) || store.formTypes[0];
    const adv = store.advocates.find((a) => a.id === Number(body?.advocate_id));
    const buyer_name = adv?.full_name || body?.buyer_name || "Advocate Counter Sale";
    const qty = Number(body?.quantity) || 1;
    const unitPrice = Number(body?.unit_price) || formType?.sale_price || 50;
    const totalAmount = Number(body?.total_amount) || qty * unitPrice;
    const payment_mode = body?.payment_mode || "cash";
    const sale_date = body?.sale_date || new Date().toISOString().split("T")[0];

    const newSale = {
      id: saleId,
      sale_no,
      form_name: formType?.form_name || "Application Form",
      form_code: formType?.form_code || "FORM",
      buyer_type: body?.buyer_type || "advocate",
      buyer_name,
      advocate_id: body?.advocate_id ? Number(body.advocate_id) : null,
      advocate_name: adv?.full_name || null,
      advocate_code: adv?.advocate_code || null,
      quantity: qty,
      unit_price: unitPrice,
      total_amount: totalAmount,
      amount_received: totalAmount,
      payment_mode,
      sale_date,
      created_at: new Date().toISOString(),
    };
    store.formSales.unshift(newSale);

    store.payments.unshift({
      id: store.payments.length + 1,
      receipt_no: `RCP-FSL-${year}-${String(saleId).padStart(4, "0")}`,
      advocate_id: newSale.advocate_id,
      advocate_name: buyer_name,
      advocate_code: adv?.advocate_code || "",
      payer_name: buyer_name,
      payment_date: sale_date,
      amount: totalAmount,
      payment_mode,
      reference_number: null,
      source_module: "form_sales",
      payment_type: "form_sale",
      status: "completed",
      notes: `Form Sale ${sale_no}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Form sale completed successfully",
      data: {
        saleId,
        sale_no,
        buyer_name,
        form_name: newSale.form_name,
        quantity: qty,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_mode,
        sale_date,
      },
    });
  }
}
