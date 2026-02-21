"use client";

import type { ReactNode } from "react";
import {
  type PermissionAction,
  type PermissionResource,
  useHasAllPermissions,
  useHasAnyPermission,
  useHasPermission,
} from "@/lib/permissions";

interface PermissionGuardProps {
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * Se true, oculta completamente o elemento (não renderiza nada)
   * Se false, renderiza o fallback (padrão: null)
   */
  hide?: boolean;
  resource: PermissionResource;
}

/**
 * Componente que renderiza children apenas se o usuário tiver a permissão especificada
 */
export function PermissionGuard({
  children,
  resource,
  action,
  fallback = null,
  hide = true,
}: PermissionGuardProps) {
  const hasPermission = useHasPermission(resource, action);

  if (!hasPermission) {
    return hide ? null : fallback;
  }

  return <>{children}</>;
}

interface PermissionAnyGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  hide?: boolean;
  permissions: Array<{
    resource: PermissionResource;
    action: PermissionAction;
  }>;
}

/**
 * Componente que renderiza children se o usuário tiver qualquer uma das permissões especificadas (OR)
 */
export function PermissionAnyGuard({
  children,
  permissions,
  fallback = null,
  hide = true,
}: PermissionAnyGuardProps) {
  const hasAnyPermission = useHasAnyPermission(permissions);

  if (!hasAnyPermission) {
    return hide ? null : fallback;
  }

  return <>{children}</>;
}

interface PermissionAllGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  hide?: boolean;
  permissions: Array<{
    resource: PermissionResource;
    action: PermissionAction;
  }>;
}

/**
 * Componente que renderiza children apenas se o usuário tiver todas as permissões especificadas (AND)
 */
export function PermissionAllGuard({
  children,
  permissions,
  fallback = null,
  hide = true,
}: PermissionAllGuardProps) {
  const hasAllPermissions = useHasAllPermissions(permissions);

  if (!hasAllPermissions) {
    return hide ? null : fallback;
  }

  return <>{children}</>;
}
