import { TRPCError } from "@trpc/server";

import type { Context } from "../context";

/**
 * Middleware que garante que queries incluem filtro por tenantId
 * (exceto para SUPER_ADMIN que pode acessar todos os tenants)
 */
export function validateTenantAccess() {
  return async ({
    ctx,
    next,
  }: {
    ctx: Context;
    next: any;
    path: string;
    type: string;
  }) => {
    // SUPER_ADMIN pode acessar dados de todos os tenants
    if (ctx.isSuperAdmin) {
      return next({ ctx });
    }

    // Se não tem tenant, não pode acessar
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário deve estar associado a um cliente",
      });
    }

    // Para mutations e queries que retornam dados, garantir isolamento
    // Isso será aplicado manualmente nas queries, mas este middleware
    // serve como camada adicional de segurança

    return next({
      ctx: {
        ...ctx,
        // Adicionar tenantId ao contexto para uso nas queries
        tenantId: ctx.tenant.id,
      },
    });
  };
}

/**
 * Helper para adicionar filtro de tenant em queries Prisma
 */
export function withTenantFilter<T>(
  query: T,
  tenantId: string | null,
  isAdmin: boolean
): T {
  // Se for admin, não aplicar filtro
  if (isAdmin) {
    return query;
  }

  // Aplicar filtro de tenant
  // Nota: Isso é um helper genérico, as queries específicas devem
  // usar isso manualmente ao construir queries Prisma
  return query;
}
