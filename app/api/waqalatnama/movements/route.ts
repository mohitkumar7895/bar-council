import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (itemId) {
      where += " AND wsm.item_id = ?";
      params.push(itemId);
    }

    const sql = `
      SELECT
        wsm.*,
        wi.item_name,
        wi.item_code,
        u.name as user_name
      FROM waqalatnama_stock_movements wsm
      JOIN waqalatnama_items wi ON wsm.item_id = wi.id
      LEFT JOIN users u ON wsm.user_id = u.id
      ${where}
      ORDER BY wsm.created_at DESC
      LIMIT 100
    `;

    const records = await query<any[]>(sql, params);
    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch movements" }, { status: 500 });
  }
}
