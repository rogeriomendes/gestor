import { useQuery } from "@tanstack/react-query";
import {
  ClockIcon,
  DotIcon,
  InfoIcon,
  LandmarkIcon,
  ShoppingBagIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getBudgetSituationInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { DetailSales } from "../../list/_components/DetailSales";
import { DetailBudgetProducts } from "./DetailBudgetProducts";

export function DetailBudget({
  budgetId,
  fromSales,
  open,
  onOpenChange,
}: {
  budgetId: number | null | undefined;
  fromSales?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const budgetByIdQuery = useQuery({
    ...trpc.tenant.salesBudget.byId.queryOptions({ id: budgetId }),
    enabled: !!tenant,
  });

  const situationInfo = getBudgetSituationInfo(
    budgetByIdQuery.data?.budget?.SITUACAO
  );

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            <div className="flex flex-row items-center">
              {budgetByIdQuery.isPending ? (
                <>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="ml-2 h-5 w-12" />
                </>
              ) : budgetByIdQuery.error ? (
                "Erro ao carregar orçamento"
              ) : (
                <>
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center">
                        {budgetByIdQuery.data?.budget?.ID}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      ID
                    </PopoverContent>
                  </Popover>
                  <DotIcon />
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center">
                        {
                          budgetByIdQuery.data?.budget?.vendedor?.colaborador
                            ?.pessoa?.NOME
                        }
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      Vendedor
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger>
                      <Badge
                        className={cn(
                          situationInfo.color,
                          "ml-3 px-1.5 py-0.5 text-xs md:text-sm"
                        )}
                        variant={situationInfo.variant}
                      >
                        {situationInfo.label}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      Situação
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </CredenzaTitle>
          <CredenzaDescription>
            <span className="flex flex-col space-y-1">
              {budgetByIdQuery.isPending ? (
                <span className="space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-56" />
                </span>
              ) : budgetByIdQuery.error ? (
                "Não foi possível carregar os dados do orçamento. Tente novamente."
              ) : (
                <>
                  {budgetByIdQuery.data?.budget?.ID_EMPRESA && (
                    <span className="flex flex-row items-center">
                      <Popover>
                        <PopoverTrigger>
                          <span className="flex items-center">
                            <LandmarkIcon className="mr-2 size-4" />
                            {
                              budgetByIdQuery.data?.budget?.empresa
                                ?.RAZAO_SOCIAL
                            }
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          Empresa
                        </PopoverContent>
                      </Popover>
                    </span>
                  )}
                  <span className="flex flex-row items-center">
                    <Popover>
                      <PopoverTrigger>
                        <span className="flex items-center">
                          <UserIcon className="mr-2 size-4" />
                          {budgetByIdQuery.data?.budget?.cliente.pessoa.NOME}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Cliente
                      </PopoverContent>
                    </Popover>
                  </span>
                  <span className="flex flex-row items-center">
                    <Popover>
                      <PopoverTrigger>
                        <span className="flex items-center">
                          <ClockIcon className="mr-2 size-4" />
                          {budgetByIdQuery.data?.budget?.DATA_CADASTRO &&
                            formatDate(
                              budgetByIdQuery.data?.budget?.DATA_CADASTRO
                            )}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Data criação
                      </PopoverContent>
                    </Popover>
                    {budgetByIdQuery.data?.budget?.ALTERACAO_DATA_HORA && (
                      <>
                        <DotIcon />
                        <Popover>
                          <PopoverTrigger>
                            <span className="flex items-center">
                              <ClockIcon className="mr-2 size-4" />
                              {formatDate(
                                budgetByIdQuery.data?.budget
                                  ?.ALTERACAO_DATA_HORA
                              )}
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-2 text-xs">
                            Data alteração
                          </PopoverContent>
                        </Popover>
                      </>
                    )}
                  </span>
                  {!fromSales &&
                    budgetByIdQuery.data?.budget?.venda_cabecalho &&
                    budgetByIdQuery.data.budget.venda_cabecalho.length > 0 && (
                      <span className="flex flex-row items-center">
                        <Button
                          className="pl-0"
                          onClick={() => setIsSalesModalOpen(true)}
                          size="sm"
                          variant="link"
                        >
                          <ShoppingBagIcon className="size-4" />
                          Visualizar venda faturada
                        </Button>
                        <DetailSales
                          fromBudget
                          onOpenChange={setIsSalesModalOpen}
                          open={isSalesModalOpen}
                          saleId={
                            budgetByIdQuery.data.budget.venda_cabecalho[0]?.ID
                          }
                        />
                      </span>
                    )}
                </>
              )}
            </span>
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {budgetByIdQuery.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : budgetByIdQuery.error ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Erro: {budgetByIdQuery.error.message}
              </p>
            </div>
          ) : (
            <>
              {(budgetByIdQuery.data?.budget?.SITUACAO === "C" ||
                budgetByIdQuery.data?.budget?.CANCELADO_ID_USUARIO) && (
                <Alert className="mb-2 md:mb-4" variant="danger">
                  <InfoIcon className="size-4" />
                  <AlertTitle>Motivo</AlertTitle>
                  <AlertDescription>
                    {budgetByIdQuery.data?.budget?.CANCELADO_MOTIVO}
                  </AlertDescription>
                </Alert>
              )}
              {budgetByIdQuery.data?.budget?.OBSERVACAO && (
                <Alert className="mb-2 md:mb-4" variant="info">
                  <InfoIcon className="size-4" />
                  <AlertTitle>Observação</AlertTitle>
                  <AlertDescription>
                    {budgetByIdQuery.data?.budget?.OBSERVACAO}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="rounded-md py-1 md:py-2" size="sm">
                <CardContent className="px-1 md:px-2">
                  <DetailBudgetProducts
                    budgetId={budgetByIdQuery.data?.budget?.ID}
                  />
                  <Separator className="mt-1 mb-4 md:mt-2" />
                  <div className="mt-3 text-sm md:text-base">
                    <div className="mx-3 mb-2 flex justify-between">
                      <div>Valor dos Produtos</div>
                      <div>
                        {formatAsCurrency(
                          Number(budgetByIdQuery.data?.budget?.VALOR_SUBTOTAL)
                        )}
                      </div>
                    </div>
                    {budgetByIdQuery.data?.budget?.VALOR_DESCONTO &&
                      Number(budgetByIdQuery.data?.budget?.VALOR_DESCONTO) !==
                        0 && (
                        <div className="mx-3 mb-2 flex justify-between">
                          <div>Desconto</div>
                          <div>
                            {formatAsCurrency(
                              Number(
                                budgetByIdQuery.data?.budget?.VALOR_DESCONTO
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {budgetByIdQuery.data?.budget?.VALOR_ACRESCIMO &&
                      Number(budgetByIdQuery.data?.budget?.VALOR_ACRESCIMO) !==
                        0 && (
                        <div className="mx-3 mb-2 flex justify-between">
                          <div>Acréscimo</div>
                          <div>
                            {formatAsCurrency(
                              Number(
                                budgetByIdQuery.data?.budget?.VALOR_ACRESCIMO
                              )
                            )}
                          </div>
                        </div>
                      )}
                    <Separator className="mt-4 mb-4" />
                    <div className="mx-3 mb-2 flex justify-between">
                      <div>Valor Total</div>
                      <div>
                        {formatAsCurrency(
                          Number(budgetByIdQuery.data?.budget?.VALOR_TOTAL)
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CredenzaBody>
        {isMobile && (
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant="outline">
                <XIcon className="mr-3 size-5" />
                Fechar
              </Button>
            </CredenzaClose>
          </CredenzaFooter>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
