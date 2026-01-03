"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Building2,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListItemSkeleton } from "@/components/ui/list-skeleton";
import { SubscriptionStatusBadge } from "./subscription-status-badge";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  startDate: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
  };
  plan: {
    id: string;
    name: string;
    active: boolean;
  };
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
  onCancel: (subscription: Subscription) => void;
  onCreateSubscription?: () => void;
}

export function SubscriptionsList({
  subscriptions,
  isLoading = false,
  onCancel,
  onCreateSubscription,
}: SubscriptionsListProps) {
  const router = useRouter();

  if (isLoading) {
    return <ListItemSkeleton count={5} />;
  }

  if (subscriptions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhuma assinatura encontrada</EmptyTitle>
          <EmptyDescription>
            Não há assinaturas cadastradas. Você pode criar uma assinatura para
            um tenant existente ou criar um novo tenant (que já receberá um
            trial automaticamente).
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            {onCreateSubscription && (
              <Button onClick={onCreateSubscription}>
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Assinatura
              </Button>
            )}
            <Button
              onClick={() => router.push("/admin/tenants/new")}
              variant="outline"
            >
              <Building2 className="mr-2 h-4 w-4" /> Criar Tenant
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border">
      {subscriptions.map((subscription) => {
        const expiresAt = subscription.expiresAt
          ? new Date(subscription.expiresAt)
          : null;
        const isExpiringSoon =
          expiresAt &&
          expiresAt > new Date() &&
          expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return (
          <div
            className="flex items-center justify-between border-b p-4 last:border-b-0"
            key={subscription.id}
          >
            <div className="flex items-center space-x-4">
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    className="font-medium hover:underline"
                    href={`/admin/tenants/${subscription.tenant.id}`}
                  >
                    {subscription.tenant.name}
                  </Link>
                  <SubscriptionStatusBadge status={subscription.status} />
                </div>
                <p className="text-muted-foreground text-sm">
                  Plano: {subscription.plan.name}
                </p>
                {expiresAt && (
                  <p className="text-muted-foreground text-xs">
                    {expiresAt > new Date() ? "Expira em " : "Expirou em "}
                    {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isExpiringSoon && (
                <Badge
                  className="text-orange-700 ring-1 ring-orange-600/20 ring-inset"
                  variant="outline"
                >
                  Expira em breve
                </Badge>
              )}
              {!subscription.tenant.active && (
                <Badge
                  className="text-gray-500 ring-1 ring-gray-400/20 ring-inset"
                  variant="outline"
                >
                  Tenant inativo
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button className="h-8 w-8 p-0" variant="ghost" />}
                >
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/admin/subscriptions/${subscription.tenant.id}`
                        )
                      }
                    >
                      <MoreHorizontal className="mr-2 h-4 w-4" /> Ver/Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/admin/tenants/${subscription.tenant.id}`)
                      }
                    >
                      <Building2 className="mr-2 h-4 w-4" /> Ver Tenant
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {subscription.status !== "CANCELLED" && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onCancel(subscription)}
                      >
                        Cancelar Assinatura
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
