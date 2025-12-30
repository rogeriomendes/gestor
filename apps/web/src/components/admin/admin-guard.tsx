"use client";

import type { ReactNode } from "react";
import { TenantListSkeleton } from "@/components/tenant-loading";
import { useTenant } from "@/contexts/tenant-context";
import { AccessDenied } from "./access-denied";

type AdminGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Componente guard que verifica se o usuário tem permissão de admin.
 * Renderiza o conteúdo apenas se o usuário for admin.
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isTenantAdmin, isLoading } = useTenant();

  // Mostrar loading enquanto verifica permissão
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <TenantListSkeleton />
      </div>
    );
  }

  // Se não é admin, mostrar erro ou fallback customizado
  if (!isTenantAdmin) {
    return <>{fallback || <AccessDenied />}</>;
  }

  // Renderizar conteúdo se for admin
  return <>{children}</>;
}
