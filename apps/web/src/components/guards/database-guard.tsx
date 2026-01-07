"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Database } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";

interface DatabaseGuardProps {
  children: React.ReactNode;
}

export function DatabaseGuard({ children }: DatabaseGuardProps) {
  const { tenant, isTenantAdmin } = useTenant();

  const { data: hasCredentials, isLoading } = useQuery({
    ...trpc.tenant.hasGestorCredentials.queryOptions(),
    enabled: !!tenant,
  });

  const { data: hasDfe } = useQuery({
    ...trpc.tenant.hasDfeEnabled.queryOptions(),
    enabled: !!tenant,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Se não tem credenciais, mostrar aviso
  if (!hasCredentials) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card className="border-yellow-500/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-yellow-600" />
              <div>
                <CardTitle className="text-yellow-600">
                  Configuração de Banco de Dados Necessária
                </CardTitle>
                <CardDescription>
                  As credenciais do banco de dados ainda não foram configuradas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ação Necessária</AlertTitle>
              <AlertDescription>
                Para acessar a área do cliente, é necessário que um
                administrador configure as credenciais do banco de dados.
              </AlertDescription>
            </Alert>

            {isTenantAdmin && (
              <div className="flex gap-2">
                <Button
                  render={
                    <Link href={`/admin/tenants/${tenant?.id}?tab=database`} />
                  }
                >
                  Configurar Agora
                </Button>
                <Button render={<Link href="/admin" />} variant="outline">
                  Voltar ao Admin
                </Button>
              </div>
            )}

            {!isTenantAdmin && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertTitle className="text-blue-600">
                  Entre em contato com o administrador
                </AlertTitle>
                <AlertDescription>
                  Você não tem permissão para configurar as credenciais. Entre
                  em contato com um administrador do sistema para realizar essa
                  configuração.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border-blue-500 border-l-4 bg-blue-500/10 p-4">
              <h4 className="mb-2 font-semibold text-blue-600 text-sm">
                ℹ️ Sobre o db-dfe
              </h4>
              <p className="text-muted-foreground text-sm">
                O banco de dados de documentos fiscais eletrônicos (db-dfe) é
                opcional e pode ser habilitado após a configuração do db-gestor.
                {hasDfe
                  ? " Atualmente está habilitado para este tenant."
                  : " Atualmente está desabilitado para este tenant."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tem credenciais, renderizar normalmente
  return <>{children}</>;
}
