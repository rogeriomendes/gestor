"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DatabaseConfigGuard } from "@/components/database-config";
import { TenantSidebar } from "@/components/sidebars/tenant-sidebar";
import { SubscriptionGuard } from "@/components/subscription/subscription-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CompanyProvider } from "@/contexts/company-context";
import { TenantTabsProvider } from "@/contexts/tenant-tabs-context";
import { TextShowProvider } from "@/contexts/text-show-context";

/**
 * Componente client que encapsula todos os providers e guards do tenant.
 * Mantido separado do layout (Server Component) para não forçar toda a
 * subárvore a ser client-side desnecessariamente.
 */
export function TenantLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="tenant">
      <CompanyProvider>
        <TextShowProvider>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "19rem",
                "--sidebar-width-mobile": "18rem",
              } as React.CSSProperties
            }
          >
            <TenantTabsProvider>
              <TenantSidebar />
              <SidebarInset>
                <SubscriptionGuard>
                  <DatabaseConfigGuard>{children}</DatabaseConfigGuard>
                </SubscriptionGuard>
              </SidebarInset>
            </TenantTabsProvider>
          </SidebarProvider>
        </TextShowProvider>
      </CompanyProvider>
    </AuthGuard>
  );
}
