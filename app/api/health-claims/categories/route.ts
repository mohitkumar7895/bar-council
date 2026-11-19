import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const categories = await query<any[]>(
      "SELECT * FROM claim_categories WHERE claim_type = 'health_claim' AND is_active = 1 ORDER BY name ASC"
    );
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch health categories" }, { status: 500 });
  }
}
