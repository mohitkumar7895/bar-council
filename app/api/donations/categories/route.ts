import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const categories = await query<any[]>(
      "SELECT * FROM donation_categories WHERE is_active = 1 ORDER BY name ASC"
    );
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      fallback: true,
      data: [
        { id: 1, name: "Library Books & Digital Access Corpus" },
        { id: 2, name: "Advocate Welfare & Distress Fund" },
        { id: 3, name: "Bar Room Modernization Fund" },
      ],
    });
  }
}
