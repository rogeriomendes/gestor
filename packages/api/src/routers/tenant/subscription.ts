import prisma from "@gestor/db";

import { router, tenantProcedure } from "../../index";
import { isInTrial, isSubscriptionActive } from "../../utils/subscription";

export const subscriptionRouter = router({
  /**
   * Obter a assinatura atual do tenant do usuário logado
   * Retorna null se não tiver assinatura
   */
  getMySubscription: tenantProcedure.query(async ({ ctx }) => {
    if (!ctx.tenant) {
      return null;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: ctx.tenant.id },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return null;
    }

    // Calcular informações adicionais
    const isActive = isSubscriptionActive(subscription);
    const inTrial = isInTrial(subscription);

    // Calcular dias restantes (positivo = dias futuros, negativo = dias passados)
    const calculateDaysRemaining = (date: Date): number => {
      const now = new Date();
      // Zerar horas para comparar apenas datas
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const diffTime = targetDate.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    };

    return {
      ...subscription,
      isActive,
      inTrial,
      daysUntilExpiration: subscription.expiresAt
        ? calculateDaysRemaining(subscription.expiresAt)
        : null,
      daysUntilTrialEnds: subscription.trialEndsAt
        ? calculateDaysRemaining(subscription.trialEndsAt)
        : null,
    };
  }),

  /**
   * Obter o plano atual do tenant
   */
  getMyPlan: tenantProcedure.query(async ({ ctx }) => {
    if (!ctx.tenant) {
      return null;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: ctx.tenant.id },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.plan.id,
      name: subscription.plan.name,
      description: subscription.plan.description,
      price: subscription.plan.price,
    };
  }),
});
