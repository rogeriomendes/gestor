import { auth } from "@gestor/auth";
import prisma from "@gestor/db";
import { Role } from "@gestor/db/types";
import type { NextRequest } from "next/server";
import { getPermissionsForRole } from "./utils/permission-cache";
import {
  getActiveSubscription,
  type SubscriptionWithPlan,
} from "./utils/subscription";

type TenantWithCredentials = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  deletedAt: Date | null;
  dbHost: string | null;
  dbPort: string | null;
  dbUsername: string | null;
  dbPassword: string | null;
} | null;

export interface ContextReturn {
  db?: unknown;
  isSuperAdmin: boolean;
  permissions: Set<string>;
  req: NextRequest;
  role: Role | null;
  session: { user: { id: string } } | null;
  subscription: SubscriptionWithPlan | null;
  tenant: TenantWithCredentials;
}

export async function createContext(req: NextRequest): Promise<ContextReturn> {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // Retornar contexto vazio se não houver sessão
  if (!session?.user?.id) {
    return {
      session: null,
      tenant: null,
      subscription: null,
      role: null,
      isSuperAdmin: false,
      permissions: new Set<string>(),
      req,
    };
  }

  // Buscar User com tenant
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
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
    };
  }

  // Extrair role e tenant do resultado da query
  const role = user.role as Role | null;
  const tenant = user.tenant;
  const isSuperAdmin = role === Role.SUPER_ADMIN;

  // Carregar permissões da role apenas se necessário (não é SUPER_ADMIN)
  // Usando cache para evitar query em toda requisição (ganho: ~50-100ms)
  let permissions: Set<string> = new Set();
  if (role && !isSuperAdmin) {
    permissions = await getPermissionsForRole(role);
  }

  // SUPER_ADMIN e TENANT_ADMIN não precisam de tenant
  // Outros roles precisam de tenant para funcionar
  if (
    role &&
    role !== Role.SUPER_ADMIN &&
    role !== Role.TENANT_ADMIN &&
    !tenant
  ) {
    // Role que exige tenant mas não tem - limpar role
    return {
      session,
      tenant: null,
      subscription: null,
      role: null,
      isSuperAdmin: false,
      permissions: new Set<string>(),
      req,
    };
  }

  const subscription = tenant ? await getActiveSubscription(tenant.id) : null;

  return {
    session,
    db: prisma,
    tenant,
    subscription,
    role,
    isSuperAdmin,
    permissions,
    req, // Passar request para audit logs
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
