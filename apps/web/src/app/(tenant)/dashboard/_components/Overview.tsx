"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Bar, BarChart, LabelList, XAxis } from "recharts";
import { ShowText } from "@/components/show-text";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";

type IData =
  RouterOutputs["tenant"]["reports"]["salesPerDay"]["totalValuePerDay"];

export function Overview({ data }: { data: IData }) {
  const chartConfig = {
    total: {
      label: "Total",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      className="aspect-auto h-[400px] w-full"
      config={chartConfig}
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          top: 10,
        }}
      >
        <XAxis
          axisLine={false}
          dataKey="date"
          fontSize={11}
          tickFormatter={(value: Date) =>
            format(toZonedTime(value, "UTC"), "dd MMM", { locale: ptBR })
          }
          tickLine={false}
          tickMargin={5}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-48"
              formatter={(value, name) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                    style={
                      {
                        "--color-bg": `var(--color-${name})`,
                      } as React.CSSProperties
                    }
                  />
                  {chartConfig[name as keyof typeof chartConfig]?.label || name}
                  <div className="ml-auto flex items-baseline gap-0.5 font-medium text-foreground tabular-nums">
                    <ShowText>{formatAsCurrency(Number(value))}</ShowText>
                  </div>
                </>
              )}
              labelFormatter={(value: Date) => {
                return format(
                  toZonedTime(value, "UTC"),
                  "EEEEEE, dd 'de' MMMM",
                  {
                    locale: ptBR,
                  }
                );
              }}
            />
          }
          cursor={false}
          defaultIndex={1}
        />
        <Bar dataKey="total" fill="var(--primary)" radius={4}>
          <LabelList
            className="fill-foreground"
            dataKey="date"
            fontSize={10}
            formatter={(value: string) =>
              format(toZonedTime(value, "UTC"), "dd")
            }
            offset={10}
            position="top"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
