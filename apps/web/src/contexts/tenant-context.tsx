"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

import { trpc } from "@/utils/trpc";

// Import Role type - será gerado pelo Prisma
type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

interface TenantContextValue {
  tenant: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      users: number;
    };
  } | null;
  role: Role | null;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  permissions: Set<string> | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();

  // Só fazer a query se houver sessão, evitando erro "Authentication required" em páginas públicas
  const queryResult = useQuery({
    ...trpc.tenant.getMyTenant.queryOptions(),
    enabled: !!session?.user, // Só executa se houver sessão
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Buscar permissões do usuário
  const permissionsQuery = useQuery({
    ...trpc.debug.getMyContext.queryOptions(),
    enabled: !!session?.user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  const tenant = queryResult.data as
    | ({
        id: string;
        name: string;
        slug: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count?: { users: number };
        role: Role;
        _isAdminWithoutTenant?: boolean;
      } | null)
    | undefined;

  // Extrair role e dados do tenant
  const role = tenant?.role ?? null;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isTenantAdmin = role === "TENANT_ADMIN" || isSuperAdmin;

  // Extrair permissões do contexto
  const permissions = permissionsQuery.data?.permissions
    ? new Set(permissionsQuery.data.permissions)
    : null;

  // Extrair dados do tenant (sem role)
  // Se _isAdminWithoutTenant for true, não tem tenant real
  const tenantData =
    tenant && !tenant._isAdminWithoutTenant
      ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          active: tenant.active,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          _count: tenant._count,
        }
      : null;

  const value: TenantContextValue = {
    tenant: tenantData,
    role,
    isSuperAdmin,
    isTenantAdmin,
    permissions,
    isLoading: queryResult.isLoading || permissionsQuery.isLoading,
    isError: queryResult.isError || permissionsQuery.isError,
    error: (queryResult.error || permissionsQuery.error) as Error | null,
    refetch: () => {
      queryResult.refetch();
      permissionsQuery.refetch();
    },
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
