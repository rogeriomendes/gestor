"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DatabaseConfigGuard } from "@/components/database-config";
import { TenantSidebar } from "@/components/sidebars/tenant-sidebar";
import { SubscriptionGuard } from "@/components/subscription";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="tenant">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "19rem",
            "--sidebar-width-mobile": "18rem",
          } as React.CSSProperties
        }
      >
        <TenantSidebar />
        <SidebarInset>
          <SubscriptionGuard>
            <DatabaseConfigGuard>{children}</DatabaseConfigGuard>
          </SubscriptionGuard>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
