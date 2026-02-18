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
    createdAt: string;
    updatedAt: string;
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

  // Uma única query unificada que retorna tenant + role + permissões
  // Substitui as duas chamadas separadas (getMyTenant + debug.getMyContext)
  const profileQuery = useQuery({
    ...trpc.tenant.getMyProfile.queryOptions(),
    enabled: !!session?.user, // Só executa se houver sessão
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  const profile = profileQuery.data;

  // Extrair role e flags
  const role = (profile?.role ?? null) as Role | null;
  const isSuperAdmin = profile?.isSuperAdmin ?? false;
  const isTenantAdmin = role === "TENANT_ADMIN" || isSuperAdmin;

  // Extrair permissões
  const permissions = profile?.permissions
    ? new Set(profile.permissions)
    : null;

  // Extrair dados do tenant (sem role)
  // Se _isAdminWithoutTenant for true, não tem tenant real
  const tenantData =
    profile?.tenant && !profile.tenant._isAdminWithoutTenant
      ? {
          id: profile.tenant.id,
          name: profile.tenant.name,
          slug: profile.tenant.slug,
          active: profile.tenant.active,
          createdAt: profile.tenant.createdAt,
          updatedAt: profile.tenant.updatedAt,
          _count: profile.tenant._count,
        }
      : null;

  const value: TenantContextValue = {
    tenant: tenantData,
    role,
    isSuperAdmin,
    isTenantAdmin,
    permissions,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error as Error | null,
    refetch: () => {
      profileQuery.refetch();
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
