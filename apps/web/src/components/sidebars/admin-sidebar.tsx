"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FbiIcon } from "@/assets/FbiIcon";
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
  const hasPermissionResult = useHasPermission(
    item.permission?.resource ?? "DASHBOARD",
    item.permission?.action ?? "READ"
  );
  const hasPermission = item.permission ? hasPermissionResult : true;

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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Sidebar className="print:hidden" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center gap-2">
              <FbiIcon aria-label="FBI Logo" className="size-8" />
              <span className="font-bold text-current text-xl">FBI</span>
            </div>
            <p className="mt-2 text-muted-foreground text-sm leading-none">
              Área Administrativa
            </p>
          </div>
        </div>
      </SidebarHeader>
      {/* <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <Link className="flex items-center gap-2" href="/dashboard">
            <FbiIcon aria-label="FBI Logo" className="size-8" />
            <span className="font-bold text-current text-xl">FBI</span>
          </Link>
        </div>
      </SidebarHeader> */}
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
