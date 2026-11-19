import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "users:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const sql = `
      SELECT
        u.id, u.name, u.email, u.phone, u.status, u.role_id,
        u.last_login, u.created_at,
        r.name as role_name, r.slug as role_slug
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `;

    const users = await query<any[]>(sql);
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.roleSlug !== "super_admin") {
      return NextResponse.json({ success: false, error: "Only Super Admin can create users" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, phone, role_id, status = "active" } = body;

    if (!name || !email || !password || !role_id) {
      return NextResponse.json({ success: false, error: "Name, email, password, and role are required" }, { status: 400 });
    }

    const [existing] = await query<any[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [email.toLowerCase().trim()]);
    if (existing) {
      return NextResponse.json({ success: false, error: "Email is already registered" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const res = await execute(
      `INSERT INTO users (role_id, name, email, password_hash, phone, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(role_id), name.trim(), email.toLowerCase().trim(), passwordHash, phone || null, status]
    );

    await execute(
      `INSERT INTO activity_logs (user_id, action, module, record_id, details)
       VALUES (?, 'Create User', 'users', ?, ?)`,
      [user.userId, String(res.insertId), `Created user ${name} (${email})`]
    );

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: { id: res.insertId, name, email },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
