"use client";

import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";

interface DatabaseConfigGuardProps {
  children: React.ReactNode;
}

/**
 * Componente que verifica se o tenant possui credenciais de banco de dados configuradas.
 * - Se as credenciais estiverem configuradas, renderiza os children
 * - Se não tiver credenciais, mostra tela de aviso
 * - A página de configurações (/settings) é sempre acessível
 * - Super admins têm acesso irrestrito
 */
export function DatabaseConfigGuard({ children }: DatabaseConfigGuardProps) {
  const pathname = usePathname();
  const { tenant, isSuperAdmin, isLoading: isTenantLoading } = useTenant();

  const { data: credentialsCheck, isLoading: isCredentialsLoading } = useQuery({
    ...trpc.tenant.checkDatabaseCredentials.queryOptions(),
    enabled: !!tenant && !isSuperAdmin,
  });

  // Super Admins têm acesso irrestrito
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Página de configurações é sempre acessível
  if (pathname === "/settings") {
    return <>{children}</>;
  }

  // Loading state
  if (isTenantLoading || isCredentialsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não tem credenciais configuradas, bloquear acesso
  if (!credentialsCheck?.hasCredentials) {
    return (
      <DatabaseConfigBlockedScreen
        description={
          credentialsCheck?.message ||
          "As credenciais de banco de dados não estão configuradas. Entre em contato com o administrador para configurar as credenciais."
        }
      />
    );
  }

  // Credenciais configuradas, permitir acesso
  return <>{children}</>;
}

interface DatabaseConfigBlockedScreenProps {
  description: string;
}

function DatabaseConfigBlockedScreen({
  description,
}: DatabaseConfigBlockedScreenProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <Database className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle>Credenciais de Banco de Dados Não Configuradas</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            É necessário configurar as credenciais do banco para acessar esta
            área. Entre em contato com o administrador para adicionar as
            credenciais do banco.
          </p>
        </CardContent>
        {/* <CardFooter className="justify-center">
          <Link href="/settings">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Ver Configurações
            </Button>
          </Link>
        </CardFooter> */}
      </Card>
    </div>
  );
}
