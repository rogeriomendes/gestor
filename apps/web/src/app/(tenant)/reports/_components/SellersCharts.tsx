"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
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

interface SellersChartsProps {
  salesPerSeller?: {
    salesPerSeller: Array<{
      sellerId: number;
      sellerName: string;
      total: number;
      count: number;
    }>;
  };
}

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  count: {
    label: "Pedidos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function SellersCharts({ salesPerSeller }: SellersChartsProps) {
  const chartData =
    salesPerSeller?.salesPerSeller.map((seller) => ({
      ...seller,
      sellerName:
        seller.sellerName.length > 15
          ? `${seller.sellerName.substring(0, 15)}...`
          : seller.sellerName,
    })) || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Vendas por Vendedor (Valor)</CardTitle>
          <CardDescription>Faturamento por vendedor no período</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px] w-full" config={chartConfig}>
            <BarChart data={chartData}>
              <XAxis
                angle={-45}
                axisLine={false}
                dataKey="sellerName"
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
                      name === "total"
                        ? formatAsCurrency(Number(value))
                        : value,
                      name === "total" ? "Total" : "Pedidos",
                    ]}
                    labelFormatter={(value, payload) => {
                      const data = payload?.[0]?.payload;
                      return data
                        ? `Vendedor: ${data.sellerName}\nID: ${data.sellerId}`
                        : value;
                    }}
                  />
                }
                cursor={false}
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Vendas por Vendedor (Pedidos)</CardTitle>
          <CardDescription>
            Quantidade de pedidos por vendedor no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px] w-full" config={chartConfig}>
            <BarChart data={chartData}>
              <XAxis
                angle={-45}
                axisLine={false}
                dataKey="sellerName"
                height={80}
                textAnchor="end"
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
                    labelFormatter={(value, payload) => {
                      const data = payload?.[0]?.payload;
                      return data
                        ? `Vendedor: ${data.sellerName}\nID: ${data.sellerId}`
                        : value;
                    }}
                  />
                }
                cursor={false}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
