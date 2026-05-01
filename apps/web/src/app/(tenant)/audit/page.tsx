"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FileSearch2Icon, FilterIcon, FilterXIcon, XIcon } from "lucide-react";
import type { Route } from "next";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FiltersPanel } from "@/components/ui/filters-panel";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { AuditGrid } from "./_components/AuditGrid";
import { DetailAudit } from "./_components/DetailAudit";

type AuditItem = RouterOutputs["tenant"]["audit"]["all"]["audit"][number];

const TENANT_AUDIT_ACTION_FILTER_OPTIONS = [
  "ALTERAÇÃO",
  "CONFIRMAÇÃO",
  "EXCLUSÃO",
  "INCLUSÃO",
  "INSERÇÃO",
  "SANGRIA",
  "SUPRIMENTO",
] as const;

export default function AuditPage() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const enabled = !!tenant;

  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [user, setUser] = useQueryState("user", { defaultValue: "T" });
  const [action, setAction] = useQueryState("action", { defaultValue: "T" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const auditQuery = useInfiniteQuery({
    ...trpc.tenant.audit.all.infiniteQueryOptions(
      {
        limit: 20,
        searchTerm: debouncedSearch || null,
        companyId: selectedCompanyId !== 0 ? selectedCompanyId : null,
        user: user !== "T" ? user : null,
        action: action !== "T" ? action : null,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: null,
      }
    ),
    enabled,
  });

  const filterOptionsQuery = useQuery({
    ...trpc.tenant.audit.filterOptions.queryOptions(),
    enabled,
  });

  const userOptions: ComboboxOption[] = [
    { value: "T", label: "TODOS" },
    ...(filterOptionsQuery.data?.users ?? []).map((item) => ({
      value: item,
      label: item,
    })),
  ];

  const actionOptions: ComboboxOption[] = [
    { value: "T", label: "TODAS" },
    ...TENANT_AUDIT_ACTION_FILTER_OPTIONS.map((item) => ({
      value: item,
      label: item,
    })),
  ];

  const userLabel = userOptions.find((option) => option.value === user)?.label;
  const actionLabel = actionOptions.find(
    (option) => option.value === action
  )?.label;

  const hasActiveFilters =
    search.trim().length > 0 || user !== "T" || action !== "T";

  const clearAllFilters = () => {
    void setSearch("");
    void setUser("T");
    void setAction("T");
  };

  const filtersContent = (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Combobox
          className="w-full"
          onValueChange={setUser}
          options={userOptions}
          placeholder="Usuário"
          searchPlaceholder="Buscar usuário..."
          value={user}
        />
        <Combobox
          className="w-full"
          onValueChange={setAction}
          options={actionOptions}
          placeholder="Ação"
          searchPlaceholder="Buscar ação..."
          value={action}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={clearAllFilters}
          size="sm"
          type="button"
          variant="ghost"
        >
          <FilterXIcon className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Auditoria", isCurrent: true },
      ]}
      subtitle="Consulte os registros de auditoria do banco gestor"
      title="Auditoria"
    >
      <div className="flex gap-2">
        <SearchInput
          className="w-full md:w-96"
          enableF9Shortcut
          onChange={(v: string) => void setSearch(v)}
          placeholder="Pesquisa por ID, resumo, ação ou usuário"
          value={search}
        />
        <FiltersPanel
          onOpenChange={setFiltersOpen}
          open={filtersOpen}
          title="Filtros de auditoria"
          triggerIcon={<FilterIcon className="size-4 md:mr-2" />}
        >
          {filtersContent}
        </FiltersPanel>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1">
          {search.trim().length > 0 && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Busca: {search.trim()}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setSearch("")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {user !== "T" && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Usuário: {userLabel}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setUser("T")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {action !== "T" && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Ação: {actionLabel}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setAction("T")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            className="md:h-8 md:text-sm md:[&_svg:not([class*='size-'])]:size-4"
            onClick={clearAllFilters}
            size="xs"
            variant="ghost"
          >
            <FilterXIcon className="mr-0.5 h-3 w-3" />
            Limpar
          </Button>
        </div>
      )}

      {isMobile ? (
        <AuditGrid
          data={auditQuery.data?.pages}
          fetchNextPage={auditQuery.fetchNextPage}
          hasNextPage={auditQuery.hasNextPage}
          isFetchingNextPage={auditQuery.isFetchingNextPage}
          isLoading={auditQuery.isLoading}
          onAuditClick={(item) => {
            setSelectedAuditId(item.ID);
            setIsDetailOpen(true);
          }}
        />
      ) : (
        <DataTableInfinite<AuditItem>
          data={auditQuery.data?.pages}
          emptyIcon={<FileSearch2Icon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados registros de auditoria."
          fetchNextPage={auditQuery.fetchNextPage}
          getRowKey={(item) => item.ID}
          hasNextPage={auditQuery.hasNextPage}
          headers={[
            { key: "id", label: "ID", className: "" },
            { key: "data", label: "Data", className: "" },
            { key: "usuario", label: "Usuário", className: "" },
            { key: "resumo", label: "Resumo", className: "text-left" },
            { key: "tela", label: "Tela", className: "hidden sm:table-cell" },
          ]}
          isFetchingNextPage={auditQuery.isFetchingNextPage}
          isLoading={auditQuery.isLoading}
          loadingMessage="Carregando auditorias..."
          loadMoreMessage="Carregar mais auditorias"
          noMoreDataMessage="Não há mais auditorias para carregar"
          onRowClick={(item) => {
            setSelectedAuditId(item.ID);
            setIsDetailOpen(true);
          }}
          pageItemKeys={["audit"]}
          renderRow={(item) => [
            item.ID,
            item.DATA_REGISTRO
              ? `${formatDate(item.DATA_REGISTRO)} ${item.HORA_REGISTRO || ""}`.trim()
              : "—",
            item.usuario?.LOGIN || item.NOME_USU_AUTO || "—",
            item.ACAO || "—",
            item.JANELA_CONTROLLER || "—",
          ]}
        />
      )}

      {selectedAuditId && (
        <DetailAudit
          auditId={selectedAuditId}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) {
              setSelectedAuditId(null);
            }
          }}
          open={isDetailOpen}
        />
      )}
    </PageLayout>
  );
}
