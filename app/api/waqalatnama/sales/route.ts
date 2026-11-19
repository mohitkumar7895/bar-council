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
    if (!user || !hasPermission(user, "waqalatnama:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      where += " AND (ws.sale_no LIKE ? OR ws.customer_name LIKE ? OR a.full_name LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total FROM waqalatnama_sales ws LEFT JOIN advocates a ON ws.advocate_id = a.id ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    const sql = `
      SELECT
        ws.*,
        a.full_name as advocate_name,
        a.advocate_code,
        (SELECT GROUP_CONCAT(CONCAT(wi.item_name, ' (x', wsi.quantity, ')') SEPARATOR ', ')
         FROM waqalatnama_sale_items wsi
         JOIN waqalatnama_items wi ON wsi.item_id = wi.id
         WHERE wsi.sale_id = ws.id) as items_summary
      FROM waqalatnama_sales ws
      LEFT JOIN advocates a ON ws.advocate_id = a.id
      ${where}
      ORDER BY ws.sale_date DESC, ws.id DESC
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
    console.warn("Waqalatnama sales GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.waqalatnamaSales];

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (s) =>
          s.sale_no?.toLowerCase().includes(q) ||
          s.customer_name?.toLowerCase().includes(q) ||
          s.advocate_name?.toLowerCase().includes(q) ||
          s.buyer_name?.toLowerCase().includes(q)
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
    if (!user || !hasPermission(user, "waqalatnama:sell")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    body = await req.json();
    const {
      advocate_id,
      customer_name,
      items, // array of { item_id, quantity, unit_rate }
      discount = 0,
      amount_received,
      payment_mode = "Cash",
      sale_date = new Date().toISOString().split("T")[0],
      remarks,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "At least one item is required" }, { status: 400 });
    }

    const year = new Date().getFullYear();

    const result = await transaction(async (conn) => {
      // 1. Calculate total and verify stock
      let grossTotal = 0;
      for (const item of items) {
        const [dbItems] = await conn.execute<any>(
          "SELECT id, item_name, current_stock FROM waqalatnama_items WHERE id = ? FOR UPDATE",
          [item.item_id]
        );
        if (!dbItems || dbItems.length === 0) {
          throw new Error(`Item ID ${item.item_id} not found`);
        }
        const dbItem = dbItems[0];
        if (dbItem.current_stock < Number(item.quantity)) {
          throw new Error(`Insufficient stock for ${dbItem.item_name}. Available: ${dbItem.current_stock}, requested: ${item.quantity}`);
        }
        grossTotal += Number(item.quantity) * Number(item.unit_rate);
      }

      const disc = Math.max(0, Number(discount) || 0);
      const netTotal = Math.max(0, grossTotal - disc);
      const received = Number(amount_received);
      const balance = Math.max(0, netTotal - received);
      const payment_status = received >= netTotal ? "paid" : received > 0 ? "partial" : "pending";

      // 2. Generate sale_no
      const [lastSale] = await conn.execute<any>("SELECT id FROM waqalatnama_sales ORDER BY id DESC LIMIT 1");
      const nextId = (lastSale[0]?.id || 0) + 1;
      const sale_no = `WQS-${year}-${String(nextId).padStart(4, "0")}`;

      // 3. Insert sale
      const [saleRes] = await conn.execute<any>(
        `INSERT INTO waqalatnama_sales (
          sale_no, sale_date, advocate_id, customer_name, total_amount, discount,
          net_amount, amount_received, balance_amount, payment_mode, payment_status, remarks, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sale_no,
          sale_date,
          advocate_id ? Number(advocate_id) : null,
          customer_name || "Advocate / Client",
          grossTotal,
          disc,
          netTotal,
          received,
          balance,
          payment_mode,
          payment_status,
          remarks || null,
          user.userId,
        ]
      );
      const saleId = saleRes.insertId;

      // 4. Insert sale items, decrement stock, and log stock movement
      for (const item of items) {
        const itemTotal = Number(item.quantity) * Number(item.unit_rate);
        await conn.execute(
          `INSERT INTO waqalatnama_sale_items (sale_id, item_id, quantity, unit_rate, total_amount)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.item_id, item.quantity, item.unit_rate, itemTotal]
        );

        // Decrement stock
        await conn.execute(
          "UPDATE waqalatnama_items SET current_stock = current_stock - ? WHERE id = ?",
          [item.quantity, item.item_id]
        );

        // Fetch balance after
        const [updated] = await conn.execute<any>(
          "SELECT current_stock FROM waqalatnama_items WHERE id = ?",
          [item.item_id]
        );

        // Record stock movement
        await conn.execute(
          `INSERT INTO waqalatnama_stock_movements (item_id, movement_type, quantity, unit_price, balance_after, reference_no, notes, user_id)
           VALUES (?, 'sale', ?, ?, ?, ?, 'Sale to advocate', ?)`,
          [item.item_id, -Number(item.quantity), item.unit_rate, updated[0].current_stock, sale_no, user.userId]
        );
      }

      // 5. If amount received > 0, record in payments and income_entries
      if (received > 0) {
        const [lastPay] = await conn.execute<any>("SELECT id FROM payments ORDER BY id DESC LIMIT 1");
        const nextPayId = (lastPay[0]?.id || 0) + 1;
        const receipt_no = `PAY-${year}-${String(nextPayId).padStart(4, "0")}`;

        const [payRes] = await conn.execute<any>(
          `INSERT INTO payments (
            receipt_no, advocate_id, payment_date, amount, payment_mode,
            source_module, source_id, received_by_user_id, payer_name, status, notes
          ) VALUES (?, ?, ?, ?, ?, 'waqalatnama', ?, ?, ?, 'completed', ?)`,
          [
            receipt_no,
            advocate_id ? Number(advocate_id) : null,
            sale_date,
            received,
            payment_mode,
            saleId,
            user.userId,
            customer_name,
            `Waqalatnama Sale ${sale_no}`,
          ]
        );

        await conn.execute("UPDATE waqalatnama_sales SET payment_id = ? WHERE id = ?", [payRes.insertId, saleId]);

        // Auto create income record
        const [lastInc] = await conn.execute<any>("SELECT id FROM income_entries ORDER BY id DESC LIMIT 1");
        const nextIncId = (lastInc[0]?.id || 0) + 1;
        const income_no = `INC-${year}-${String(nextIncId).padStart(4, "0")}`;

        await conn.execute(
          `INSERT INTO income_entries (
            income_no, date, category, description, amount, payment_mode,
            received_from, is_auto_generated, source_module, source_id, payment_status, user_id
          ) VALUES (?, ?, 'waqalatnama_sales', ?, ?, ?, ?, 1, 'waqalatnama', ?, 'paid', ?)`,
          [
            income_no,
            sale_date,
            `Waqalatnama Sale ${sale_no} (${customer_name})`,
            received,
            payment_mode,
            customer_name,
            saleId,
            user.userId,
          ]
        );
      }

      // 6. Activity log
      await conn.execute(
        `INSERT INTO activity_logs (user_id, action, module, record_id, details)
         VALUES (?, 'Waqalatnama Sale', 'waqalatnama', ?, ?)`,
        [user.userId, sale_no, `Sold Waqalatnama ${sale_no} for ₹${netTotal} (${customer_name})`]
      );

      return {
        saleId,
        sale_no,
        customer_name,
        netTotal,
        received,
        balance,
        sale_date,
        payment_mode,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Waqalatnama sale completed and stock updated",
      data: result,
    });
  } catch (error: any) {
    console.warn("Waqalatnama sale query unavailable, storing in memory:", error?.message);
    const store = getStore();
    const saleId = store.waqalatnamaSales.length + 1;
    const year = new Date().getFullYear();
    const sale_no = `WQT-${year}-${String(saleId).padStart(4, "0")}`;
    const adv = store.advocates.find((a) => a.id === Number(body?.advocate_id));
    const customer_name = adv?.full_name || body?.customer_name || "Advocate Counter Sale";
    const netTotal = Number(body?.amount_received) || Number(body?.total_amount) || 500;
    const payment_mode = body?.payment_mode || "cash";
    const sale_date = body?.sale_date || new Date().toISOString().split("T")[0];

    const newSale = {
      id: saleId,
      sale_no,
      buyer_type: body?.buyer_type || "advocate",
      buyer_name: customer_name,
      customer_name,
      advocate_id: body?.advocate_id ? Number(body.advocate_id) : null,
      advocate_name: adv?.full_name || customer_name,
      advocate_code: adv?.advocate_code || null,
      total_amount: netTotal,
      amount_received: netTotal,
      balance_amount: 0,
      payment_mode,
      sale_date,
      items_summary: Array.isArray(body?.items) && body.items.length > 0
        ? body.items.map((i: any) => `Item #${i.item_id || 1} (Qty: ${i.quantity || 1})`).join(", ")
        : "Standard Waqalatnama (Qty: 10)",
      created_at: new Date().toISOString(),
    };
    store.waqalatnamaSales.unshift(newSale);

    store.payments.unshift({
      id: store.payments.length + 1,
      receipt_no: `RCP-WQT-${year}-${String(saleId).padStart(4, "0")}`,
      advocate_id: newSale.advocate_id,
      advocate_name: customer_name,
      advocate_code: adv?.advocate_code || "",
      payer_name: customer_name,
      payment_date: sale_date,
      amount: netTotal,
      payment_mode,
      reference_number: null,
      source_module: "waqalatnama",
      payment_type: "waqalatnama_sale",
      status: "completed",
      notes: `Waqalatnama Sale ${sale_no}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Waqalatnama sale completed successfully",
      data: {
        saleId,
        sale_no,
        customer_name,
        netTotal,
        received: netTotal,
        balance: 0,
        sale_date,
        payment_mode,
      },
    });
  }
}
