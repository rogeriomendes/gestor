"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, Power, RefreshCw, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc, trpcClient } from "@/utils/trpc";

export function ConnectionsTable() {
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCloseConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setCloseDialogOpen(true);
  };

  const handleCloseAll = () => {
    setCloseAllDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!isLoading && (!connections || connections.length === 0) && (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma conexão ativa
            </div>
          )}
          {!isLoading && connections && connections.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Última utilização</TableHead>
                  <TableHead>Tempo ativo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((conn) => (
                  <TableRow key={conn.connectionId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{conn.tenantName}</span>
                        <Link
                          className="text-muted-foreground hover:text-primary"
                          href={`/admin/tenants/${conn.tenantId}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="font-mono text-muted-foreground text-xs">
                        {conn.tenantId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {conn.database === "gestor" ? "Gestor" : "DFE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(conn.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(conn.lastUsedAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>{formatTime(conn.timeActive)}</TableCell>
                    <TableCell>
                      <Badge variant="default">Ativa</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleCloseConnection(conn.connectionId)}
                        size="sm"
                        variant="ghost"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para fechar conexão individual */}
      <Dialog onOpenChange={setCloseDialogOpen} open={closeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Conexão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja fechar esta conexão? A conexão será
              desconectada e removida do cache.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para fechar todas as conexões */}
      <Dialog onOpenChange={setCloseAllDialogOpen} open={closeAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Todas as Conexões</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja fechar todas as conexões ativas? Todas as
              conexões serão desconectadas e o cache será limpo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
