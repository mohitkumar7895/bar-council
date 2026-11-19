import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const items = await query<any[]>(
      `SELECT wi.*,
        (SELECT COALESCE(SUM(quantity), 0) FROM waqalatnama_sale_items WHERE item_id = wi.id) as total_sold
       FROM waqalatnama_items wi
       ORDER BY wi.id ASC`
    );
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "waqalatnama:stock")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { item_code, item_name, description, unit_rate, current_stock = 0, low_stock_threshold = 50 } = body;

    if (!item_code || !item_name || !unit_rate) {
      return NextResponse.json({ success: false, error: "Code, Name, and Unit Rate are required" }, { status: 400 });
    }

    const res = await execute(
      `INSERT INTO waqalatnama_items (item_code, item_name, description, unit_rate, current_stock, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item_code, item_name, description || null, Number(unit_rate), Number(current_stock), Number(low_stock_threshold)]
    );

    if (Number(current_stock) > 0) {
      await execute(
        `INSERT INTO waqalatnama_stock_movements (item_id, movement_type, quantity, unit_price, balance_after, notes, user_id)
         VALUES (?, 'opening', ?, ?, ?, 'Opening Stock Setup', ?)`,
        [res.insertId, Number(current_stock), Number(unit_rate), Number(current_stock), user.userId]
      );
    }

    return NextResponse.json({ success: true, message: "Waqalatnama Item added successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
