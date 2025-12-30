"use client";

import { LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleBadge } from "@/components/role-badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import UserMenu from "@/components/user-menu";
import { useTenant } from "@/contexts/tenant-context";
import { useCanManageTenant, useCanManageUsers } from "@/lib/permissions";

export function TenantSidebar() {
  const { tenant, role } = useTenant();
  const canManageTenant = useCanManageTenant();
  const canManageUsers = useCanManageUsers();
  const pathname = usePathname();

  if (!tenant) {
    return null;
  }

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard" as const,
      icon: LayoutDashboard,
    },
    ...(canManageTenant
      ? [
          {
            title: "Configurações",
            url: "/settings" as const,
            icon: Settings,
          },
        ]
      : []),
    ...(canManageUsers
      ? [
          {
            title: "Usuários",
            url: "/users" as const,
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <Sidebar className="print:hidden" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-lg leading-none">
              {tenant.name}
            </h2>
            <p className="text-muted-foreground text-xs leading-none">
              {tenant.slug}
            </p>
          </div>
        </div>
        <div className="px-2">
          <RoleBadge role={role} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.url} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
