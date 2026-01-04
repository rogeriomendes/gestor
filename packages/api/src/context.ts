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
  let permissions: Set<string> = new Set();

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

      // Carregar permissões da role
      if (role && !isSuperAdmin) {
        const rolePermissions = await prisma.rolePermission.findMany({
          where: {
            role,
            granted: true,
          },
          include: {
            permission: true,
          },
        });

        permissions = new Set(
          rolePermissions.map(
            (rp) => `${rp.permission.resource}:${rp.permission.action}`
          )
        );
      }

      // SUPER_ADMIN não precisa de tenant
      // Outros roles precisam de tenant para funcionar
      if (role && role !== Role.SUPER_ADMIN && !tenant) {
        // Role que exige tenant mas não tem - limpar role
        role = null;
        tenant = null;
        permissions = new Set();
      }
    }
  }

  return {
    session,
    tenant,
    role,
    isSuperAdmin,
    permissions,
    req, // Passar request para audit logs
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
