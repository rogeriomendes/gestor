import prisma from "@gestor/db";
import { AuditAction, AuditResourceType } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router, tenantProcedure } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";
import { requirePermission } from "../../middleware/permissions";

export const auditRouter = router({
  /**
   * Listar audit logs (admin)
   * Permite filtrar por tenant, usuário, ação, tipo de recurso e data
   * Requer permissão AUDIT_LOG:READ
   */
  listLogs: adminProcedure
    .use(requirePermission("AUDIT_LOG", "READ"))
    .input(
      paginationSchema.extend({
        tenantId: z.string().optional(),
        userId: z.string().optional(),
        action: z.enum(AuditAction).optional(),
        resourceType: z.enum(AuditResourceType).optional(),
        resourceId: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        ...(input.tenantId && { tenantId: input.tenantId }),
        ...(input.userId && { userId: input.userId }),
        ...(input.action && { action: input.action }),
        ...(input.resourceType && { resourceType: input.resourceType }),
        ...(input.resourceId && { resourceId: input.resourceId }),
        ...(input.startDate &&
          input.endDate && {
            createdAt: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
        ...(input.startDate &&
          !input.endDate && {
            createdAt: {
              gte: input.startDate,
            },
          }),
        ...(!input.startDate &&
          input.endDate && {
            createdAt: {
              lte: input.endDate,
            },
          }),
      };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        data: logs,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Obter detalhes de um log específico
   * Requer permissão AUDIT_LOG:READ
   */
  getLog: adminProcedure
    .use(requirePermission("AUDIT_LOG", "READ"))
    .input(z.object({ logId: z.string() }))
    .query(async ({ input }) => {
      const log = await prisma.auditLog.findUnique({
        where: { id: input.logId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Log de auditoria não encontrado",
        });
      }

      return log;
    }),

  /**
   * Listar audit logs do tenant atual (tenant)
   * Apenas logs relacionados ao tenant do usuário
   * Requer permissão AUDIT_LOG:READ
   */
  listMyTenantLogs: tenantProcedure
    .use(requirePermission("AUDIT_LOG", "READ"))
    .input(
      paginationSchema.extend({
        action: z.enum(AuditAction).optional(),
        resourceType: z.enum(AuditResourceType).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
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
        ...(input.action && { action: input.action }),
        ...(input.resourceType && { resourceType: input.resourceType }),
        ...(input.startDate &&
          input.endDate && {
            createdAt: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
        ...(input.startDate &&
          !input.endDate && {
            createdAt: {
              gte: input.startDate,
            },
          }),
        ...(!input.startDate &&
          input.endDate && {
            createdAt: {
              lte: input.endDate,
            },
          }),
      };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        data: logs,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Obter estatísticas de audit logs (admin)
   * Requer permissão AUDIT_LOG:READ
   */
  getStats: adminProcedure
    .use(requirePermission("AUDIT_LOG", "READ"))
    .input(
      z
        .object({
          tenantId: z.string().optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const dateFilter: any = {};
      if (input?.startDate && input?.endDate) {
        dateFilter.createdAt = {
          gte: input.startDate,
          lte: input.endDate,
        };
      } else if (input?.startDate) {
        dateFilter.createdAt = {
          gte: input.startDate,
        };
      } else if (input?.endDate) {
        dateFilter.createdAt = {
          lte: input.endDate,
        };
      }

      const where = {
        ...(input?.tenantId && { tenantId: input.tenantId }),
        ...dateFilter,
      };

      const [totalLogs, logsByAction, logsByResourceType, recentLogs] =
        await Promise.all([
          prisma.auditLog.count({ where }),
          prisma.auditLog.groupBy({
            by: ["action"],
            where,
            _count: {
              action: true,
            },
          }),
          prisma.auditLog.groupBy({
            by: ["resourceType"],
            where,
            _count: {
              resourceType: true,
            },
          }),
          prisma.auditLog.findMany({
            where,
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              tenant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
        ]);

      return {
        total: totalLogs,
        byAction: logsByAction.map((item) => ({
          action: item.action,
          count: item._count.action,
        })),
        byResourceType: logsByResourceType.map((item) => ({
          resourceType: item.resourceType,
          count: item._count.resourceType,
        })),
        recent: recentLogs,
      };
    }),
});
