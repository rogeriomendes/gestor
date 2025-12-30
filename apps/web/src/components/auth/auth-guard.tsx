"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import Loader from "@/components/loader";
import { useTenant } from "@/contexts/tenant-context";
import { authClient } from "@/lib/auth-client";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: "admin" | "tenant" | "any";
}

export function AuthGuard({ children, requiredRole = "any" }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const {
    role,
    isLoading: tenantLoading,
    isSuperAdmin,
    isTenantAdmin,
  } = useTenant();

  useEffect(() => {
    // Se ainda está carregando, aguardar
    if (sessionLoading || tenantLoading) {
      return;
    }

    // Se não há sessão, redirecionar para login
    if (!session?.user) {
      router.push("/");
      return;
    }

    // Se há sessão mas não há role (erro de autenticação), redirecionar para login
    if (!role) {
      router.push("/");
      return;
    }

    // Verificar role específico se necessário
    if (requiredRole === "admin" && !isSuperAdmin && !isTenantAdmin) {
      router.push("/dashboard");
      return;
    }

    // Para tenant, permitir acesso mesmo se for admin (admins podem ter tenant também)
    // A validação específica será feita nas páginas individuais
  }, [
    session,
    sessionLoading,
    tenantLoading,
    role,
    router,
    requiredRole,
    isSuperAdmin,
    isTenantAdmin,
  ]);

  // Mostrar loader enquanto verifica autenticação
  if (sessionLoading || tenantLoading) {
    return <Loader />;
  }

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!(session?.user && role)) {
    return null;
  }

  return <>{children}</>;
}
