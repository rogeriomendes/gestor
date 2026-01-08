import prisma from "@gestor/db";
import { AuditAction, AuditResourceType } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  activeTenantProcedure,
  protectedProcedure,
  router,
  tenantProcedure,
} from "../../index";
import { requirePermission } from "../../middleware/permissions";
import { createAuditLogFromContext } from "../../utils/audit-log";

export const tenantInfoRouter = router({
  /**
   * Obter estatísticas do tenant (para dashboard)
   * Permite acesso mesmo com assinatura expirada para exibir informações
   * Requer permissão DASHBOARD:READ
   */
  getTenantStats: tenantProcedure
    .use(requirePermission("DASHBOARD", "READ"))
    .query(async ({ ctx }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      const [users, branches] = await Promise.all([
        prisma.user.findMany({
          where: {
            tenantId: ctx.tenant.id,
          },
          select: {
            id: true,
            role: true,
          },
        }),
        prisma.tenantBranch.findMany({
          where: {
            tenantId: ctx.tenant.id,
            deletedAt: null,
          },
          select: {
            id: true,
            isMain: true,
            active: true,
          },
        }),
      ]);

      // Contar usuários por role
      const usersByRole = users.reduce(
        (acc, user) => {
          const role = (user as { role: string | null }).role || "SEM_ROLE";
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalUsers: users.length,
        usersByRole,
        totalBranches: branches.length,
        activeBranches: branches.filter((b) => b.active).length,
        mainBranches: branches.filter((b) => b.isMain).length,
      };
    }),

  /**
   * Obter informações do tenant do usuário logado
   * Retorna null se o usuário não tiver tenant associado
   * Para SUPER_ADMIN e TENANT_ADMIN, retorna role mesmo sem tenant
   */
  getMyTenant: protectedProcedure.query(async ({ ctx }) => {
    // Se não tem role, retornar null
    if (!ctx.role) {
      return null;
    }

    // SUPER_ADMIN não precisa de tenant
    // Retornar apenas a role (tenant será null)
    if (ctx.isSuperAdmin) {
      return {
        id: "",
        name: "",
        slug: "",
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { users: 0 },
        role: ctx.role,
        // Flag para indicar que é admin sem tenant
        _isAdminWithoutTenant: true,
      };
    }

    // Outros roles precisam de tenant
    if (!ctx.tenant) {
      return null;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenant.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      ...tenant,
      role: ctx.role,
    };
  }),

  /**
   * Atualizar configurações do tenant (requer permissão TENANT:UPDATE)
   */
  updateMyTenant: activeTenantProcedure
    .use(requirePermission("TENANT", "UPDATE"))
    .input(
      z.object({
        name: z.string().min(1).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      const previousTenant = { ...ctx.tenant };

      const tenant = await prisma.tenant.update({
        where: { id: ctx.tenant.id },
        data: input,
      });

      // Registrar atualização do tenant no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_TENANT,
          resourceType: AuditResourceType.TENANT,
          resourceId: tenant.id,
          metadata: {
            changes: input,
            previousValues: {
              name: previousTenant.name,
              active: previousTenant.active,
            },
          },
        },
        ctx
      );

      return tenant;
    }),
});
