"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
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

interface SalesChartsProps {
  salesPerDay?: {
    totalValuePerDay: Array<{
      date: string;
      total: number;
      count: number;
    }>;
  };
}

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
  count: {
    label: "Pedidos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function SalesCharts({ salesPerDay }: SalesChartsProps) {
  const chartData = useMemo(
    () =>
      salesPerDay?.totalValuePerDay.map((item) => ({
        ...item,
        date: format(new Date(item.date), "dd/MM", { locale: ptBR }),
      })) || [],
    [salesPerDay]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Vendas por Dia</CardTitle>
          <CardDescription>
            Evolução das vendas no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px] w-full" config={chartConfig}>
            <LineChart data={chartData}>
              <XAxis
                axisLine={false}
                dataKey="date"
                tickFormatter={(value) => value}
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
                      name === "total"
                        ? formatAsCurrency(Number(value))
                        : value,
                      name === "total" ? "Total" : "Pedidos",
                    ]}
                    labelFormatter={(value) => `Data: ${value}`}
                  />
                }
                cursor={false}
              />
              <Line
                activeDot={{
                  r: 6,
                }}
                dataKey="total"
                dot={{
                  fill: "var(--color-total)",
                }}
                stroke="var(--color-total)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Pedidos por Dia</CardTitle>
          <CardDescription>
            Quantidade de pedidos realizados por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px] w-full" config={chartConfig}>
            <LineChart data={chartData}>
              <XAxis
                axisLine={false}
                dataKey="date"
                tickFormatter={(value) => value}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => value.toString()}
                tickLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      value,
                      name === "count" ? "Pedidos" : "Total",
                    ]}
                    labelFormatter={(value) => `Data: ${value}`}
                  />
                }
                cursor={false}
              />
              <Line
                activeDot={{
                  r: 6,
                }}
                dataKey="count"
                dot={{
                  fill: "var(--color-count)",
                }}
                stroke="var(--color-count)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
