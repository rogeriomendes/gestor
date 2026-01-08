import prisma from "@gestor/db";
import { AuditAction, AuditResourceType, Role } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { activeTenantProcedure, router } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";
import { requirePermission } from "../../middleware/permissions";
import { createAuditLogFromContext } from "../../utils/audit-log";

export const tenantUsersRouter = router({
  /**
   * Listar usuários do tenant (requer permissão USER:READ)
   */
  listUsers: activeTenantProcedure
    .use(requirePermission("USER", "READ"))
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
          message: "Cliente não encontrado",
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
          where: where as { tenantId: string; role: { notIn: Role[] } },
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
        prisma.user.count({ where: where as { tenantId: string } }),
      ]);

      return {
        data: users.map((user) => ({
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
   * Convidar usuário para o tenant (requer permissão USER:CREATE)
   */
  inviteUser: activeTenantProcedure
    .use(requirePermission("USER", "CREATE"))
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
          message: "Cliente não encontrado",
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
      if ((user as { tenantId: string | null }).tenantId === ctx.tenant.id) {
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
        },
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
        role: updatedUser.role,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
        },
      };
    }),

  /**
   * Atualizar role de usuário (requer permissão USER:UPDATE)
   */
  updateUserRole: activeTenantProcedure
    .use(requirePermission("USER", "UPDATE"))
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
          message: "Cliente não encontrado",
        });
      }

      // Verificar se usuário está no tenant
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (
        !user ||
        (user as { tenantId: string | null }).tenantId !== ctx.tenant.id
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não é membro deste tenant",
        });
      }

      // Validar que não está removendo o último TENANT_OWNER
      if (
        (user as { role: Role | null }).role === Role.TENANT_OWNER &&
        input.role !== Role.TENANT_OWNER
      ) {
        const ownerCount = await prisma.user.count({
          where: {
            tenantId: ctx.tenant.id,
            role: Role.TENANT_OWNER,
          },
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
        },
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
            previousRole: (user as { role: Role | null }).role,
            newRole: input.role,
            tenantId: ctx.tenant.id,
          },
        },
        ctx
      );

      return {
        id: updatedUser.id,
        userId: updatedUser.id,
        role: updatedUser.role,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
        },
      };
    }),

  /**
   * Remover usuário do tenant (requer permissão USER:DELETE)
   */
  removeUser: activeTenantProcedure
    .use(requirePermission("USER", "DELETE"))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      // Verificar se usuário está no tenant
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (
        !user ||
        (user as { tenantId: string | null }).tenantId !== ctx.tenant.id
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não é membro deste tenant",
        });
      }

      // Validar que não está removendo o último TENANT_OWNER
      if ((user as { role: Role | null }).role === Role.TENANT_OWNER) {
        const ownerCount = await prisma.user.count({
          where: {
            tenantId: ctx.tenant.id,
            role: Role.TENANT_OWNER,
          },
        });

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível remover o último TENANT_OWNER",
          });
        }
      }

      // Não permitir remover a si mesmo
      if (input.userId === ctx.session?.user?.id) {
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
        },
      });

      return { success: true };
    }),
});
