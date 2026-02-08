"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClockIcon,
  DotIcon,
  FileTextIcon,
  LandmarkIcon,
  XIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";

type IBillsPay =
  RouterOutputs["tenant"]["financialBillsPay"]["all"]["financialBills"][number];
type ChargeItem =
  RouterOutputs["tenant"]["financialBillsPay"]["charge"]["charge"][number];

export function DetailPay({
  billsPay,
  open,
  onOpenChange,
}: {
  billsPay: IBillsPay;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();
  const invoicePayChargeQuery = useQuery({
    ...trpc.tenant.financialBillsPay.charge.queryOptions({
      id: billsPay.ID_FIN_LANCAMENTO_PAGAR,
    }),
    enabled: !!tenant && (open ?? true),
  });

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            {invoicePayChargeQuery.isPending ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <Popover>
                <PopoverTrigger>
                  <div className="flex items-center text-left">
                    {billsPay.fin_lancamento_pagar.fornecedor?.pessoa.NOME}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 text-xs">
                  Fornecedor
                </PopoverContent>
              </Popover>
            )}
          </CredenzaTitle>
          <CredenzaDescription asChild>
            <div className="flex flex-col space-y-1">
              {invoicePayChargeQuery.isPending ? (
                <>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  {billsPay.fin_lancamento_pagar.ID_EMPRESA && (
                    <div className="flex flex-row items-center">
                      <Popover>
                        <PopoverTrigger>
                          <div className="flex items-center">
                            <LandmarkIcon className="mr-2 size-4" />
                            {
                              billsPay.fin_lancamento_pagar.empresa
                                ?.RAZAO_SOCIAL
                            }
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2 text-xs">
                          Empresa
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  <div className="flex flex-row items-center">
                    {billsPay.fin_lancamento_pagar.NUMERO_DOCUMENTO && (
                      <>
                        <Popover>
                          <PopoverTrigger>
                            <div className="flex items-center">
                              <FileTextIcon className="mr-2 size-4" />
                              Doc.{" "}
                              {billsPay.fin_lancamento_pagar.NUMERO_DOCUMENTO}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-2 text-xs">
                            Número do documento
                          </PopoverContent>
                        </Popover>
                        <DotIcon />
                      </>
                    )}
                    <Popover>
                      <PopoverTrigger>
                        <div className="flex items-center">
                          <ClockIcon className="mr-2 size-4" />
                          {billsPay.fin_lancamento_pagar.DATA_LANCAMENTO &&
                            formatDate(
                              billsPay.fin_lancamento_pagar.DATA_LANCAMENTO
                            )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2 text-xs">
                        Data de lançamento
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="space-y-3">
          {invoicePayChargeQuery.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <Tabs className="w-full" defaultValue="charge">
                <TabsList className="mb-1">
                  <TabsTrigger value="charge">Cobrança</TabsTrigger>
                  <TabsTrigger value="information">Informações</TabsTrigger>
                </TabsList>
                <TabsContent value="charge">
                  <div className="space-y-3">
                    <Card className="rounded-md py-0 md:py-0">
                      <CardContent className="px-0 md:px-0">
                        {invoicePayChargeQuery.isLoading ? (
                          <div className="m-2 space-y-2">
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : (
                          <Table className="bg-card">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-center">
                                  Parc.
                                </TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Quitado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs md:text-sm">
                              {invoicePayChargeQuery.data?.charge.map(
                                (charge: ChargeItem) => (
                                  <TableRow
                                    data-state={
                                      billsPay.ID === charge.ID && "selected"
                                    }
                                    key={charge.ID}
                                  >
                                    <TableCell className="py-3 text-center">
                                      {charge.NUMERO_PARCELA}
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {formatAsCurrency(Number(charge.VALOR))}
                                    </TableCell>
                                    <TableCell>
                                      {charge.DATA_VENCIMENTO &&
                                        formatDate(charge.DATA_VENCIMENTO)}
                                    </TableCell>
                                    <TableCell>
                                      {charge.fin_parcela_pagamento[0]
                                        ?.DATA_PAGAMENTO &&
                                        formatDate(
                                          charge.fin_parcela_pagamento[0]
                                            ?.DATA_PAGAMENTO
                                        )}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="information">
                  <Card className="rounded-md py-1 md:py-2">
                    <CardDescription className="px-1 md:px-2">
                      Histórico
                    </CardDescription>
                    <CardContent className="px-1 md:px-2">
                      <div className="text-wrap text-xs leading-relaxed md:text-sm">
                        {billsPay.fin_lancamento_pagar.HISTORICO
                          ? billsPay.fin_lancamento_pagar.HISTORICO
                          : "- -"}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <Alert variant="default">
                <AlertDescription>
                  Adicionado de forma manual no Contas a pagar
                </AlertDescription>
              </Alert>
            </>
          )}
        </CredenzaBody>
        {isMobile && (
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant="outline">
                <XIcon className="mr-2 size-5" />
                Fechar
              </Button>
            </CredenzaClose>
          </CredenzaFooter>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
