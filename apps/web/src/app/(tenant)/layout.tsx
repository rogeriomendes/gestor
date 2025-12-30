"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { TenantSidebar } from "@/components/sidebars/tenant-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
          <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator className="mr-2 h-10" orientation="vertical" />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
