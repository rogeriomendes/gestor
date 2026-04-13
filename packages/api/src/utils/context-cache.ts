import prisma from "@gestor/db";
import type { Role, SubscriptionStatus } from "@gestor/db/types";
import { LRUCache } from "lru-cache";

export interface CachedUser {
  id: string;
  role: Role | null;
  tenantId: string | null;
}

export interface CachedTenant {
  active: boolean;
  dbHost: string | null;
  dbPassword: string | null;
  dbPort: string | null;
  dbUsername: string | null;
  deletedAt: Date | null;
  id: string;
  name: string;
  slug: string;
}

export interface CachedSubscription {
  expiresAt: Date | null;
  id: string;
  plan: {
    id: string;
    name: string;
    price: number;
  };
  planId: string;
  status: SubscriptionStatus;
  tenantId: string;
  trialEndsAt: Date | null;
}

export interface CachedContext {
  cachedAt: Date;
  permissions: string[];
  subscription: CachedSubscription | null;
  tenant: CachedTenant | null;
  user: CachedUser;
}

const CACHE_MAX_SIZE = 500;
const CACHE_TTL_MS = 1000 * 60 * 5;

const contextCache = new LRUCache<string, CachedContext>({
  max: CACHE_MAX_SIZE,
  ttl: CACHE_TTL_MS,
});

const cacheMetrics = {
  hits: 0,
  misses: 0,
  builds: 0,
  buildTimeMsTotal: 0,
  invalidationsUser: 0,
  invalidationsAll: 0,
};

async function getPermissionsForRole(role: Role): Promise<string[]> {
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

  return rolePermissions.map(
    (rp) => `${rp.permission.resource}:${rp.permission.action}`
  );
}

function getSubscriptionForTenant(tenantId: string) {
  return prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });
}

export function getCachedContext(userId: string): CachedContext | null {
  const cached = contextCache.get(userId) || null;
  if (cached) {
    cacheMetrics.hits += 1;
  } else {
    cacheMetrics.misses += 1;
  }
  return cached;
}

export function setCachedContext(userId: string, context: CachedContext): void {
  contextCache.set(userId, context);
}

export function invalidateUserContext(userId: string): void {
  cacheMetrics.invalidationsUser += 1;
  contextCache.delete(userId);
}

export function invalidateAllContexts(): void {
  cacheMetrics.invalidationsAll += 1;
  contextCache.clear();
}

export function clearContextCache(): { clearedCount: number } {
  const clearedCount = contextCache.size;
  invalidateAllContexts();
  return { clearedCount };
}

export async function buildContextFromUser(
  userId: string,
  userData: {
    id: string;
    role: Role | null;
    tenantId: string | null;
  },
  tenantData: CachedTenant | null
): Promise<CachedContext> {
  const buildStartedAt = Date.now();
  const role = userData.role;
  const isSuperAdmin = role === ("SUPER_ADMIN" as Role);

  let permissions: string[] = [];
  if (role && !isSuperAdmin) {
    permissions = await getPermissionsForRole(role);
  }

  const subscription = tenantData
    ? await getSubscriptionForTenant(tenantData.id)
    : null;

  const cachedSubscription = subscription
    ? {
        id: subscription.id,
        tenantId: subscription.tenantId,
        planId: subscription.planId,
        status: subscription.status,
        expiresAt: subscription.expiresAt,
        trialEndsAt: subscription.trialEndsAt,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: Number(subscription.plan.price),
        },
      }
    : null;

  const context: CachedContext = {
    user: {
      id: userData.id,
      role: userData.role,
      tenantId: userData.tenantId,
    },
    tenant: tenantData,
    subscription: cachedSubscription,
    permissions,
    cachedAt: new Date(),
  };

  setCachedContext(userId, context);
  cacheMetrics.builds += 1;
  cacheMetrics.buildTimeMsTotal += Date.now() - buildStartedAt;

  return context;
}

export function getCacheStats() {
  const averageBuildTimeMs =
    cacheMetrics.builds > 0
      ? Math.round(cacheMetrics.buildTimeMsTotal / cacheMetrics.builds)
      : 0;
  const totalLookups = cacheMetrics.hits + cacheMetrics.misses;
  const hitRate =
    totalLookups > 0
      ? Number((cacheMetrics.hits / totalLookups).toFixed(4))
      : 0;

  return {
    size: contextCache.size,
    max: contextCache.max,
    ttlMs: CACHE_TTL_MS,
    ...cacheMetrics,
    averageBuildTimeMs,
    hitRate,
  };
}
