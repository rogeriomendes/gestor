"use client";

import { Info, SearchIcon } from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { SearchInput } from "@/components/search-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportCard } from "./_components/ReportCard";
import {
  type ReportConfig,
  reportCategories,
  reportRegistry,
} from "./_lib/reportRegistry";

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filtrar relatórios
  const filteredReports = reportRegistry.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Agrupar por categoria
  const reportsByCategory = reportCategories.reduce(
    (acc, category) => {
      const reports = filteredReports.filter((r) => r.category === category.id);
      if (reports.length > 0) {
        acc[category.id] = {
          ...category,
          reports,
        };
      }
      return acc;
    },
    {} as Record<
      string,
      { id: string; label: string; icon: any; reports: ReportConfig[] }
    >
  );

  return (
    <PageLayout
      subtitle="Acesse e visualize diferentes tipos de relatórios do sistema"
      title="Relatórios"
    >
      <div className="space-y-6">
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Em desenvolvimento</AlertTitle>
          <AlertDescription>
            Esta página de relatórios está em desenvolvimento. Algumas
            funcionalidades podem não estar disponíveis ou completas.
          </AlertDescription>
        </Alert>
        {/* Barra de busca e filtros */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <SearchInput
              enableF9Shortcut
              icon={<SearchIcon className="size-4" />}
              onChange={setSearchQuery}
              placeholder="Buscar relatórios..."
              value={searchQuery}
            />
          </div>
        </div>

        {/* Tabs por categoria */}
        <Tabs
          className="space-y-6"
          onValueChange={setSelectedCategory}
          value={selectedCategory}
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {reportCategories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id}>
                  <Icon className="mr-2 h-4 w-4" />
                  {category.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Conteúdo: Todos */}
          <TabsContent className="space-y-8" value="all">
            {Object.keys(reportsByCategory).length > 0 ? (
              Object.values(reportsByCategory).map((category) => {
                const Icon = category.icon;
                return (
                  <div className="space-y-4" key={category.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <h2 className="font-semibold text-xl">
                        {category.label}
                      </h2>
                      <span className="text-muted-foreground text-sm">
                        ({category.reports.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {category.reports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>Nenhum relatório encontrado com os filtros selecionados.</p>
              </div>
            )}
          </TabsContent>

          {/* Conteúdo por categoria */}
          {reportCategories.map((category) => {
            const reports = filteredReports.filter(
              (r) => r.category === category.id
            );

            return (
              <TabsContent key={category.id} value={category.id}>
                {reports.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {reports.map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>
                      Nenhum relatório encontrado nesta categoria com os filtros
                      selecionados.
                    </p>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </PageLayout>
  );
}
