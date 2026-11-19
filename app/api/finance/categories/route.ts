import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const categories = await query<any[]>(
      "SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY name ASC"
    );
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      fallback: true,
      data: [
        { id: 1, name: "Bar Library & Journals" },
        { id: 2, name: "Office Electricity & Utilities" },
        { id: 3, name: "Staff Salaries & Honorarium" },
        { id: 4, name: "Printing, Stationery & Waqalatnama" },
      ],
    });
  }
}
