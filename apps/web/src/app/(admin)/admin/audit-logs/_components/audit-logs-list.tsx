"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
import { Badge } from "@/components/ui/badge";
import {
  getAuditActionLabel,
  getAuditResourceTypeLabel,
} from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/date-utils";

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  createdAt: Date | string;
  user?: {
    name: string | null;
    email: string;
  } | null;
  tenant?: {
    name: string;
  } | null;
}

interface AuditLogsListProps {
  logs: AuditLog[];
  isLoading: boolean;
  pagination:
    | {
        page: number;
        totalPages: number;
        total: number;
      }
    | undefined;
  onLogClick: (logId: string) => void;
  onPageChange: (page: number) => void;
}

export function AuditLogsList({
  logs,
  isLoading,
  pagination,
  onLogClick,
  onPageChange,
}: AuditLogsListProps) {
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "action",
      header: "Ação",
      cell: ({ row }) => {
        const action = row.original.action;
        return <Badge variant="outline">{getAuditActionLabel(action)}</Badge>;
      },
    },
    {
      accessorKey: "resourceType",
      header: "Tipo",
      cell: ({ row }) => {
        const resourceType = row.original.resourceType;
        return (
          <Badge variant="secondary">
            {getAuditResourceTypeLabel(resourceType)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "user",
      header: "Usuário",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="text-sm">{user?.name || "Usuário desconhecido"}</div>
        );
      },
    },
    {
      accessorKey: "tenant",
      header: "Cliente",
      cell: ({ row }) => {
        const tenant = row.original.tenant;
        return (
          <div className="text-sm">
            {tenant ? (
              <span className="font-medium">{tenant.name}</span>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }) => {
        return (
          <span className="text-sm">
            {formatDateTime(row.original.createdAt)}
          </span>
        );
      },
    },
  ];

  const renderTable = (data: AuditLog[]) => (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum log encontrado."
      onRowClick={(row) => onLogClick(row.id)}
    />
  );

  const renderCards = (data: AuditLog[]) => (
    <DataCards
      data={data}
      emptyMessage="Nenhum log encontrado."
      onCardClick={(log) => onLogClick(log.id)}
      renderCard={(log) => (
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-sm leading-tight">
                {getAuditActionLabel(log.action)}
              </div>
              <p className="truncate text-muted-foreground text-xs">
                {getAuditResourceTypeLabel(log.resourceType)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">
              Por: {log.user?.name || "Usuário desconhecido"}
            </span>
            {log.tenant && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Cliente: {log.tenant.name}
                </span>
              </>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {formatDateTime(log.createdAt)}
            </span>
          </div>
        </div>
      )}
    />
  );

  return (
    <div className="space-y-4">
      <ResponsiveList
        data={logs}
        emptyDescription="Não há registros de auditoria para os filtros selecionados."
        emptyIcon={FileText}
        emptyTitle="Nenhum log encontrado"
        isLoading={isLoading}
        renderCards={renderCards}
        renderTable={renderTable}
        skeletonColumnCount={columns.length}
      />

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-input bg-background px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-md border border-input bg-background px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              type="button"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
