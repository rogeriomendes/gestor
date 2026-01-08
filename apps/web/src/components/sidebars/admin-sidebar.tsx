"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { RoleBadge } from "@/components/role-badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTenant } from "@/contexts/tenant-context";
import isActive from "@/lib/is-active";
import { useHasPermission } from "@/lib/permissions";
import UserCard from "../user-card";
import { adminMenuItens, type MenuItemProps } from "./admin-menu-itens";

function MenuItemWithPermission({
  item,
  pathname,
  searchParams,
}: {
  item: MenuItemProps;
  pathname: string;
  searchParams: URLSearchParams;
}) {
  const hasPermission = item.permission
    ? useHasPermission(item.permission.resource, item.permission.action)
    : true;

  if (!hasPermission) {
    return null;
  }

  const isLinkActive = isActive(item.url, pathname, searchParams);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isLinkActive}
        render={<Link href={item.url} />}
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AdminSidebar() {
  const { role } = useTenant();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Sidebar className="print:hidden" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-lg leading-none">
              Área Administrativa
            </h2>
            <p className="text-muted-foreground text-xs leading-none">
              Gestão do Sistema
            </p>
          </div>
        </div>
        <div className="px-2">
          <RoleBadge role={role} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Navegação</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItens.map((item) => (
                <MenuItemWithPermission
                  item={item}
                  key={item.url}
                  pathname={pathname}
                  searchParams={searchParams}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserCard />
      </SidebarFooter>
    </Sidebar>
  );
}
