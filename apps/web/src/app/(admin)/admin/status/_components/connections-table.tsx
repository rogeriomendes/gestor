"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DatabaseIcon, Power, RefreshCw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
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
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

type ConnectionItem =
  RouterOutputs["admin"]["status"]["listConnections"][number];

type ConnectionWithId = ConnectionItem & { id: string };

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function ConnectionsTable() {
  const router = useRouter();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeAllDialogOpen, setCloseAllDialogOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);

  const {
    data: connections,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.admin.status.listConnections.queryOptions(),
    refetchInterval: 10_000, // Atualizar a cada 10 segundos
  });

  const closeConnectionMutation = useMutation({
    mutationFn: (connectionId: string) =>
      trpcClient.admin.status.closeConnection.mutate({ connectionId }),
    onSuccess: () => {
      toast.success("Conexão fechada com sucesso!");
      refetch();
      setCloseDialogOpen(false);
      setSelectedConnectionId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fechar conexão");
    },
  });

  const closeAllConnectionsMutation = useMutation({
    mutationFn: () => trpcClient.admin.status.closeAllConnections.mutate(),
    onSuccess: (data) => {
      toast.success(`${data.closedCount} conexão(ões) fechada(s) com sucesso!`);
      refetch();
      setCloseAllDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fechar conexões");
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: () => trpcClient.admin.status.clearCache.mutate(),
    onSuccess: (data) => {
      toast.success(
        `Cache limpo! ${data.clearedCount} conexão(ões) fechada(s).`
      );
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao limpar cache");
    },
  });

  const handleCloseConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setCloseDialogOpen(true);
  };

  const handleCloseAll = () => {
    setCloseAllDialogOpen(true);
  };

  const connectionColumns: ColumnDef<ConnectionItem>[] = useMemo(
    () => [
      {
        accessorKey: "tenantName",
        header: "Cliente",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.tenantName}</span>
        ),
      },
      {
        accessorKey: "database",
        header: "Banco",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.database === "gestor" ? "Gestor" : "DFE"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criada em",
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
            locale: ptBR,
          }),
      },
      {
        accessorKey: "lastUsedAt",
        header: "Última utilização",
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.lastUsedAt), {
            addSuffix: true,
            locale: ptBR,
          }),
      },
      {
        accessorKey: "timeActive",
        header: "Tempo ativo",
        cell: ({ row }) => formatTime(row.original.timeActive),
      },
      {
        id: "status",
        header: "Status",
        cell: () => <Badge variant="default">Ativa</Badge>,
      },
      {
        id: "actions",
        header: () => <span className="text-right">Ações</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              onClick={() => handleCloseConnection(row.original.connectionId)}
              size="sm"
              variant="ghost"
            >
              <Power className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleCloseConnection]
  );

  return (
    <>
      <Card size="sm">
        <CardHeader>
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center md:gap-0">
            <div>
              <CardTitle>Conexões Ativas</CardTitle>
              <CardDescription>
                Lista de todas as conexões de banco de dados ativas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button
                disabled={closeAllConnectionsMutation.isPending}
                onClick={handleCloseAll}
                size="sm"
                variant="outline"
              >
                <X className="mr-2 h-4 w-4" />
                Fechar Todas
              </Button>
              <Button
                disabled={clearCacheMutation.isPending}
                onClick={() => clearCacheMutation.mutate()}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Cache
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveList<ConnectionItem>
            data={connections ?? []}
            emptyDescription="Não há conexões de banco de dados ativas no momento."
            emptyIcon={DatabaseIcon}
            emptyTitle="Nenhuma conexão ativa"
            isLoading={isLoading}
            renderCards={(data: ConnectionItem[]) => (
              <DataCards<ConnectionWithId>
                data={data.map((c) => ({ ...c, id: c.connectionId }))}
                emptyMessage="Nenhuma conexão ativa"
                onCardClick={(conn: ConnectionWithId) =>
                  router.push(`/admin/tenants/${conn.tenantId}`)
                }
                renderCard={(conn: ConnectionWithId) => (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{conn.tenantName}</span>
                      <Badge variant="secondary">
                        {conn.database === "gestor" ? "Gestor" : "DFE"}
                      </Badge>
                    </div>
                    <div className="grid gap-1 text-muted-foreground text-sm">
                      <p>
                        Criada{" "}
                        {formatDistanceToNow(new Date(conn.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                      <p>
                        Última uso{" "}
                        {formatDistanceToNow(new Date(conn.lastUsedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                      <p>Tempo ativo: {formatTime(conn.timeActive)}</p>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <Badge variant="default">Ativa</Badge>
                      <Button
                        onClick={() => handleCloseConnection(conn.connectionId)}
                        size="sm"
                        variant="ghost"
                      >
                        <Power className="mr-1 h-4 w-4" />
                        Fechar
                      </Button>
                    </div>
                  </div>
                )}
              />
            )}
            renderTable={(data: ConnectionItem[]) => (
              <DataTable<ConnectionItem>
                columns={connectionColumns}
                data={data}
                emptyMessage="Nenhuma conexão ativa"
                onRowClick={(conn: ConnectionItem) => {
                  router.push(`/admin/tenants/${conn.tenantId}`);
                }}
              />
            )}
            skeletonColumnCount={7}
          />
        </CardContent>
      </Card>

      {/* Dialog para fechar conexão individual */}
      <Credenza onOpenChange={setCloseDialogOpen} open={closeDialogOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Fechar Conexão</CredenzaTitle>
            <CredenzaDescription>
              Tem certeza que deseja fechar esta conexão? A conexão será
              desconectada e removida do cache.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaFooter>
            <Button onClick={() => setCloseDialogOpen(false)} variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={closeConnectionMutation.isPending}
              onClick={() => {
                if (selectedConnectionId) {
                  closeConnectionMutation.mutate(selectedConnectionId);
                }
              }}
              variant="destructive"
            >
              Fechar
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Dialog para fechar todas as conexões */}
      <Credenza onOpenChange={setCloseAllDialogOpen} open={closeAllDialogOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Fechar Todas as Conexões</CredenzaTitle>
            <CredenzaDescription>
              Tem certeza que deseja fechar todas as conexões ativas? Todas as
              conexões serão desconectadas e o cache será limpo.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaFooter>
            <Button
              onClick={() => setCloseAllDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={closeAllConnectionsMutation.isPending}
              onClick={() => closeAllConnectionsMutation.mutate()}
              variant="destructive"
            >
              Fechar Todas
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
