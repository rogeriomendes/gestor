"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Filter } from "lucide-react";
import { useState } from "react";
import { AdminGuard } from "@/components/admin";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const ACTION_LABELS: Record<string, string> = {
  CREATE_TENANT: "Criar Tenant",
  UPDATE_TENANT: "Atualizar Tenant",
  DELETE_TENANT: "Deletar Tenant",
  RESTORE_TENANT: "Restaurar Tenant",
  CREATE_USER: "Criar Usuário",
  UPDATE_USER: "Atualizar Usuário",
  UPDATE_USER_ROLE: "Atualizar Role",
  REMOVE_USER: "Remover Usuário",
  INVITE_USER: "Convidar Usuário",
  CREATE_BRANCH: "Criar Filial",
  UPDATE_BRANCH: "Atualizar Filial",
  DELETE_BRANCH: "Deletar Filial",
  RESTORE_BRANCH: "Restaurar Filial",
  UPDATE_PERMISSIONS: "Atualizar Permissões",
  INITIALIZE_PERMISSIONS: "Inicializar Permissões",
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  TENANT: "Tenant",
  USER: "Usuário",
  TENANT_USER: "Usuário do Tenant",
  BRANCH: "Filial",
  PERMISSION: "Permissão",
};

function AuditLogsPageContent() {
  const [page, setPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedResourceType, setSelectedResourceType] =
    useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    ...trpc.audit.listLogs.queryOptions({
      page,
      limit: 20,
      ...(selectedAction !== "all" && { action: selectedAction as any }),
      ...(selectedResourceType !== "all" && {
        resourceType: selectedResourceType as any,
      }),
      ...(selectedTenant !== "all" && { tenantId: selectedTenant }),
      ...(selectedUser !== "all" && { userId: selectedUser }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    }),
  });

  const { data: tenantsData } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  const { data: usersData } = useQuery({
    ...trpc.admin.listAllUsers.queryOptions({ page: 1, limit: 100 }),
  });

  const { data: logDetails } = useQuery({
    ...trpc.audit.getLog.queryOptions({ logId: selectedLog || "" }),
    enabled: !!selectedLog,
  });

  const logs = logsData?.data || [];
  const pagination = logsData?.pagination;
  const tenants = tenantsData?.data || [];
  const users = usersData?.data || [];

  const handleResetFilters = () => {
    setSelectedAction("all");
    setSelectedResourceType("all");
    setSelectedTenant("all");
    setSelectedUser("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumbs
        items={[{ label: "Admin" }, { label: "Logs de Auditoria" }]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Logs de Auditoria</h2>
          <p className="text-muted-foreground text-sm">
            Histórico completo de todas as ações realizadas no sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os logs por ação, tipo de recurso, tenant, usuário ou data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel>Ação</FieldLabel>
              <Select onValueChange={setSelectedAction} value={selectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Tipo de Recurso</FieldLabel>
              <Select
                onValueChange={setSelectedResourceType}
                value={selectedResourceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(RESOURCE_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Tenant</FieldLabel>
              <Select onValueChange={setSelectedTenant} value={selectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Usuário</FieldLabel>
              <Select onValueChange={setSelectedUser} value={selectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Data Inicial</FieldLabel>
              <Input
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                value={startDate}
              />
            </Field>

            <Field>
              <FieldLabel>Data Final</FieldLabel>
              <Input
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                value={endDate}
              />
            </Field>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleResetFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações</CardTitle>
          <CardDescription>
            {pagination?.total || 0} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton className="h-20 w-full" key={i} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <Empty>
              <EmptyTitle>Nenhum log encontrado</EmptyTitle>
              <EmptyDescription>
                Não há registros de auditoria para os filtros selecionados.
              </EmptyDescription>
            </Empty>
          ) : (
            <>
              <div className="space-y-4">
                {logs.map((log: any) => (
                  <div
                    className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent"
                    key={log.id}
                    onClick={() => setSelectedLog(log.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                          <Badge variant="secondary">
                            {RESOURCE_TYPE_LABELS[log.resourceType] ||
                              log.resourceType}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
                          <span>
                            Por: {log.user?.name || "Usuário desconhecido"}
                          </span>
                          {log.tenant && <span>Tenant: {log.tenant.name}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Página {pagination.currentPage} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={!pagination.hasPreviousPage}
                      onClick={() => setPage(page - 1)}
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <Button
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage(page + 1)}
                      variant="outline"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog
        onOpenChange={(open) => !open && setSelectedLog(null)}
        open={!!selectedLog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta ação
            </DialogDescription>
          </DialogHeader>
          {logDetails && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Ação</p>
                  <p className="font-medium">
                    {ACTION_LABELS[logDetails.action] || logDetails.action}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Tipo de Recurso
                  </p>
                  <p className="font-medium">
                    {RESOURCE_TYPE_LABELS[logDetails.resourceType] ||
                      logDetails.resourceType}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Usuário</p>
                  <p className="font-medium">
                    {logDetails.user?.name || "Desconhecido"} (
                    {logDetails.user?.email || "N/A"})
                  </p>
                </div>
                {logDetails.tenant && (
                  <div>
                    <p className="text-muted-foreground text-sm">Tenant</p>
                    <p className="font-medium">{logDetails.tenant.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-sm">Data/Hora</p>
                  <p className="font-medium">
                    {new Date(logDetails.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                {logDetails.ipAddress && (
                  <div>
                    <p className="text-muted-foreground text-sm">IP</p>
                    <p className="font-medium">{logDetails.ipAddress}</p>
                  </div>
                )}
              </div>
              {logDetails.metadata && (
                <div>
                  <p className="mb-2 text-muted-foreground text-sm">
                    Metadados
                  </p>
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-xs">
                    {JSON.stringify(logDetails.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <AdminGuard>
      <AuditLogsPageContent />
    </AdminGuard>
  );
}
