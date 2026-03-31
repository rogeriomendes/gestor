"use client";

import { MoreVerticalIcon, PinIcon, PinOffIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTenantTabs } from "@/contexts/tenant-tabs-context";
import { cn } from "@/lib/utils";

export function TenantTabsBar() {
  const router = useRouter();
  const {
    tabs,
    activeTabId,
    navigateToTab,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    togglePinTab,
  } = useTenantTabs();

  return (
    <div className="scrollbar-thin flex w-full max-w-full items-center gap-1 overflow-x-auto border-b bg-muted/20 px-2 py-1 md:px-4">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            className={cn(
              "group flex shrink-0 items-center rounded-md border px-2 py-1 text-xs transition-colors",
              isActive
                ? "border-primary/30 bg-background text-foreground"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
            )}
            key={tab.id}
            onContextMenu={(event) => {
              event.preventDefault();
              // Abre pelo botão (Menu) - a interação é igual ao clique.
              // Mantemos preventDefault para evitar menu nativo do browser.
            }}
          >
            <button
              className="cursor-pointer whitespace-nowrap"
              onClick={() => navigateToTab(tab.href)}
              type="button"
            >
              {tab.label}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="ml-1 h-5 w-5 cursor-pointer p-0 opacity-0 hover:opacity-100 group-hover:opacity-80"
                    size="icon"
                    type="button"
                    variant="ghost"
                  />
                }
              >
                <MoreVerticalIcon className="size-3" />
                <span className="sr-only">Menu da aba</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" sideOffset={6}>
                {/* <DropdownMenuItem onClick={() => navigateToTab(tab.href)}>
                  Ir para
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.refresh()}>
                  Recarregar
                </DropdownMenuItem>
                <DropdownMenuSeparator /> */}
                <DropdownMenuItem onClick={() => togglePinTab(tab.id)}>
                  {tab.isPinned ? <PinOffIcon /> : <PinIcon />}
                  {tab.isPinned ? "Desafixar" : "Fixar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => closeTab(tab.id)}
                  variant={tab.isPinned ? "default" : "destructive"}
                >
                  <XIcon />
                  Fechar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => closeOtherTabs(tab.id)}>
                  Fechar outras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => closeTabsToRight(tab.id)}>
                  Fechar à direita
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!tab.isPinned && (
              <Button
                className="ml-1 h-5 w-5 cursor-pointer p-0 opacity-70 hover:opacity-100"
                onClick={() => closeTab(tab.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-3" />
                <span className="sr-only">Fechar aba</span>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
