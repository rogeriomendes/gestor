import prisma from "@gestor/db";
import { SubscriptionStatus } from "@gestor/db/types";

/**
 * Tipo de assinatura com plano incluído
 */
export type SubscriptionWithPlan = Awaited<
  ReturnType<typeof getActiveSubscription>
>;

/**
 * Duração padrão do trial em dias
 */
export const TRIAL_DURATION_DAYS = 14;

/**
 * Obtém a assinatura ativa de um tenant
 */
export function getActiveSubscription(tenantId: string) {
  return prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });
}

/**
 * Verifica se uma assinatura está ativa (não expirada)
 */
export function isSubscriptionActive(
  subscription: { status: SubscriptionStatus; expiresAt: Date | null } | null
): boolean {
  if (!subscription) {
    return false;
  }

  // Status cancelado ou expirado = não ativa
  if (
    subscription.status === SubscriptionStatus.CANCELLED ||
    subscription.status === SubscriptionStatus.EXPIRED
  ) {
    return false;
  }

  // Verificar data de expiração
  if (subscription.expiresAt && new Date() > subscription.expiresAt) {
    return false;
  }

  return true;
}

/**
 * Verifica se está em período de trial
 */
export function isInTrial(
  subscription: {
    status: SubscriptionStatus;
    trialEndsAt: Date | null;
  } | null
): boolean {
  if (!subscription) {
    return false;
  }

  if (subscription.status !== SubscriptionStatus.TRIAL) {
    return false;
  }

  if (subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
    return false;
  }

  return true;
}

/**
 * Obtém ou cria o plano padrão
 */
export async function getOrCreateDefaultPlan() {
  // Primeiro, buscar um plano marcado como padrão
  let defaultPlan = await prisma.plan.findFirst({
    where: { isDefault: true, active: true },
  });

  if (defaultPlan) {
    return defaultPlan;
  }

  // Se não existe, buscar qualquer plano ativo
  defaultPlan = await prisma.plan.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  if (defaultPlan) {
    return defaultPlan;
  }

  // Se não existe nenhum plano, criar o plano padrão
  defaultPlan = await prisma.plan.create({
    data: {
      name: "Trial",
      description: "Plano de avaliação gratuita",
      price: 0,
      active: true,
      isDefault: true,
    },
  });

  return defaultPlan;
}

/**
 * Cria uma assinatura trial para um tenant
 */
export async function createTrialSubscription(tenantId: string) {
  const defaultPlan = await getOrCreateDefaultPlan();

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

  return prisma.subscription.create({
    data: {
      tenantId,
      planId: defaultPlan.id,
      status: SubscriptionStatus.TRIAL,
      startDate: new Date(),
      expiresAt: trialEndsAt,
      trialEndsAt,
    },
    include: { plan: true },
  });
}

/**
 * Atualiza o status da assinatura se necessário (ex: trial expirado)
 */
export async function updateSubscriptionStatusIfNeeded(
  subscription: {
    id: string;
    status: SubscriptionStatus;
    expiresAt: Date | null;
    trialEndsAt: Date | null;
  } | null
) {
  if (!subscription) {
    return null;
  }

  const now = new Date();

  // Se está em trial e o trial expirou
  if (
    subscription.status === SubscriptionStatus.TRIAL &&
    subscription.trialEndsAt &&
    now > subscription.trialEndsAt
  ) {
    return await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
      include: { plan: true },
    });
  }

  // Se está ativo e expirou
  if (
    subscription.status === SubscriptionStatus.ACTIVE &&
    subscription.expiresAt &&
    now > subscription.expiresAt
  ) {
    return await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
      include: { plan: true },
    });
  }

  return null;
}
