import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const roles = await query<any[]>("SELECT * FROM roles ORDER BY id ASC");
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch roles" }, { status: 500 });
  }
}
