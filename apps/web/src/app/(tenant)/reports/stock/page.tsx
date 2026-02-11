"use client";

import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangleIcon,
  ArrowLeft,
  CalendarIcon,
  DownloadIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";
import { ReportExporter } from "../_components/ReportExporter";
import {
  ReportFilters,
  type ReportFilters as ReportFiltersType,
} from "../_components/ReportFilters";
import { StockCharts } from "../_components/StockCharts";
import { getReportById } from "../_lib/reportRegistry";

export default function StockReportPage() {
  const report = getReportById("stock");
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const companyId = selectedCompanyId !== 0 ? selectedCompanyId : undefined;

  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => subDays(today, 30), [today]);
  const [filters, setFilters] = useState<ReportFiltersType>({
    initialDate,
    finalDate: today,
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    ...trpc.tenant.reports.stockPosition.queryOptions({ lowStock: false }),
    enabled: !!tenant,
  });

  if (!report) {
    return null;
  }

  const handleFiltersChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    setIsFilterModalOpen(false);
  };

  const getExportData = () => {
    return report.getExportData({ stockPosition: data });
  };

  const getExportFilename = () => {
    return report.getExportFilename({
      initialDate: format(filters.initialDate, "dd-MM-yyyy"),
      finalDate: format(filters.finalDate, "dd-MM-yyyy"),
    });
  };

  const handleExport = (format: string, data: any[]) => {
    console.log(`Exportando ${data.length} registros em formato ${format}`);
    setIsExportModalOpen(false);
  };

  const daysDiff = Math.ceil(
    (filters.finalDate.getTime() - filters.initialDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <PageLayout
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <Link href="/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Dialog onOpenChange={setIsFilterModalOpen} open={isFilterModalOpen}>
            <DialogTrigger>
              <Button size="sm" variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Filtrar Período
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filtros do Relatório</DialogTitle>
                <DialogDescription>
                  Configure os filtros para personalizar os dados exibidos no
                  relatório.
                </DialogDescription>
              </DialogHeader>
              <ReportFilters
                initialFilters={filters}
                onFiltersChange={handleFiltersChange}
                reportId={report.id}
              />
            </DialogContent>
          </Dialog>
          <Dialog onOpenChange={setIsExportModalOpen} open={isExportModalOpen}>
            <DialogTrigger>
              <Button size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Exportar Relatório</DialogTitle>
                <DialogDescription>
                  Exporte os dados do relatório atual em diferentes formatos.
                </DialogDescription>
              </DialogHeader>
              <ReportExporter
                data={getExportData()}
                filename={getExportFilename()}
                onExport={handleExport}
              />
            </DialogContent>
          </Dialog>
        </div>
      }
      subtitle={`Período: ${format(filters.initialDate, "dd/MM/yyyy", { locale: ptBR })} até ${format(filters.finalDate, "dd/MM/yyyy", { locale: ptBR })} (${daysDiff} dias)`}
      title={report.title}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar os dados do relatório. Tente novamente mais
              tarde.
            </AlertDescription>
          </Alert>
        ) : (
          <StockCharts stockPosition={data} />
        )}
      </div>
    </PageLayout>
  );
}
