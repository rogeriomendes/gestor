"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Ban, Clock, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * Componente que verifica se o tenant possui uma assinatura ativa.
 * - Se a assinatura estiver ativa ou em trial válido, renderiza os children
 * - Se a assinatura estiver expirada ou cancelada, mostra tela de bloqueio
 * - A página de configurações (/settings) é sempre acessível para ver o status
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const pathname = usePathname();
  const { tenant, isSuperAdmin, isLoading: isTenantLoading } = useTenant();

  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery({
    ...trpc.tenant.subscription.getMySubscription.queryOptions(),
    enabled: !!tenant && !isSuperAdmin,
  });

  // Super Admins têm acesso irrestrito
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Página de configurações é sempre acessível
  if (pathname === "/settings") {
    return <>{children}</>;
  }

  // Loading state
  if (isTenantLoading || isSubscriptionLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sem assinatura
  if (!subscription) {
    return (
      <SubscriptionBlockedScreen
        description="Seu tenant não possui uma assinatura configurada. Entre em contato com o administrador para ativar sua assinatura."
        icon={<AlertTriangle className="h-12 w-12 text-yellow-500" />}
        title="Sem Assinatura Ativa"
      />
    );
  }

  const status = subscription.status as SubscriptionStatus;
  const isActive = subscription.isActive as boolean;

  // Assinatura ativa e válida (verifica também se não expirou)
  if ((status === "ACTIVE" || status === "TRIAL") && isActive) {
    return <>{children}</>;
  }

  // Trial expirado
  if (status === "TRIAL" && !isActive) {
    return (
      <SubscriptionBlockedScreen
        description="Seu período de avaliação gratuita terminou. Para continuar utilizando o sistema, entre em contato com o administrador para ativar sua assinatura."
        icon={<Clock className="h-12 w-12 text-blue-500" />}
        title="Período de Avaliação Encerrado"
      />
    );
  }

  // Assinatura expirada (status EXPIRED ou ACTIVE mas expirou por data)
  if (status === "EXPIRED" || (status === "ACTIVE" && !isActive)) {
    return (
      <SubscriptionBlockedScreen
        description="Sua assinatura expirou. Para continuar utilizando o sistema, entre em contato com o administrador para renovar sua assinatura."
        icon={<AlertTriangle className="h-12 w-12 text-yellow-500" />}
        title="Assinatura Expirada"
      />
    );
  }

  // Assinatura cancelada
  if (status === "CANCELLED") {
    return (
      <SubscriptionBlockedScreen
        description="Sua assinatura foi cancelada. Para voltar a utilizar o sistema, entre em contato com o administrador para reativar sua assinatura."
        icon={<Ban className="h-12 w-12 text-red-500" />}
        title="Assinatura Cancelada"
      />
    );
  }

  // Default: bloquear acesso
  return (
    <SubscriptionBlockedScreen
      description="Não foi possível verificar o status da sua assinatura. Entre em contato com o administrador."
      icon={<AlertTriangle className="h-12 w-12 text-yellow-500" />}
      title="Acesso Restrito"
    />
  );
}

interface SubscriptionBlockedScreenProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function SubscriptionBlockedScreen({
  icon,
  title,
  description,
}: SubscriptionBlockedScreenProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">{icon}</div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Você pode acessar a página de configurações para ver os detalhes da
            sua assinatura.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/settings">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Ver Configurações
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
