import prisma from "@gestor/db";
import { AuditAction, AuditResourceType, Role } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  activeTenantProcedure,
  protectedProcedure,
  router,
  tenantProcedure,
} from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";
import { requireAnyRole, requireRole } from "../../middleware/roles";
import { createAuditLogFromContext } from "../../utils/audit-log";
import { subscriptionRouter } from "./subscription";

export const tenantRouter = router({
  // Sub-router para assinaturas
  subscription: subscriptionRouter,

  /**
   * Obter estatísticas do tenant (para dashboard)
   * Permite acesso mesmo com assinatura expirada para exibir informações
   */
  getTenantStats: tenantProcedure.query(async ({ ctx }) => {
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tenant não encontrado",
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
        const role = (user as any).role || "SEM_ROLE";
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

    // SUPER_ADMIN e TENANT_ADMIN não precisam de tenant
    // Retornar apenas a role (tenant será null)
    if (ctx.isSuperAdmin || ctx.isTenantAdmin) {
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
   * Atualizar configurações do tenant (apenas TENANT_OWNER)
   */
  updateMyTenant: activeTenantProcedure
    .use(requireRole(Role.TENANT_OWNER))
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
          message: "Tenant não encontrado",
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

  /**
   * Listar usuários do tenant (TENANT_OWNER, TENANT_USER_MANAGER)
   */
  listUsers: activeTenantProcedure
    .use(requireAnyRole([Role.TENANT_OWNER, Role.TENANT_USER_MANAGER]))
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        role: z.enum(Role).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        tenantId: ctx.tenant.id,
        role: {
          notIn: [Role.SUPER_ADMIN, Role.TENANT_ADMIN],
        },
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { email: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
        ...(input.role && { role: input.role }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: where as any,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where: where as any }),
      ]);

      return {
        data: users.map((user: any) => ({
          id: user.id,
          userId: user.id,
          role: user.role,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: user.createdAt,
          },
        })),
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Convidar usuário para o tenant (TENANT_OWNER, TENANT_USER_MANAGER)
   */
  inviteUser: activeTenantProcedure
    .use(requireAnyRole([Role.TENANT_OWNER, Role.TENANT_USER_MANAGER]))
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        role: z.enum(Role).refine(
          (role) => {
            // Não permitir convidar com roles de admin
            return role !== Role.SUPER_ADMIN && role !== Role.TENANT_ADMIN;
          },
          {
            message: "Não é possível convidar usuário com roles de admin",
          }
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      // Buscar usuário pelo email
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Usuário não encontrado. O usuário deve se cadastrar primeiro.",
        });
      }

      // Verificar se usuário já está no tenant
      if ((user as any).tenantId === ctx.tenant.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Usuário já é membro deste tenant",
        });
      }

      // Atualizar usuário para associar ao tenant
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          tenantId: ctx.tenant.id,
          role: input.role,
        } as any,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      return {
        id: updatedUser.id,
        userId: updatedUser.id,
        role: (updatedUser as any).role,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
        },
      };
    }),

  /**
   * Atualizar role de usuário (TENANT_OWNER, TENANT_USER_MANAGER)
   */
  updateUserRole: activeTenantProcedure
    .use(requireAnyRole([Role.TENANT_OWNER, Role.TENANT_USER_MANAGER]))
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(Role).refine(
          (role) => {
            // Não permitir atribuir roles de admin
            return role !== Role.SUPER_ADMIN && role !== Role.TENANT_ADMIN;
          },
          {
            message: "Não é possível atribuir roles de admin",
          }
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      // Verificar se usuário está no tenant
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user || (user as any).tenantId !== ctx.tenant.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não é membro deste tenant",
        });
      }

      // Validar que não está removendo o último TENANT_OWNER
      if (
        (user as any).role === Role.TENANT_OWNER &&
        input.role !== Role.TENANT_OWNER
      ) {
        const ownerCount = await prisma.user.count({
          where: {
            tenantId: ctx.tenant.id,
            role: Role.TENANT_OWNER,
          } as any,
        });

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível remover o último TENANT_OWNER",
          });
        }
      }

      // Atualizar role
      const updatedUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          role: input.role,
        } as any,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_USER_ROLE,
          resourceType: AuditResourceType.TENANT_USER,
          resourceId: user.id,
          metadata: {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            previousRole: (user as any).role,
            newRole: input.role,
            tenantId: ctx.tenant.id,
          },
        },
        ctx
      );

      return {
        id: updatedUser.id,
        userId: updatedUser.id,
        role: (updatedUser as any).role,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
        },
      };
    }),

  /**
   * Remover usuário do tenant (TENANT_OWNER, TENANT_USER_MANAGER)
   */
  removeUser: activeTenantProcedure
    .use(requireAnyRole([Role.TENANT_OWNER, Role.TENANT_USER_MANAGER]))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      // Verificar se usuário está no tenant
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user || (user as any).tenantId !== ctx.tenant.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não é membro deste tenant",
        });
      }

      // Validar que não está removendo o último TENANT_OWNER
      if ((user as any).role === Role.TENANT_OWNER) {
        const ownerCount = await prisma.user.count({
          where: {
            tenantId: ctx.tenant.id,
            role: Role.TENANT_OWNER,
          } as any,
        });

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível remover o último TENANT_OWNER",
          });
        }
      }

      // Não permitir remover a si mesmo
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível remover você mesmo do tenant",
        });
      }

      // Remover usuário do tenant (limpar tenantId e role)
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          tenantId: null,
          role: null,
        } as any,
      });

      return { success: true };
    }),
});
