"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ShowText } from "@/components/show-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatAsCurrency } from "@/lib/utils";
import { useFinancialData } from "./useFinancialData";

interface FinancialChartsProps {
  accountsReceivable?: {
    accountsReceivable: Array<{
      id: number;
      clientName: string;
      dueDate: Date | null;
      amount: number;
      received: number;
      pending: number;
      isOverdue: boolean | null;
    }>;
  };
  financialSummary?: {
    sales: { total: number; count: number };
    receipts: { total: number };
    payments: { total: number };
    pendingReceivables: { total: number };
    pendingPayables: { total: number };
  };
}

const chartConfig = {
  pending: {
    label: "Pendente",
    color: "hsl(var(--chart-1))",
  },
  received: {
    label: "Recebido",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function FinancialCharts({
  accountsReceivable,
  financialSummary,
}: FinancialChartsProps) {
  // Usar hook para processar dados de forma segura
  const {
    accountsReceivable: safeAccountsReceivable,
    financialSummary: safeFinancialSummary,
    hasData,
  } = useFinancialData({
    accountsReceivable,
    financialSummary,
  });

  // Verificação de segurança para evitar erros
  const chartData = React.useMemo(() => {
    if (!safeAccountsReceivable?.accountsReceivable) {
      return [];
    }

    try {
      return safeAccountsReceivable.accountsReceivable.map((account) => ({
        ...account,
        clientName:
          account.clientName && account.clientName.length > 15
            ? `${account.clientName.substring(0, 15)}...`
            : account.clientName || "Cliente não informado",
        dueDate: account.dueDate
          ? format(new Date(account.dueDate), "dd/MM", { locale: ptBR })
          : "N/A",
      }));
    } catch (error) {
      console.error("Erro ao processar dados financeiros:", error);
      return [];
    }
  }, [safeAccountsReceivable]);

  // Se não há dados válidos, mostrar mensagem de erro
  if (!hasData) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contas a Receber</CardTitle>
            <CardDescription>
              Status das contas a receber por cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>Nenhum dado financeiro disponível</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>Visão geral do fluxo de caixa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>Nenhum dado financeiro disponível</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contas a Receber</CardTitle>
          <CardDescription>
            Status das contas a receber por cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer className="h-[300px] w-full" config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis
                  angle={-45}
                  axisLine={false}
                  dataKey="clientName"
                  height={80}
                  textAnchor="end"
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tickFormatter={(value) => formatAsCurrency(value)}
                  tickLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        formatAsCurrency(Number(value)),
                        name === "pending" ? "Pendente" : "Recebido",
                      ]}
                      labelFormatter={(value, payload) => {
                        const data = payload?.[0]?.payload;
                        return data
                          ? `Cliente: ${data.clientName}\nVencimento: ${data.dueDate}`
                          : value;
                      }}
                    />
                  }
                  cursor={false}
                />
                <Bar
                  dataKey="pending"
                  fill="var(--color-pending)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="received"
                  fill="var(--color-received)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>Nenhum dado disponível para exibir</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Visão geral do fluxo de caixa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Total Recebido:</span>
              <span className="font-bold text-green-600">
                <ShowText>
                  {formatAsCurrency(safeFinancialSummary?.receipts?.total || 0)}
                </ShowText>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Total Pago:</span>
              <span className="font-bold text-red-600">
                <ShowText>
                  {formatAsCurrency(safeFinancialSummary?.payments?.total || 0)}
                </ShowText>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">A Receber:</span>
              <span className="font-bold text-orange-600">
                <ShowText>
                  {formatAsCurrency(
                    safeFinancialSummary?.pendingReceivables?.total || 0
                  )}
                </ShowText>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">A Pagar:</span>
              <span className="font-bold text-orange-600">
                <ShowText>
                  {formatAsCurrency(
                    safeFinancialSummary?.pendingPayables?.total || 0
                  )}
                </ShowText>
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Saldo Líquido:</span>
                <span className="font-bold text-blue-600">
                  <ShowText>
                    {formatAsCurrency(
                      (safeFinancialSummary?.receipts?.total || 0) -
                        (safeFinancialSummary?.payments?.total || 0)
                    )}
                  </ShowText>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
