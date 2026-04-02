"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { formatDate } from "@/lib/format-date";
import { getFinancialClosingStatusInfo } from "@/lib/status-info";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import {
  ClosingSelectResponsive,
  type ClosingSelectResponsiveOption,
} from "./_components/ClosingSelectResponsive";
import FinancialClosingPayment from "./_components/FinancialClosingPayment";
import FinancialClosingSalesList from "./_components/FinancialClosingSales";

type AccountItem =
  RouterOutputs["tenant"]["account"]["all"]["accounts"][number];

type ClosingItem =
  RouterOutputs["tenant"]["financialClosing"]["all"]["financialClosing"][number];

export interface ClosingData {
  dateClosed?: Date | null;
  dateOpen: Date | null;
  hourClosed?: string | null;
  hourOpen: string | null;
  id: string | null;
  name: string | null;
}

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
  const router = useRouter();
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();

  const closingData = useMemo(
    () => parseClosingDataFromSearchParams(searchParams),
    [searchParams]
  );

  const hasRequiredParams =
    closingData?.id &&
    closingData.dateOpen != null &&
    closingData.hourOpen != null;

  const [selectedClosingId, setSelectedClosingId] = useState<string>("");

  const accountsQuery = useQuery({
    ...trpc.tenant.account.all.queryOptions({
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled: !!tenant && !!closingData?.id,
  });

  const closingsQuery = useQuery({
    ...trpc.tenant.financialClosing.all.queryOptions({
      limit: 20,
      account: closingData?.id ? Number(closingData.id) : null,
      date: null,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled: !!tenant && !!closingData?.id,
  });

  const openAccountForCurrentClosing: AccountItem | undefined =
    accountsQuery.data?.accounts?.find(
      (acc: AccountItem) =>
        acc.ID === Number(closingData?.id) && acc.STATUS_CAIXA_ABERTO === "S"
    );

  const openOption: ClosingSelectResponsiveOption | null =
    openAccountForCurrentClosing
      ? (() => {
          const openDate = openAccountForCurrentClosing.DATA_ULTIMA_ABERTURA
            ? new Date(openAccountForCurrentClosing.DATA_ULTIMA_ABERTURA)
            : null;
          const hour = openAccountForCurrentClosing.HORA_ULTIMA_ABERTURA || "";
          const label = `${openDate ? formatDate(openDate) : "Sem data"} - ${hour}`;
          const listLabel =
            openDate != null
              ? `${label} · ${format(toZonedTime(openDate, "UTC"), "EEEEEE", {
                  locale: ptBR,
                })}.`
              : `${label}.`;
          return { value: "open", label, listLabel };
        })()
      : null;

  const closingOptions: ClosingSelectResponsiveOption[] = [
    ...(openOption ? [openOption] : []),
    ...(closingsQuery.data?.financialClosing?.map(
      (closing: ClosingItem): ClosingSelectResponsiveOption => {
        const openDate = closing.DATA_ABERTURA
          ? new Date(closing.DATA_ABERTURA)
          : null;
        const hour = closing.HORA_ABERTURA || "";
        const label = `${openDate ? formatDate(openDate) : "Sem data"} - ${hour}`;
        const listLabel =
          openDate != null
            ? `${label} · ${format(toZonedTime(openDate, "UTC"), "EEEEEE", {
                locale: ptBR,
              })}.`
            : `${label}.`;
        return {
          value: String(closing.ID),
          label,
          listLabel,
        };
      }
    ) ?? []),
  ];

  // Selecionar automaticamente o fechamento atual deste caixa no select
  useEffect(() => {
    if (
      !(
        closingData?.dateOpen &&
        closingData.hourOpen &&
        (closingsQuery.data?.financialClosing || openAccountForCurrentClosing)
      ) ||
      selectedClosingId
    ) {
      return;
    }

    // Se o caixa está aberto (sem hora de fechamento) e existe conta aberta,
    // seleciona a opção "open" no select.
    if (!closingData.hourClosed && openAccountForCurrentClosing) {
      setSelectedClosingId("open");
      return;
    }

    if (!closingsQuery.data?.financialClosing) {
      return;
    }

    const currentDateStr = new Date(
      Date.UTC(
        closingData.dateOpen.getUTCFullYear(),
        closingData.dateOpen.getUTCMonth(),
        closingData.dateOpen.getUTCDate()
      )
    )
      .toISOString()
      .slice(0, 10);

    const currentHour = closingData.hourOpen.trim();

    const currentClosing = closingsQuery.data.financialClosing.find(
      (item: ClosingItem) => {
        if (!(item.DATA_ABERTURA && item.HORA_ABERTURA)) {
          return false;
        }

        const itemDateStr = new Date(item.DATA_ABERTURA)
          .toISOString()
          .slice(0, 10);

        return (
          itemDateStr === currentDateStr &&
          item.HORA_ABERTURA.trim() === currentHour
        );
      }
    );

    if (currentClosing) {
      setSelectedClosingId(String(currentClosing.ID));
    }
  }, [
    closingData,
    closingsQuery.data?.financialClosing,
    openAccountForCurrentClosing,
    selectedClosingId,
  ]);

  const handleChangeClosing = (closingId: string) => {
    if (closingId === "open") {
      if (!openAccountForCurrentClosing) {
        return;
      }

      const today = new Date();
      const dateOpenStr =
        openAccountForCurrentClosing.DATA_ULTIMA_ABERTURA != null &&
        String(openAccountForCurrentClosing.DATA_ULTIMA_ABERTURA) !== ""
          ? String(openAccountForCurrentClosing.DATA_ULTIMA_ABERTURA)
          : today.toISOString().slice(0, 10);

      const hourOpenStr =
        openAccountForCurrentClosing.HORA_ULTIMA_ABERTURA &&
        String(openAccountForCurrentClosing.HORA_ULTIMA_ABERTURA).trim() !== ""
          ? String(openAccountForCurrentClosing.HORA_ULTIMA_ABERTURA)
          : "00:00:00";

      const params = new URLSearchParams();
      params.set("id", String(openAccountForCurrentClosing.ID));
      params.set("name", openAccountForCurrentClosing.NOME ?? "");
      params.set("dateOpen", dateOpenStr);
      params.set("hourOpen", hourOpenStr);

      router.push(`/financial/closing/detail?${params.toString()}` as Route);
      return;
    }

    const closing = closingsQuery.data?.financialClosing?.find(
      (item: ClosingItem) => String(item.ID) === closingId
    );

    if (!closing) {
      return;
    }

    const params = new URLSearchParams();
    params.set("id", String(closing.ID_CONTA_CAIXA));
    params.set("name", closing.conta_caixa?.NOME ?? "");
    if (closing.DATA_ABERTURA) {
      params.set("dateOpen", String(closing.DATA_ABERTURA));
    }
    if (closing.HORA_ABERTURA) {
      params.set("hourOpen", closing.HORA_ABERTURA);
    }
    if (closing.DATA_FECHAMENTO) {
      params.set("dateClosed", String(closing.DATA_FECHAMENTO));
    }
    if (closing.HORA_FECHAMENTO) {
      params.set("hourClosed", closing.HORA_FECHAMENTO);
    }

    router.push(`/financial/closing/detail?${params.toString()}` as Route);
  };

  if (!closingData?.id) {
    return (
      <PageLayout
        backHref="/financial/closing"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Financeiro", href: "/financial" },
          {
            label: "Fechamentos de Caixa",
            href: "/financial/closing",
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
        backHref="/financial/closing"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Financeiro", href: "/financial" },
          {
            label: "Fechamentos de Caixa",
            href: "/financial/closing",
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

  const closingStatusInfo = getFinancialClosingStatusInfo(
    closingData.hourClosed ? "closed" : "open"
  );

  return (
    <PageLayout
      actions={
        closingData ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="px-2 py-3.5 text-base" variant="secondary">
              {closingData.name || "—"}
            </Badge>
            <Badge
              className={cn(closingStatusInfo.color, "px-2 py-3.5 text-base")}
              variant={closingStatusInfo.variant}
            >
              {closingStatusInfo.label.toUpperCase()}
            </Badge>
          </div>
        ) : (
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        )
      }
      backHref="/financial/closing"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Financeiro", href: "/financial" },
        { label: "Fechamentos de Caixa", href: "/financial/closing" },
        {
          label: `${closingData?.name} - ${closingData?.dateOpen && formatDate(closingData?.dateOpen)}`,
          isCurrent: true,
          href: `/financial/closing/detail?id=${closingData?.id}&name=${closingData?.name}` as Route,
        },
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
              {closingsQuery.isLoading || closingOptions.length === 0 ? (
                <Badge
                  className="w-56 items-center justify-between py-3.5 text-base md:w-64 md:text-lg"
                  variant="secondary"
                >
                  {closingData.dateOpen && formatDate(closingData.dateOpen)} -{" "}
                  {closingData.hourOpen}
                  <Loader2 className="ml-1.5 size-4 shrink-0 animate-spin text-muted-foreground" />
                </Badge>
              ) : (
                <ClosingSelectResponsive
                  disabled={closingOptions.length === 0}
                  onValueChange={(value) => {
                    setSelectedClosingId(value);
                    handleChangeClosing(value);
                  }}
                  options={closingOptions}
                  value={selectedClosingId}
                />
              )}
            </>
          ) : (
            <>
              <Skeleton className="h-8 flex-1 md:w-56" />
              <Skeleton className="h-8 flex-1 md:w-64" />
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
                className="w-56 justify-start py-3.5 text-base md:w-64 md:justify-center md:text-lg"
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
            <Skeleton className="h-8 flex-1 md:w-64" />
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
