import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword, verifyPassword, signSessionToken, getUserPermissions, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const sql = `
      SELECT u.id, u.name, u.email, u.password_hash, u.status, u.role_id,
             r.slug as role_slug, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
      LIMIT 1
    `;
    const users = await query<any[]>(sql, [email.toLowerCase().trim()]);

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Your account is inactive or suspended. Please contact the administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Fetch user's permissions
    const permissions = await getUserPermissions(user.id, user.role_id);

    // Sign session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roleId: user.role_id,
      roleSlug: user.role_slug,
      roleName: user.role_name,
      permissions,
    });

    // Update last_login
    await execute("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    // Log login activity
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await execute(
      "INSERT INTO activity_logs (user_id, action, module, record_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, "User Login", "auth", String(user.id), `Logged in from IP: ${ip}`, ip]
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleSlug: user.role_slug,
        roleName: user.role_name,
        permissions,
      },
    });

    // Set cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    const isDbError =
      error?.code === "ECONNREFUSED" ||
      error?.code === "ER_ACCESS_DENIED_ERROR" ||
      error?.code === "ETIMEDOUT" ||
      error?.code === "ENOTFOUND" ||
      error?.code === "PROTOCOL_CONNECTION_LOST";

    const host = process.env.DB_HOST || "127.0.0.1";
    const isVercel = !!process.env.VERCEL;

    let errorMsg = "Internal server error during authentication";
    if (isDbError) {
      if (isVercel && (host === "127.0.0.1" || host === "localhost")) {
        errorMsg = `Vercel cannot connect to local MySQL (${host}). Please configure your Cloud MySQL database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) in Vercel Environment Variables.`;
      } else {
        errorMsg = `Database connection failed (${error?.code}): Unable to connect to MySQL at ${host}:3306. Please verify your database credentials.`;
      }
    } else if (error?.message) {
      errorMsg = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
