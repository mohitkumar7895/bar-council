import { SessionPayload } from "./auth";

/**
 * Check if the user has a specific permission code or is a Super Admin
 */
export function hasPermission(user: SessionPayload | null | undefined, permissionCode: string): boolean {
  if (!user) return false;
  if (user.roleSlug === "super_admin") return true;
  if (!user.permissions) return false;
  return user.permissions.includes(permissionCode);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: SessionPayload | null | undefined, permissionCodes: string[]): boolean {
  if (!user) return false;
  if (user.roleSlug === "super_admin") return true;
  if (!user.permissions) return false;
  return permissionCodes.some((code) => user.permissions?.includes(code));
}

/**
 * Check if user has specific role
 */
export function hasRole(user: SessionPayload | null | undefined, allowedRoles: string[]): boolean {
  if (!user) return false;
  if (user.roleSlug === "super_admin") return true;
  return allowedRoles.includes(user.roleSlug);
}
