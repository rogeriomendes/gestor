"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
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
      <SidebarProvider>
        <TenantSidebar />
        <SidebarInset>
          <SubscriptionGuard>{children}</SubscriptionGuard>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
