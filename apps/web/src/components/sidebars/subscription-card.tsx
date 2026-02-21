"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";

function getTrialMessage(daysUntilTrialEnds: number): string {
  if (daysUntilTrialEnds < 0) {
    return "Seu trial expirou";
  }
  if (daysUntilTrialEnds === 0) {
    return "Seu trial encerra hoje";
  }
  if (daysUntilTrialEnds === 1) {
    return "Seu trial encerra amanhã";
  }
  return `${daysUntilTrialEnds} dias restantes de trial`;
}

function getExpirationMessage(daysUntilExpiration: number): string {
  if (daysUntilExpiration < 0) {
    return "Sua assinatura expirou";
  }
  if (daysUntilExpiration === 0) {
    return "Sua assinatura expira hoje";
  }
  if (daysUntilExpiration === 1) {
    return "Sua assinatura expira amanhã";
  }
  return `${daysUntilExpiration} dias para expirar`;
}

interface SubscriptionWarningCardProps {
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  message: string;
  textColor: string;
}

function SubscriptionWarningCard({
  icon,
  message,
  bgColor,
  borderColor,
  textColor,
}: SubscriptionWarningCardProps) {
  return (
    <Link href="/settings">
      <div
        className={`mb-2 rounded-lg border p-3 transition-opacity hover:opacity-80 ${bgColor} ${borderColor}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className={`font-medium text-xs ${textColor}`}>{message}</span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Card que exibe aviso de assinatura quando está próxima do vencimento.
 * Aparece no sidebar do tenant quando:
 * - Trial está encerrando (menos de 7 dias)
 * - Assinatura está expirando (menos de 7 dias)
 * - Assinatura expirou
 * - Assinatura foi cancelada
 */
export function SubscriptionCard() {
  const { tenant, isSuperAdmin } = useTenant();

  const { data: subscription } = useQuery({
    ...trpc.tenant.subscription.getMySubscription.queryOptions(),
    enabled: !!tenant && !isSuperAdmin,
    staleTime: 30 * 1000, // 30 segundos para facilitar atualização
  });

  // Super admin não vê o card (não pertence a um tenant específico)
  if (isSuperAdmin || !subscription) {
    return null;
  }

  const status = subscription.status;
  const daysUntilTrialEnds = subscription.daysUntilTrialEnds;
  const daysUntilExpiration = subscription.daysUntilExpiration;

  // Assinatura expirada
  if (status === "EXPIRED") {
    return (
      <SubscriptionWarningCard
        bgColor="bg-red-50"
        borderColor="border-red-200"
        icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        message="Assinatura expirada"
        textColor="text-red-800"
      />
    );
  }

  // Assinatura cancelada
  if (status === "CANCELLED") {
    return (
      <SubscriptionWarningCard
        bgColor="bg-red-50"
        borderColor="border-red-200"
        icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        message="Assinatura cancelada"
        textColor="text-red-800"
      />
    );
  }

  // Trial encerrando (7 dias ou menos)
  if (status === "TRIAL") {
    // Verificar tanto trialEndsAt quanto expiresAt
    const daysRemaining = daysUntilTrialEnds ?? daysUntilExpiration;
    if (daysRemaining !== null && daysRemaining <= 7) {
      return (
        <SubscriptionWarningCard
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          message={getTrialMessage(daysRemaining)}
          textColor="text-blue-800"
        />
      );
    }
  }

  // Assinatura ativa expirando (7 dias ou menos)
  if (
    status === "ACTIVE" &&
    daysUntilExpiration !== null &&
    daysUntilExpiration <= 7
  ) {
    return (
      <SubscriptionWarningCard
        bgColor="bg-yellow-50"
        borderColor="border-yellow-200"
        icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />}
        message={getExpirationMessage(daysUntilExpiration)}
        textColor="text-yellow-800"
      />
    );
  }

  return null;
}
