"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format-date";
import FinancialClosingPayment from "./_components/FinancialClosingPayment";
import FinancialClosingSalesList from "./_components/FinancialClosingSales";
import type { ClosingData } from "./types";

export type { ClosingData } from "./types";

export function parseClosingDataFromSearchParams(
  searchParams: URLSearchParams
): ClosingData | undefined {
  const id = searchParams.get("id");
  const name = searchParams.get("name");
  const dateOpen = searchParams.get("dateOpen");
  const hourOpen = searchParams.get("hourOpen");
  const dateClosed = searchParams.get("dateClosed");
  const hourClosed = searchParams.get("hourClosed");

  if (!id) {
    return undefined;
  }

  const dateOpenParsed =
    dateOpen != null && dateOpen !== "" ? new Date(dateOpen) : null;
  const dateClosedParsed =
    dateClosed != null && dateClosed !== "" ? new Date(dateClosed) : null;

  return {
    id,
    name,
    dateOpen: dateOpenParsed,
    hourOpen,
    dateClosed: dateClosedParsed,
    hourClosed,
  };
}

export default function FinancialClosingDetailPage() {
  const searchParams = useSearchParams();

  const closingData = useMemo(
    () => parseClosingDataFromSearchParams(searchParams),
    [searchParams]
  );

  const hasRequiredParams =
    closingData?.id &&
    closingData.dateOpen != null &&
    closingData.hourOpen != null;

  if (!closingData?.id) {
    return (
      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" as Route },
          { label: "Financeiro", href: "/financial" as Route },
          {
            label: "Fechamentos de Caixa",
            href: "/financial/closing" as Route,
          },
          { label: "Detalhes", isCurrent: true },
        ]}
        showBackButton
        subtitle="Selecione um fechamento na listagem para ver os detalhes"
        title="Fechamento"
      >
        <Card className="rounded-md" size="sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-center text-muted-foreground">
              Nenhum fechamento selecionado. Acesse a listagem e clique em um
              item para ver os detalhes.
            </p>
            <Button render={<Link href={"/financial/closing" as Route} />}>
              Ir para Fechamentos de Caixa
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  if (!hasRequiredParams) {
    return (
      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" as Route },
          { label: "Financeiro", href: "/financial" as Route },
          {
            label: "Fechamentos de Caixa",
            href: "/financial/closing" as Route,
          },
          { label: closingData.name ?? "Detalhes", isCurrent: true },
        ]}
        showBackButton
        subtitle="Dados de abertura incompletos para exibir o fechamento"
        title="Fechamento"
      >
        <Card className="rounded-md" size="sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-center text-muted-foreground">
              Faltam data ou hora de abertura. Volte à listagem e abra um
              fechamento com dados completos.
            </p>
            <Button render={<Link href={"/financial/closing" as Route} />}>
              Voltar para Fechamentos de Caixa
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      actions={
        closingData ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{closingData.name || "—"}</Badge>
            <Badge
              className={
                closingData.hourClosed ? "" : "bg-green-600 hover:bg-green-700"
              }
              variant={closingData.hourClosed ? "secondary" : "default"}
            >
              {closingData.hourClosed ? "FECHADO" : "ABERTO"}
            </Badge>
          </div>
        ) : (
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        )
      }
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Financeiro", href: "/financial" as Route },
        { label: "Fechamentos de Caixa", href: "/financial/closing" as Route },
        {
          label: `${closingData?.name} ${closingData?.dateOpen && formatDate(closingData?.dateOpen)}`,
          isCurrent: true,
          href: `/financial/closing/detail?id=${closingData?.id}&name=${closingData?.name}` as Route,
        },
        // { label: "Detalhes", isCurrent: true },
      ]}
      showBackButton
      subtitle="Detalhes do fechamento de caixa"
      title="Fechamento"
    >
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-row gap-2 md:gap-3">
          {closingData ? (
            <>
              <Badge
                className="flex-1 py-3.5 text-base md:w-56 md:text-lg"
                variant="secondary"
              >
                ABERTURA
              </Badge>
              <Badge
                className="flex-1 py-3.5 text-base md:w-56 md:text-lg"
                variant="secondary"
              >
                {closingData.dateOpen && formatDate(closingData.dateOpen)} -{" "}
                {closingData.hourOpen}
              </Badge>
            </>
          ) : (
            <>
              <Skeleton className="h-8 flex-1 md:w-56" />
              <Skeleton className="h-8 flex-1 md:w-56" />
            </>
          )}
        </div>
        {closingData ? (
          closingData.hourClosed && (
            <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
              <Badge
                className="flex-1 py-3.5 text-base md:w-56 md:text-lg"
                variant="secondary"
              >
                FECHAMENTO
              </Badge>

              <Badge
                className="flex-1 py-3.5 text-base md:w-56 md:text-lg"
                variant="secondary"
              >
                {closingData.dateClosed && formatDate(closingData.dateClosed)} -{" "}
                {closingData.hourClosed}
              </Badge>
            </div>
          )
        ) : (
          <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
            <Skeleton className="h-8 flex-1 md:w-56" />
            <Skeleton className="h-8 flex-1 md:w-56" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 md:flex-row md:gap-4">
        <Card
          className="w-full rounded-md md:sticky md:top-7 md:h-[calc(100vh-1.75rem)] md:w-1/3 md:max-w-[500px]"
          size="sm"
        >
          <CardHeader>
            <CardTitle className="text-sm md:text-base">
              Tipo de Recebimento / Pagamento
            </CardTitle>
          </CardHeader>
          <ScrollArea className="md:h-[calc(100vh-8rem)]">
            <CardContent>
              {closingData && (
                <FinancialClosingPayment closingData={closingData} />
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <div className="w-full gap-4 md:w-2/3">
          {closingData && (
            <FinancialClosingSalesList closingData={closingData} />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
