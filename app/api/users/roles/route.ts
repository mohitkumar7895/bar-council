import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const roles = await query<any[]>("SELECT * FROM roles ORDER BY id ASC");
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      fallback: true,
      data: [
        { id: 1, name: "Super Admin", slug: "super_admin" },
        { id: 2, name: "Administrator / Secretary", slug: "admin_secretary" },
        { id: 3, name: "Accounts / Finance", slug: "accounts_finance" },
        { id: 4, name: "Data Entry / Office Staff", slug: "data_entry" },
        { id: 5, name: "Read-only / Committee User", slug: "readonly_committee" },
      ],
    });
  }
}
