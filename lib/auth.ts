import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { query } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "bar-council-secure-secret-token-key-2026-production"
);

export const COOKIE_NAME = "bar_session";

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  roleId: number;
  roleSlug: string;
  roleName: string;
  permissions?: string[];
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Retrieve the current authenticated user and their active permissions from DB/Session
 */
export async function getCurrentUser(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // Called outside request scope
      return null;
    }
  }

  if (!token) return null;
  const decoded = await verifySessionToken(token);
  if (!decoded) return null;

  // Instant fast path: If permissions or role are already verified in the JWT, return immediately
  if (decoded.roleSlug === "super_admin" || (decoded.permissions && Array.isArray(decoded.permissions))) {
    return decoded;
  }

  // Retrieve fresh user permissions as fallback
  try {
    const permissions = await getUserPermissions(decoded.userId, decoded.roleId);
    return {
      ...decoded,
      permissions,
    };
  } catch (err) {
    return decoded;
  }
}

export async function getUserPermissions(userId: number, roleId: number): Promise<string[]> {
  const sql = `
    SELECT DISTINCT p.code
    FROM permissions p
    LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ?
    LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = ?
    WHERE (rp.role_id IS NOT NULL AND (up.is_granted IS NULL OR up.is_granted = 1))
       OR (up.is_granted = 1)
  `;
  const rows = await query<{ code: string }[]>(sql, [roleId, userId]);
  return rows.map((r) => r.code);
}
