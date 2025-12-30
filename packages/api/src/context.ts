import { auth } from "@gestor/auth";
import prisma from "@gestor/db";
import { Role } from "@gestor/db/types";
import type { NextRequest } from "next/server";

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  let tenant = null;
  let role: Role | null = null;
  let isSuperAdmin = false;
  let isTenantAdmin = false;

  if (session?.user?.id) {
    // Buscar User com tenant
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        tenant: true,
      },
    });

    if (user) {
      // Usar type assertion temporário até regenerar Prisma Client
      role = (user as any).role as Role | null;
      tenant = (user as any).tenant;
      isSuperAdmin = role === Role.SUPER_ADMIN;
      isTenantAdmin = role === Role.TENANT_ADMIN || isSuperAdmin;

      // SUPER_ADMIN e TENANT_ADMIN não precisam de tenant
      // Mas se tiverem, usar o tenant
      // Para outros roles, tenant é obrigatório
      if (
        role &&
        role !== Role.SUPER_ADMIN &&
        role !== Role.TENANT_ADMIN &&
        !tenant
      ) {
        // Role que exige tenant mas não tem - limpar role
        role = null;
        tenant = null;
      }
    }
  }

  return {
    session,
    tenant,
    role,
    isSuperAdmin,
    isTenantAdmin,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
