"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTenant } from "@/contexts/tenant-context";
import { useCanManageTenant, useCanManageUsers } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import { RoleBadge } from "./role-badge";

export function TenantHeader() {
  const { tenant, role, isLoading } = useTenant();
  const canManageTenant = useCanManageTenant();
  const canManageUsers = useCanManageUsers();
  const pathname = usePathname();

  // Se está carregando, não mostrar
  if (isLoading) {
    return null;
  }

  // Se não tem tenant (admins sem tenant), não mostrar header
  if (!tenant) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Dashboard" },
    ...(canManageTenant ? [{ href: "/settings", label: "Configurações" }] : []),
    ...(canManageUsers ? [{ href: "/users", label: "Usuários" }] : []),
  ];

  return (
    <div className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-semibold text-lg">{tenant.name}</h1>
            <p className="text-muted-foreground text-xs">{tenant.slug}</p>
          </div>
          <RoleBadge role={role} />
        </div>

        <nav className="flex gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium text-sm transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
