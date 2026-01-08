"use client";

import { useQuery } from "@tanstack/react-query";
import { Database, RefreshCw } from "lucide-react";
import { PageLayout } from "@/components/layouts/page-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { trpc } from "@/utils/trpc";

export default function TestPage() {
  const { data, isLoading, error, refetch } = useQuery({
    ...trpc.tenant.testGestorConnection.queryOptions(),
    refetchOnWindowFocus: false,
  });

  return (
    <PageLayout
      breadcrumbs={[{ label: "Teste de Conexão" }]}
      subtitle="Teste de acesso aos dados do banco gestor (bussolla_db)"
      title="Teste de Conexão"
    >
      <div className="space-y-6">
        {/* Card de Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status da Conexão</CardTitle>
                <CardDescription>
                  Teste de acesso à tabela de usuários do banco gestor
                </CardDescription>
              </div>
              <Button
                disabled={isLoading}
                onClick={() => refetch()}
                size="sm"
                variant="outline"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Erro ao conectar com o banco:</p>
                  <p className="mt-1 text-sm">
                    {error instanceof Error
                      ? error.message
                      : "Erro desconhecido"}
                  </p>
                </AlertDescription>
              </Alert>
            ) : data?.success ? (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">
                    Conexão estabelecida com sucesso!
                  </p>
                  <p className="mt-1 text-sm">
                    {data.count} usuário(s) encontrado(s) no banco gestor
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        {data?.success && data.users && data.users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Banco Gestor</CardTitle>
              <CardDescription>
                Dados da tabela de usuários (bussolla_db)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(data.users[0] || {}).map((key) => (
                        <TableHead className="font-medium" key={key}>
                          {key}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user, index) => (
                      <TableRow key={index}>
                        {Object.entries(user).map(([key, value]) => (
                          <TableCell className="font-mono text-sm" key={key}>
                            {value === null || value === undefined
                              ? "-"
                              : String(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há dados */}
        {data?.success && (!data.users || data.users.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum usuário encontrado no banco de dados
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
