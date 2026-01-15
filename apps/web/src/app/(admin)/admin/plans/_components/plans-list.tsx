"use client";

import {
  Check,
  MoreHorizontal,
  PlusCircle,
  Power,
  PowerOff,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  active: boolean;
  isDefault: boolean;
  _count: {
    subscriptions: number;
  };
}

function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
  return numPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface PlansListProps {
  plans: Plan[];
  isLoading?: boolean;
  onDeactivate: (plan: Plan) => void;
  onActivate: (plan: Plan) => void;
}

export function PlansList({
  plans,
  isLoading = false,
  onDeactivate,
  onActivate,
}: PlansListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {plans.length} plano{plans.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Lista de todos os planos de assinatura cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListItemSkeleton count={5} />
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>0 planos</CardTitle>
          <CardDescription>
            Lista de todos os planos de assinatura cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PlusCircle className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum plano encontrado</EmptyTitle>
              <EmptyDescription>
                Comece criando seu primeiro plano.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => router.push("/admin/plans/new")}>
                Criar Plano
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {plans.length} plano{plans.length !== 1 ? "s" : ""}
        </CardTitle>
        <CardDescription>
          Lista de todos os planos de assinatura cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {plans.map((plan) => (
            <div
              className="flex items-center justify-between border-b p-4 last:border-b-0"
              key={plan.id}
            >
              <div className="flex items-center space-x-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      className="font-medium hover:underline"
                      href={`/admin/plans/${plan.id}`}
                    >
                      {plan.name}
                    </Link>
                    {plan.isDefault && (
                      <Badge
                        className="text-yellow-700 ring-1 ring-yellow-600/20 ring-inset"
                        variant="outline"
                      >
                        <Star className="mr-1 h-3 w-3" /> Padrão
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {plan.description || "Sem descrição"}
                  </p>
                  <p className="font-medium text-sm">
                    {formatPrice(plan.price)}/mês
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {plan.active ? (
                  <Badge
                    className="text-green-700 ring-1 ring-green-600/20 ring-inset"
                    variant="outline"
                  >
                    <Check className="mr-1 h-3 w-3" /> Ativo
                  </Badge>
                ) : (
                  <Badge
                    className="text-red-700 ring-1 ring-red-600/20 ring-inset"
                    variant="outline"
                  >
                    Inativo
                  </Badge>
                )}
                <span className="text-muted-foreground text-xs">
                  {plan._count.subscriptions} assinatura
                  {plan._count.subscriptions !== 1 ? "s" : ""}
                </span>
                <PermissionGuard action="UPDATE" resource="PLAN">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button className="h-8 w-8 p-0" variant="ghost" />
                      }
                    >
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/plans/${plan.id}`)}
                        >
                          <MoreHorizontal className="mr-2 h-4 w-4" /> Ver/Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {plan.active ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={plan.isDefault}
                            onClick={() => onDeactivate(plan)}
                          >
                            <PowerOff className="mr-2 h-4 w-4" /> Desativar
                          </DropdownMenuItem>
                        ) : (
                          <PermissionGuard action="UPDATE" resource="PLAN">
                            <DropdownMenuItem onClick={() => onActivate(plan)}>
                              <Power className="mr-2 h-4 w-4" /> Ativar
                            </DropdownMenuItem>
                          </PermissionGuard>
                        )}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
