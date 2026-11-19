import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.roleSlug !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = Number(id);
    const body = await req.json();

    const { name, email, phone, role_id, status, password } = body;

    let updateSql = `UPDATE users SET name = ?, email = ?, phone = ?, role_id = ?, status = ?`;
    const updateParams: any[] = [name, email.toLowerCase().trim(), phone || null, Number(role_id), status];

    if (password && password.trim().length > 0) {
      const passwordHash = await hashPassword(password);
      updateSql += `, password_hash = ?`;
      updateParams.push(passwordHash);
    }

    updateSql += ` WHERE id = ?`;
    updateParams.push(targetUserId);

    await execute(updateSql, updateParams);

    return NextResponse.json({ success: true, message: "User account updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.roleSlug !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = Number(id);

    if (currentUser.userId === targetUserId) {
      return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 });
    }

    // Check if target is super_admin and if it's the last one
    const [superAdmins] = await query<any[]>(
      "SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE slug = 'super_admin')"
    );
    if (superAdmins.length <= 1 && superAdmins.some((u: any) => u.id === targetUserId)) {
      return NextResponse.json({ success: false, error: "Cannot delete the sole Super Admin of the system" }, { status: 400 });
    }

    await execute("DELETE FROM users WHERE id = ?", [targetUserId]);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
