"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { AuditLogItem } from "./audit-log-item";

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
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações</CardTitle>
          <CardDescription>
            {pagination?.total || 0} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListSkeleton count={3} itemHeight="h-20" />
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações</CardTitle>
          <CardDescription>
            {pagination?.total || 0} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>Nenhum log encontrado</EmptyTitle>
            <EmptyDescription>
              Não há registros de auditoria para os filtros selecionados.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Ações</CardTitle>
        <CardDescription>
          {pagination?.total || 0} registro(s) encontrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <AuditLogItem
              key={log.id}
              log={log}
              onClick={() => onLogClick(log.id)}
            />
          ))}
        </div>

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={pagination.page === 1}
                onClick={() => onPageChange(pagination.page - 1)}
                variant="outline"
              >
                Anterior
              </Button>
              <Button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                variant="outline"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
