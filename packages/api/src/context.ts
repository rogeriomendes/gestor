import { auth } from "@gestor/auth";
import prisma from "@gestor/db";
import { Role } from "@gestor/db/types";
import type { NextRequest } from "next/server";
import {
  buildContextFromUser,
  type CachedContext,
  type CachedTenant,
  getCachedContext,
} from "./utils/context-cache";

type TenantWithCredentials = CachedTenant | null;

export interface ContextReturn {
  db?: unknown;
  isSuperAdmin: boolean;
  permissions: Set<string>;
  req: NextRequest;
  role: Role | null;
  session: { user: { id: string } } | null;
  subscription: CachedContext["subscription"];
  tenant: TenantWithCredentials;
  userId: string | null;
}

export async function createContext(req: NextRequest): Promise<ContextReturn> {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return {
      session: null,
      tenant: null,
      subscription: null,
      role: null,
      isSuperAdmin: false,
      permissions: new Set<string>(),
      req,
      userId: null,
    };
  }

  const userId = session.user.id;

  const cached = await getCachedContext(userId);
  if (cached) {
    return {
      session,
      db: prisma,
      tenant: cached.tenant,
      subscription: cached.subscription,
      role: cached.user.role,
      isSuperAdmin: cached.user.role === Role.SUPER_ADMIN,
      permissions: new Set(cached.permissions),
      req,
      userId,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          active: true,
          deletedAt: true,
          dbHost: true,
          dbPort: true,
          dbUsername: true,
          dbPassword: true,
        },
      },
    },
  });

  if (!user) {
    return {
      session,
      tenant: null,
      subscription: null,
      role: null,
      isSuperAdmin: false,
      permissions: new Set<string>(),
      req,
      userId: null,
    };
  }

  const role = user.role as Role | null;
  const tenant = user.tenant;

  if (
    role &&
    role !== Role.SUPER_ADMIN &&
    role !== Role.TENANT_ADMIN &&
    !tenant
  ) {
    return {
      session,
      tenant: null,
      subscription: null,
      role: null,
      isSuperAdmin: false,
      permissions: new Set<string>(),
      req,
      userId,
    };
  }

  const cachedContext = await buildContextFromUser(
    userId,
    {
      id: user.id,
      role,
      tenantId: user.tenantId,
    },
    tenant
  );

  return {
    session,
    db: prisma,
    tenant: cachedContext.tenant,
    subscription: cachedContext.subscription,
    role: cachedContext.user.role,
    isSuperAdmin: cachedContext.user.role === Role.SUPER_ADMIN,
    permissions: new Set(cachedContext.permissions),
    req,
    userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
