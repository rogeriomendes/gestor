"use client";

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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { Bar, BarChart, Legend, XAxis, YAxis } from "recharts";

interface TypesChartsProps {
  salesPerType?: {
    result: Array<{
      date: string;
      total: number;
      [key: string]: any;
    }>;
  };
}

export function TypesCharts({ salesPerType }: TypesChartsProps) {
  const chartData = useMemo(
    () =>
      salesPerType?.result.map((item) => ({
        ...item,
        date: format(new Date(item.date), "dd/MM", { locale: ptBR }),
      })) || [],
    [salesPerType]
  );

  // Extrair todas as chaves de tipo de recebimento (excluindo 'date' e 'total')
  const keys = useMemo(
    () =>
      Array.from(new Set(salesPerType?.result.flatMap(Object.keys)))
        .filter((key) => key !== "date" && key !== "total")
        .sort(),
    [salesPerType]
  );

  // Criar configuração dinâmica para as cores
  const chartConfig = useMemo(
    () =>
      keys.reduce((config, key, index) => {
        config[key] = {
          label: key,
          color: `hsl(var(--chart-${(index % 5) + 1}))`,
        };
        return config;
      }, {} as ChartConfig),
    [keys]
  );

  return (
    <div className="grid gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Vendas por Tipo de Recebimento</CardTitle>
          <CardDescription>
            Evolução das vendas por tipo de recebimento ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[400px] w-full" config={chartConfig}>
            <BarChart data={chartData}>
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
                      formatAsCurrency(Number(value)),
                      name as string,
                    ]}
                    labelFormatter={(value) => `Data: ${value}`}
                  />
                }
                cursor={false}
              />
              <Legend />
              {keys.map((key) => (
                <Bar
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  key={key}
                  radius={[0, 0, 0, 0]}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
