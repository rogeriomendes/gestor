"use client";

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

interface StockChartsProps {
  stockPosition?: {
    stockPosition: Array<{
      id: number;
      name: string;
      code: string | null;
      currentStock: number;
      minStock: number;
      maxStock: number;
      purchasePrice: number;
      salePrice: number;
      category: string;
      stockValue: number;
      isLowStock: boolean;
    }>;
  };
}

const chartConfig = {
  currentStock: {
    label: "Estoque Atual",
    color: "hsl(var(--chart-1))",
  },
  minimumStock: {
    label: "Estoque Mínimo",
    color: "hsl(var(--chart-2))",
  },
  maximumStock: {
    label: "Estoque Máximo",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function StockCharts({ stockPosition }: StockChartsProps) {
  const chartData =
    stockPosition?.stockPosition.map((product) => ({
      ...product,
      productName:
        product.name.length > 15
          ? `${product.name.substring(0, 15)}...`
          : product.name,
      productCode: product.code,
      minimumStock: product.minStock,
      maximumStock: product.maxStock,
      unitPrice: product.salePrice,
    })) || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Posição de Estoque</CardTitle>
          <CardDescription>
            Estoque atual vs mínimo e máximo por produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px] w-full" config={chartConfig}>
            <BarChart data={chartData}>
              <XAxis
                angle={-45}
                axisLine={false}
                dataKey="productName"
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
                      name === "currentStock"
                        ? "Estoque Atual"
                        : name === "minimumStock"
                          ? "Estoque Mínimo"
                          : "Estoque Máximo",
                    ]}
                    labelFormatter={(value, payload) => {
                      const data = payload?.[0]?.payload;
                      return data
                        ? `Produto: ${data.productName}\nCódigo: ${data.productCode || "N/A"}`
                        : value;
                    }}
                  />
                }
                cursor={false}
              />
              <Bar
                dataKey="currentStock"
                fill="var(--color-currentStock)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="minimumStock"
                fill="var(--color-minimumStock)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="maximumStock"
                fill="var(--color-maximumStock)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Resumo do Estoque</CardTitle>
          <CardDescription>Informações gerais sobre o estoque</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Produtos Cadastrados:</span>
              <span className="font-medium">
                {stockPosition?.stockPosition.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Produtos em Falta:</span>
              <span className="font-medium text-red-500">
                {stockPosition?.stockPosition.filter((p) => p.isLowStock)
                  .length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                Valor Total do Estoque:
              </span>
              <span className="font-bold text-green-600">
                <ShowText>
                  {formatAsCurrency(
                    stockPosition?.stockPosition.reduce(
                      (sum, product) => sum + product.stockValue,
                      0
                    ) || 0
                  )}
                </ShowText>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                Produtos com Estoque Baixo:
              </span>
              <span className="font-medium text-orange-500">
                {stockPosition?.stockPosition.filter(
                  (p) => p.currentStock <= p.minStock
                ).length || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
