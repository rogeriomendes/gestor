"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantTabs } from "@/contexts/tenant-tabs-context";
import { cn } from "@/lib/utils";

export function TenantTabsBar() {
  const { tabs, activeTabId, navigateToTab, closeTab } = useTenantTabs();

  return (
    <div className="scrollbar-thin flex items-center gap-1 overflow-x-auto border-b bg-muted/20 px-2 py-1 md:px-4">
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
          >
            <button
              className="cursor-pointer whitespace-nowrap"
              onClick={() => navigateToTab(tab.href)}
              type="button"
            >
              {tab.label}
            </button>
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
