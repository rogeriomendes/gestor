"use client";

import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import FBILogo from "@/assets/FbiIcon.png";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import isActive from "@/lib/is-active";
import UserCard from "../user-card";
import { SubscriptionCard } from "./subscription-card";
import { tenantMenuItens, tenantSettingsMenuItens } from "./tenant-menu-itens";

export function TenantSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { isMobile, setOpenMobile } = useSidebar();

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemTitle)) {
        newSet.delete(itemTitle);
      } else {
        newSet.clear();
        newSet.add(itemTitle);
      }
      return newSet;
    });
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="print:hidden" collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <Link className="flex items-center gap-2" href="/dashboard">
            <Image
              alt="FBI"
              className="h-8 w-auto"
              src={FBILogo}
              unoptimized={true}
            />
            <span className="font-bold text-current text-xl">FBI</span>
          </Link>
          <div className="flex items-center gap-2" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tenantMenuItens.map((item) => {
                const isLinkActive = isActive(
                  item.url,
                  item.sub ? `/${String(pathname.split("/")[1])}` : pathname,
                  searchParams
                );

                return (
                  <Collapsible
                    key={item.title}
                    onOpenChange={() => item.sub && toggleExpanded(item.title)}
                    open={expandedItems.has(item.title)}
                    render={
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          className="cursor-pointer"
                          isActive={isLinkActive}
                          render={
                            item.sub ? (
                              <button
                                onClick={() => toggleExpanded(item.title)}
                                type="button"
                              />
                            ) : (
                              <Link href={item.url} onClick={handleLinkClick} />
                            )
                          }
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          {/* {item.sub && (
                            <ChevronRightIcon
                              className={`ml-auto size-4 transition-transform duration-300 ${
                                expandedItems.has(item.title)
                                  ? "rotate-90"
                                  : "rotate-0"
                              }`}
                            />
                          )} */}
                        </SidebarMenuButton>
                        {item.sub && (
                          <>
                            <CollapsibleTrigger
                              render={
                                <SidebarMenuAction
                                  className={`right-1.5 mt-0.5 ml-auto size-4 transition-transform duration-300 ${
                                    expandedItems.has(item.title)
                                      ? "rotate-90"
                                      : "rotate-0"
                                  }`}
                                />
                                //     <ChevronRightIcon
                                //   className={`ml-auto size-4 transition-transform duration-300 ${
                                //     expandedItems.has(item.title)
                                //       ? "rotate-90"
                                //       : "rotate-0"
                                //   }`}
                                // />
                              }
                            >
                              <ChevronRightIcon />
                              <span className="sr-only">Toggle</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.sub.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      isActive={isActive(
                                        subItem.url,
                                        pathname,
                                        searchParams
                                      )}
                                      render={
                                        <Link
                                          href={subItem.url}
                                          onClick={handleLinkClick}
                                        />
                                      }
                                    >
                                      <subItem.icon />
                                      <span>{subItem.title}</span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        )}
                      </SidebarMenuItem>
                    }
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          {/* <SidebarGroupLabel>Configurações</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {tenantSettingsMenuItens.map((item) => {
                const isLinkActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={isLinkActive}
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
      <SidebarFooter className="mt-4">
        <SubscriptionCard />
        <UserCard />
      </SidebarFooter>
    </Sidebar>
  );
}
