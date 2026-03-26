"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface TenantTabItem {
  href: string;
  id: string;
  isPinned?: boolean;
  label: string;
  lastActiveAt?: number;
}

interface TenantTabsContextValue {
  activeTabId: string;
  closeTab: (tabId: string) => void;
  navigateToTab: (href: string) => void;
  openOrActivateTab: (tab: TenantTabItem) => void;
  setTabLabel: (tabId: string, label: string) => void;
  tabs: TenantTabItem[];
}

const DASHBOARD_TAB: TenantTabItem = {
  id: "/dashboard",
  href: "/dashboard",
  label: "Dashboard",
  isPinned: true,
  lastActiveAt: Date.now(),
};

const TenantTabsContext = createContext<TenantTabsContextValue | null>(null);

function buildHref(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function makeFallbackLabel(pathname: string) {
  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "dashboard";
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const MAX_TENANT_TABS = 6;

function pickMostInactiveClosableTab(tabs: TenantTabItem[]) {
  const closable = tabs.filter((t) => !t.isPinned);
  if (closable.length === 0) {
    return null;
  }
  return closable.reduce<TenantTabItem>((oldest, current) => {
    const oldestTs = oldest.lastActiveAt ?? 0;
    const currentTs = current.lastActiveAt ?? 0;
    return currentTs < oldestTs ? current : oldest;
  }, closable[0]);
}

function formatLastActiveAt(ts?: number) {
  if (!ts) {
    return "desconhecido";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function TenantTabsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTabId = useMemo(() => pathname, [pathname]);
  const activeHref = useMemo(
    () => buildHref(pathname, searchParams),
    [pathname, searchParams]
  );
  const [tabs, setTabs] = useState<TenantTabItem[]>([DASHBOARD_TAB]);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [pendingOpenTab, setPendingOpenTab] = useState<TenantTabItem | null>(
    null
  );
  const [suggestedCloseTab, setSuggestedCloseTab] =
    useState<TenantTabItem | null>(null);

  useEffect(() => {
    const tabLabel =
      pathname === "/dashboard" ? "Dashboard" : makeFallbackLabel(pathname);
    setTabs((current) => {
      const existingIndex = current.findIndex((tab) => tab.id === pathname);
      if (existingIndex >= 0) {
        const existing = current[existingIndex];
        // Atualiza apenas o href (com query) da aba atual, sem criar nova aba.
        if (
          existing &&
          (existing.href !== activeHref || existing.label !== tabLabel)
        ) {
          const next = [...current];
          next[existingIndex] = {
            ...existing,
            href: activeHref,
            label: existing.label || tabLabel,
          };
          return next;
        }
        return current;
      }
      return [
        ...current,
        {
          id: pathname,
          href: activeHref,
          label: tabLabel,
          lastActiveAt: Date.now(),
        },
      ];
    });
  }, [activeHref, pathname]);

  useEffect(() => {
    setTabs((current) => {
      const index = current.findIndex((tab) => tab.id === activeTabId);
      if (index < 0) {
        return current;
      }
      const existing = current[index];
      if (!existing) {
        return current;
      }
      const next = [...current];
      next[index] = { ...existing, lastActiveAt: Date.now() };
      return next;
    });
  }, [activeTabId]);

  const navigateToTab = useCallback(
    (href: string) => {
      router.push(href as Route);
    },
    [router]
  );

  const openOrActivateTab = useCallback(
    (tab: TenantTabItem) => {
      const now = Date.now();

      setTabs((current) => {
        const existingIndex = current.findIndex((item) => item.id === tab.id);
        if (existingIndex >= 0) {
          const existing = current[existingIndex];
          if (!existing) {
            return current;
          }
          const next = [...current];
          next[existingIndex] = {
            ...existing,
            href: tab.href ?? existing.href,
            label: tab.label ?? existing.label,
            lastActiveAt: now,
          };
          return next;
        }

        const totalTabs = current.length;
        if (totalTabs >= MAX_TENANT_TABS) {
          const candidate = pickMostInactiveClosableTab(current);
          if (!candidate) {
            toast.warning(
              `Limite de ${MAX_TENANT_TABS} abas atingido. Feche uma aba para abrir outra.`
            );
            return current;
          }

          setPendingOpenTab({ ...tab, lastActiveAt: now });
          setSuggestedCloseTab(candidate);
          setLimitDialogOpen(true);
          return current;
        }

        return [...current, { ...tab, lastActiveAt: now }];
      });

      // Se abriu o dialog, não navega agora.
      if (!limitDialogOpen) {
        navigateToTab(tab.href);
      }
    },
    [limitDialogOpen, navigateToTab]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      let fallbackHrefToNavigate: string | null = null;

      setTabs((current) => {
        const tabToClose = current.find((item) => item.id === tabId);
        if (!tabToClose || tabToClose.isPinned) {
          return current;
        }

        const nextTabs = current.filter((item) => item.id !== tabId);
        if (tabId === activeTabId) {
          const fallback = nextTabs.at(-1) ?? DASHBOARD_TAB;
          fallbackHrefToNavigate = fallback.href;
        }

        return nextTabs;
      });

      if (fallbackHrefToNavigate) {
        navigateToTab(fallbackHrefToNavigate);
      }
    },
    [activeTabId, navigateToTab]
  );

  const setTabLabel = useCallback((tabId: string, label: string) => {
    setTabs((current) => {
      const index = current.findIndex((tab) => tab.id === tabId);
      if (index < 0) {
        return current;
      }
      const existing = current[index];
      if (!existing || existing.label === label) {
        return current;
      }
      const next = [...current];
      next[index] = { ...existing, label };
      return next;
    });
  }, []);

  const handleConfirmCloseAndOpen = useCallback(() => {
    if (!(pendingOpenTab && suggestedCloseTab)) {
      setLimitDialogOpen(false);
      setPendingOpenTab(null);
      setSuggestedCloseTab(null);
      return;
    }

    const tabToOpen = pendingOpenTab;
    const tabToClose = suggestedCloseTab;

    setTabs((current) => {
      const filtered = current.filter((t) => t.id !== tabToClose.id);
      if (filtered.some((t) => t.id === tabToOpen.id)) {
        return filtered;
      }
      return [...filtered, { ...tabToOpen, lastActiveAt: Date.now() }];
    });

    setLimitDialogOpen(false);
    setPendingOpenTab(null);
    setSuggestedCloseTab(null);

    navigateToTab(tabToOpen.href);
  }, [navigateToTab, pendingOpenTab, suggestedCloseTab]);

  const contextValue = useMemo<TenantTabsContextValue>(
    () => ({
      tabs,
      activeTabId,
      openOrActivateTab,
      navigateToTab,
      closeTab,
      setTabLabel,
    }),
    [tabs, activeTabId, openOrActivateTab, navigateToTab, closeTab, setTabLabel]
  );

  return (
    <TenantTabsContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        cancelText="Cancelar"
        confirmText="Fechar e abrir"
        description={
          <div className="space-y-2">
            <div>
              Você atingiu o limite de <strong>{MAX_TENANT_TABS}</strong> abas
              abertas.
            </div>
            {suggestedCloseTab && pendingOpenTab && (
              <div className="space-y-1">
                <div>
                  Para abrir <strong>{pendingOpenTab.label}</strong>, sugerimos
                  fechar a aba mais inativa:{" "}
                  <strong>{suggestedCloseTab.label}</strong>.
                </div>
                <div className="text-muted-foreground text-xs">
                  Última atividade:{" "}
                  {formatLastActiveAt(suggestedCloseTab.lastActiveAt)}
                </div>
              </div>
            )}
          </div>
        }
        onConfirm={handleConfirmCloseAndOpen}
        onOpenChange={(open) => {
          setLimitDialogOpen(open);
          if (!open) {
            setPendingOpenTab(null);
            setSuggestedCloseTab(null);
          }
        }}
        open={limitDialogOpen}
        title="Limite de abas atingido"
        variant="destructive"
      />
    </TenantTabsContext.Provider>
  );
}

export function useTenantTabs() {
  const context = useContext(TenantTabsContext);
  if (!context) {
    throw new Error(
      "useTenantTabs deve ser usado dentro de TenantTabsProvider."
    );
  }
  return context;
}

export function useOptionalTenantTabs() {
  return useContext(TenantTabsContext);
}
