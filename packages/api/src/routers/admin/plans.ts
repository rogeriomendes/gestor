import prisma from "@gestor/db";
import { AuditAction, AuditResourceType } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";
import { createAuditLogFromContext } from "../../utils/audit-log";

export const plansRouter = router({
  /**
   * Listar todos os planos (com paginação)
   */
  list: adminProcedure
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            {
              description: {
                contains: input.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }),
        ...(input.active !== undefined && { active: input.active }),
      };

      const [plans, total] = await Promise.all([
        prisma.plan.findMany({
          where,
          skip,
          take,
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          include: {
            _count: {
              select: { subscriptions: true },
            },
          },
        }),
        prisma.plan.count({ where }),
      ]);

      return {
        data: plans,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Obter detalhes de um plano específico
   */
  get: adminProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ input }) => {
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
        include: {
          _count: {
            select: { subscriptions: true },
          },
          subscriptions: {
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plano não encontrado",
        });
      }

      return plan;
    }),

  /**
   * Criar novo plano
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        description: z.string().optional(),
        price: z.number().min(0).default(0),
        active: z.boolean().default(true),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Se está marcando como padrão, desmarcar outros
      if (input.isDefault) {
        await prisma.plan.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const plan = await prisma.plan.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          active: input.active,
          isDefault: input.isDefault,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.CREATE_PLAN,
          resourceType: AuditResourceType.PLAN,
          resourceId: plan.id,
          metadata: {
            name: plan.name,
            active: plan.active,
            isDefault: plan.isDefault,
          },
        },
        ctx
      );

      return plan;
    }),

  /**
   * Atualizar plano
   */
  update: adminProcedure
    .input(
      z.object({
        planId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        price: z.number().min(0).optional(),
        active: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { planId, ...updateData } = input;

      const existingPlan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!existingPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plano não encontrado",
        });
      }

      // Se está marcando como padrão, desmarcar outros
      if (updateData.isDefault === true) {
        await prisma.plan.updateMany({
          where: { isDefault: true, id: { not: planId } },
          data: { isDefault: false },
        });
      }

      // Não permitir desmarcar como padrão se é o único plano ativo
      if (updateData.isDefault === false && existingPlan.isDefault) {
        const otherActivePlans = await prisma.plan.count({
          where: { active: true, id: { not: planId } },
        });

        if (otherActivePlans === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Deve existir pelo menos um plano padrão ativo",
          });
        }
      }

      const plan = await prisma.plan.update({
        where: { id: planId },
        data: updateData,
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_PLAN,
          resourceType: AuditResourceType.PLAN,
          resourceId: plan.id,
          metadata: {
            changes: updateData,
            previousValues: {
              name: existingPlan.name,
              description: existingPlan.description,
              active: existingPlan.active,
              isDefault: existingPlan.isDefault,
            },
          },
        },
        ctx
      );

      return plan;
    }),

  /**
   * Desativar plano (soft delete)
   * Não afeta assinaturas existentes
   */
  deactivate: adminProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plano não encontrado",
        });
      }

      if (!plan.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plano já está desativado",
        });
      }

      // Não permitir desativar o plano padrão
      if (plan.isDefault) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Não é possível desativar o plano padrão. Defina outro plano como padrão primeiro.",
        });
      }

      const updatedPlan = await prisma.plan.update({
        where: { id: input.planId },
        data: { active: false },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.DEACTIVATE_PLAN,
          resourceType: AuditResourceType.PLAN,
          resourceId: plan.id,
          metadata: {
            name: plan.name,
          },
        },
        ctx
      );

      return updatedPlan;
    }),

  /**
   * Reativar plano
   */
  activate: adminProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plano não encontrado",
        });
      }

      if (plan.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plano já está ativo",
        });
      }

      const updatedPlan = await prisma.plan.update({
        where: { id: input.planId },
        data: { active: true },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.ACTIVATE_PLAN,
          resourceType: AuditResourceType.PLAN,
          resourceId: plan.id,
          metadata: {
            name: plan.name,
          },
        },
        ctx
      );

      return updatedPlan;
    }),
});
