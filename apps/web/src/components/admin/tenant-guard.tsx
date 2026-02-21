"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";
import Loader from "../loader";
import { AccessDenied } from "./access-denied";
import { TenantNotFound } from "./tenant-not-found";

// Tipo do tenant retornado pela query getTenant
// Usa string | Date porque os dados podem vir serializados do tRPC
export interface TenantWithRelations {
  active: boolean;
  branches: Array<{
    id: string;
    name: string;
    isMain: boolean;
    legalName: string | null;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    addressStreet: string | null;
    addressNumber: string | null;
    addressComplement: string | null;
    addressDistrict: string | null;
    addressCity: string | null;
    addressState: string | null;
    addressZipCode: string | null;
    notes: string | null;
    active: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    deletedAt: string | Date | null;
    deletedBy: string | null;
    tenantId: string;
  }>;
  createdAt: string | Date;
  deletedAt: string | Date | null;
  deletedBy: string | null;
  email: string | null;
  id: string;
  name: string;
  notes: string | null;
  phone: string | null;
  slug: string;
  updatedAt: string | Date;
  users: Array<{
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string | null;
  }>;
  website: string | null;
}

interface TenantGuardProps {
  children: (props: { tenant: TenantWithRelations }) => ReactNode;
  fallback?: {
    accessDenied?: ReactNode;
    notFound?: ReactNode;
    loading?: ReactNode;
  };
  tenantId: string;
}

/**
 * Componente guard que verifica:
 * 1. Se o usuário tem permissão de admin
 * 2. Se o tenant existe
 *
 * Renderiza o conteúdo apenas se ambas as condições forem satisfeitas.
 * O tenant é passado como prop para o children através de uma função render.
 *
 * IMPORTANTE: Todos os hooks dentro do children devem ser chamados sempre,
 * independentemente do estado de loading/erro. Use enabled/conditional rendering
 * dentro dos hooks para controlar quando eles executam.
 */
export function TenantGuard({
  tenantId,
  children,
  fallback,
}: TenantGuardProps) {
  const { isTenantAdmin, isLoading: tenantLoading } = useTenant();

  const { data: tenant, isLoading: tenantDataLoading } = useQuery({
    ...trpc.admin.getTenant.queryOptions({ tenantId }),
    enabled: isTenantAdmin && !!tenantId,
  });

  const isLoading = tenantLoading || tenantDataLoading;

  // Mostrar loading enquanto verifica permissão e carrega tenant
  if (isLoading) {
    return <>{fallback?.loading || <Loader />}</>;
  }

  // Se não é admin, mostrar erro
  if (!isTenantAdmin) {
    return <>{fallback?.accessDenied || <AccessDenied />}</>;
  }

  // Se tenant não existe, mostrar erro
  if (!tenant) {
    return <>{fallback?.notFound || <TenantNotFound />}</>;
  }

  // Renderizar conteúdo com tenant disponível
  // IMPORTANTE: O children é uma função que pode conter hooks.
  // Para evitar problemas com a ordem dos hooks, sempre chamamos children,
  // mas garantimos que tenant não seja null neste ponto.
  return <>{children({ tenant })}</>;
}
