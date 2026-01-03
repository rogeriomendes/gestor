import prisma from "@gestor/db";
import {
  AuditAction,
  AuditResourceType,
  SubscriptionStatus,
} from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";
import { createAuditLogFromContext } from "../../utils/audit-log";
import {
  createTrialSubscription,
  TRIAL_DURATION_DAYS,
} from "../../utils/subscription";

export const subscriptionsRouter = router({
  /**
   * Listar todas as assinaturas (com paginação)
   */
  list: adminProcedure
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        status: z.nativeEnum(SubscriptionStatus).optional(),
        planId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        ...(input.search && {
          tenant: {
            OR: [
              {
                name: { contains: input.search, mode: "insensitive" as const },
              },
              {
                slug: { contains: input.search, mode: "insensitive" as const },
              },
            ],
          },
        }),
        ...(input.status && { status: input.status }),
        ...(input.planId && { planId: input.planId }),
      };

      const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                active: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                active: true,
              },
            },
          },
        }),
        prisma.subscription.count({ where }),
      ]);

      return {
        data: subscriptions,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Obter assinatura de um tenant específico
   */
  getByTenant: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input }) => {
      const subscription = await prisma.subscription.findUnique({
        where: { tenantId: input.tenantId },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
            },
          },
          plan: true,
        },
      });

      return subscription;
    }),

  /**
   * Criar assinatura para um tenant
   */
  create: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        planId: z.string(),
        status: z
          .nativeEnum(SubscriptionStatus)
          .default(SubscriptionStatus.ACTIVE),
        startDate: z.coerce.date().optional(),
        expiresAt: z.coerce.date().optional().nullable(),
        trialEndsAt: z.coerce.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se tenant existe
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      // Verificar se já existe assinatura
      const existingSubscription = await prisma.subscription.findUnique({
        where: { tenantId: input.tenantId },
      });

      if (existingSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Cliente já possui uma assinatura. Use a opção de atualizar.",
        });
      }

      // Verificar se plano existe e está ativo
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
          message: "Plano não está ativo",
        });
      }

      const subscription = await prisma.subscription.create({
        data: {
          tenantId: input.tenantId,
          planId: input.planId,
          status: input.status,
          startDate: input.startDate || new Date(),
          expiresAt: input.expiresAt,
          trialEndsAt: input.trialEndsAt,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          plan: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.CREATE_SUBSCRIPTION,
          resourceType: AuditResourceType.SUBSCRIPTION,
          resourceId: subscription.id,
          tenantId: input.tenantId,
          metadata: {
            tenantName: tenant.name,
            planName: plan.name,
            status: input.status,
          },
        },
        ctx
      );

      return subscription;
    }),

  /**
   * Criar assinatura trial para um tenant (usado pelo sistema)
   */
  createTrial: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se tenant existe
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      // Verificar se já existe assinatura
      const existingSubscription = await prisma.subscription.findUnique({
        where: { tenantId: input.tenantId },
      });

      if (existingSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cliente já possui uma assinatura",
        });
      }

      const subscription = await createTrialSubscription(input.tenantId);

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.CREATE_SUBSCRIPTION,
          resourceType: AuditResourceType.SUBSCRIPTION,
          resourceId: subscription.id,
          tenantId: input.tenantId,
          metadata: {
            tenantName: tenant.name,
            planName: subscription.plan.name,
            status: SubscriptionStatus.TRIAL,
            trialDays: TRIAL_DURATION_DAYS,
          },
        },
        ctx
      );

      return subscription;
    }),

  /**
   * Atualizar assinatura
   */
  update: adminProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        planId: z.string().optional(),
        status: z.nativeEnum(SubscriptionStatus).optional(),
        expiresAt: z.coerce.date().optional().nullable(),
        trialEndsAt: z.coerce.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { subscriptionId, ...updateData } = input;

      const existingSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          tenant: true,
          plan: true,
        },
      });

      if (!existingSubscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assinatura não encontrada",
        });
      }

      // Se está alterando o plano, verificar se existe e está ativo
      if (updateData.planId) {
        const plan = await prisma.plan.findUnique({
          where: { id: updateData.planId },
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
            message: "Plano não está ativo",
          });
        }
      }

      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          plan: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_SUBSCRIPTION,
          resourceType: AuditResourceType.SUBSCRIPTION,
          resourceId: subscription.id,
          tenantId: existingSubscription.tenantId,
          metadata: {
            tenantName: existingSubscription.tenant.name,
            changes: updateData,
            previousValues: {
              planId: existingSubscription.planId,
              planName: existingSubscription.plan.name,
              status: existingSubscription.status,
              expiresAt: existingSubscription.expiresAt,
            },
          },
        },
        ctx
      );

      return subscription;
    }),

  /**
   * Cancelar assinatura
   */
  cancel: adminProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingSubscription = await prisma.subscription.findUnique({
        where: { id: input.subscriptionId },
        include: {
          tenant: true,
          plan: true,
        },
      });

      if (!existingSubscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assinatura não encontrada",
        });
      }

      if (existingSubscription.status === SubscriptionStatus.CANCELLED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Assinatura já está cancelada",
        });
      }

      const subscription = await prisma.subscription.update({
        where: { id: input.subscriptionId },
        data: { status: SubscriptionStatus.CANCELLED },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          plan: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.CANCEL_SUBSCRIPTION,
          resourceType: AuditResourceType.SUBSCRIPTION,
          resourceId: subscription.id,
          tenantId: existingSubscription.tenantId,
          metadata: {
            tenantName: existingSubscription.tenant.name,
            planName: existingSubscription.plan.name,
            previousStatus: existingSubscription.status,
          },
        },
        ctx
      );

      return subscription;
    }),

  /**
   * Obter lista de planos disponíveis (para dropdown)
   */
  getAvailablePlans: adminProcedure.query(async () => {
    return prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        isDefault: true,
      },
    });
  }),
});
