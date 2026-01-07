"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Database,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { PageLayout } from "@/components/layouts/page-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getTipoLabel(tipo: string | null) {
  switch (tipo) {
    case "C":
      return { label: "Caixa", variant: "default" as const };
    case "B":
      return { label: "Banco", variant: "secondary" as const };
    default:
      return { label: tipo ?? "N/A", variant: "outline" as const };
  }
}

export default function GestorTestPage() {
  const { tenant, isLoading: tenantLoading } = useTenant();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    ...trpc.tenant.gestorTest.getStats.queryOptions(),
    enabled: !!tenant,
    retry: false,
  });

  const {
    data: contasCaixa,
    isLoading: contasLoading,
    error: contasError,
    refetch: refetchContas,
  } = useQuery({
    ...trpc.tenant.gestorTest.listContaCaixa.queryOptions({
      page: 1,
      limit: 20,
    }),
    enabled: !!tenant,
    retry: false,
  });

  const isLoading = tenantLoading || statsLoading || contasLoading;
  const error = statsError || contasError;

  const handleRefresh = () => {
    refetchStats();
    refetchContas();
  };

  if (tenantLoading) {
    return (
      <PageLayout subtitle="Testando conexão com db-gestor" title="Teste DB">
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!tenant) {
    return (
      <PageLayout subtitle="Testando conexão com db-gestor" title="Teste DB">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Você precisa estar associado a um tenant para acessar esta página.
          </AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      subtitle="Testando conexão com db-gestor (bussolla_db)"
      title="Teste de Conexão DB"
    >
      <div className="space-y-6">
        {/* Botão de Refresh */}
        <div className="flex justify-end">
          <Button
            disabled={isLoading}
            onClick={handleRefresh}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>

        {/* Erro de conexão */}
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao conectar com o banco de dados</AlertTitle>
            <AlertDescription>
              {error.message}
              <p className="mt-2 text-sm opacity-75">
                Verifique se as credenciais MySQL estão configuradas
                corretamente nas configurações do tenant.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Contas de Caixa
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="font-bold text-2xl">
                  {stats?.totalContaCaixa ?? 0}
                </div>
              )}
              <p className="text-muted-foreground text-xs">
                Total de registros na tabela conta_caixa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="font-bold text-2xl">
                  {stats?.totalEmpresas ?? 0}
                </div>
              )}
              <p className="text-muted-foreground text-xs">
                Total de empresas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Caixas Abertos
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="font-bold text-2xl">
                  {stats?.caixasAbertos ?? 0}
                </div>
              )}
              <p className="text-muted-foreground text-xs">
                Caixas atualmente abertos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Contas de Caixa */}
        <Card>
          <CardHeader>
            <CardTitle>Contas de Caixa</CardTitle>
            <CardDescription>
              Dados da tabela conta_caixa do banco bussolla_db
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contasLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : contasCaixa?.data.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhuma conta de caixa encontrada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-right">Saldo Atual</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasCaixa?.data.map((conta) => {
                    const tipoInfo = getTipoLabel(conta.tipo);
                    return (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium font-mono">
                          {conta.id}
                        </TableCell>
                        <TableCell>{conta.codigo ?? "-"}</TableCell>
                        <TableCell>{conta.nome ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={tipoInfo.variant}>
                            {tipoInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {conta.empresa?.razaoSocial ?? "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(conta.saldoAtual)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={conta.caixaAberto ? "default" : "outline"}
                          >
                            {conta.caixaAberto ? "Aberto" : "Fechado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {contasCaixa?.pagination ? (
              <div className="mt-4 flex items-center justify-between text-muted-foreground text-sm">
                <span>
                  Mostrando {contasCaixa.data.length} de{" "}
                  {contasCaixa.pagination.total} registros
                </span>
                <span>
                  Página {contasCaixa.pagination.page} de{" "}
                  {contasCaixa.pagination.totalPages}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Info do Banco */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Conexão</CardTitle>
            <CardDescription>
              Detalhes do banco de dados conectado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Banco:</dt>
                <dd className="font-medium font-mono">bussolla_db</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tenant:</dt>
                <dd className="font-medium">{tenant.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status:</dt>
                <dd>
                  <Badge variant={error ? "destructive" : "default"}>
                    {error ? "Erro" : "Conectado"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
