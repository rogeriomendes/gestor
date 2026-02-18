"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminSidebar } from "@/components/sidebars/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Componente client que encapsula o guard e sidebar do admin.
 * Mantido separado do layout (Server Component) para não forçar toda a
 * subárvore a ser client-side desnecessariamente.
 */
export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="admin">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "19rem",
            "--sidebar-width-mobile": "18rem",
          } as React.CSSProperties
        }
      >
        <AdminSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
