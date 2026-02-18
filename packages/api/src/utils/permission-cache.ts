import prisma from "@gestor/db";
import type { Role } from "@gestor/db/types";
import { LRUCache } from "lru-cache";

/**
 * In-memory LRU cache for role permissions
 * Reduces context creation time by ~50-100ms per authenticated request
 * TTL: 15 minutes
 */
const permissionCache = new LRUCache<Role, Set<string>>({
  max: 50, // Max 50 roles (more than enough for typical usage)
  ttl: 1000 * 60 * 15, // 15 minutes TTL
});

/**
 * Get permissions for a role, using cache when available
 * @param role - The role to get permissions for
 * @returns Set of permission strings in format "resource:action"
 */
export async function getPermissionsForRole(role: Role): Promise<Set<string>> {
  // Check cache first
  const cached = permissionCache.get(role);
  if (cached) {
    return cached;
  }

  // Cache miss - query database
  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      role,
      granted: true,
    },
    select: {
      permission: {
        select: {
          resource: true,
          action: true,
        },
      },
    },
  });

  // Build permission set
  const permissions = new Set(
    rolePermissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`
    )
  );

  // Store in cache
  permissionCache.set(role, permissions);

  return permissions;
}

/**
 * Invalidate permission cache for a specific role or all roles
 * Should be called when permissions are updated/created/deleted
 * @param role - Optional role to invalidate. If not provided, clears entire cache
 */
export function invalidatePermissionCache(role?: Role): void {
  if (role) {
    permissionCache.delete(role);
  } else {
    permissionCache.clear();
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getPermissionCacheStats() {
  return {
    size: permissionCache.size,
    max: permissionCache.max,
    calculatedSize: permissionCache.calculatedSize,
  };
}
