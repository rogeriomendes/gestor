"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTenant } from "@/contexts/tenant-context";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format-date";

export interface TenantTabItem {
  href: string;
  id: string;
  isPinned?: boolean;
  label: string;
  lastActiveAt?: number;
}

interface TenantTabsContextValue {
  activeTabId: string;
  closeOtherTabs: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  closeTabsToRight: (tabId: string) => void;
  navigateToTab: (href: string) => void;
  openOrActivateTab: (tab: TenantTabItem) => void;
  setTabLabel: (tabId: string, label: string) => void;
  tabs: TenantTabItem[];
  togglePinTab: (tabId: string) => void;
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

const MAX_TENANT_TABS = 10;

const TABS_STORAGE_VERSION = 1;

function buildTabsStorageKey(tenantId: string, userId: string) {
  return `gestor-tenant-tabs:v${TABS_STORAGE_VERSION}:${tenantId}:${userId}`;
}

interface PersistedTabsPayload {
  tabs: TenantTabItem[];
  v: number;
}

function loadTabsFromStorage(raw: string | null): TenantTabItem[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PersistedTabsPayload;
    if (parsed?.v !== TABS_STORAGE_VERSION || !Array.isArray(parsed.tabs)) {
      return null;
    }
    return parsed.tabs;
  } catch {
    return null;
  }
}

function sanitizeTabsFromStorage(incoming: TenantTabItem[]): TenantTabItem[] {
  const seen = new Set<string>();
  const result: TenantTabItem[] = [];

  const dashboardStored = incoming.find((t) => t.id === DASHBOARD_TAB.id);
  result.push({
    ...DASHBOARD_TAB,
    ...dashboardStored,
    id: DASHBOARD_TAB.id,
    href: DASHBOARD_TAB.href,
    label: "Dashboard",
    isPinned: true,
  });
  seen.add(DASHBOARD_TAB.id);

  for (const t of incoming) {
    if (seen.has(t.id)) {
      continue;
    }
    if (!(t.id?.trim() && t.href?.trim() && t.label?.trim())) {
      continue;
    }
    seen.add(t.id);
    result.push({
      ...t,
      isPinned: t.id === DASHBOARD_TAB.id || !!t.isPinned,
      lastActiveAt:
        typeof t.lastActiveAt === "number" ? t.lastActiveAt : Date.now(),
    });
  }

  while (result.length > MAX_TENANT_TABS) {
    const victim = pickMostInactiveClosableTab(result);
    if (!victim) {
      break;
    }
    result.splice(
      result.findIndex((x) => x.id === victim.id),
      1
    );
  }

  return result;
}

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

export function TenantTabsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const topLoader = useTopLoader();

  const tenantId = tenant?.id ?? null;
  const userId = session?.user?.id ?? null;
  const persistKey =
    tenantId && userId ? buildTabsStorageKey(tenantId, userId) : null;

  const activeTabId = useMemo(() => pathname, [pathname]);
  const activeHref = useMemo(
    () => buildHref(pathname, searchParams),
    [pathname, searchParams]
  );
  const [tabs, setTabs] = useState<TenantTabItem[]>([DASHBOARD_TAB]);
  const [tabsHydrated, setTabsHydrated] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [pendingOpenTab, setPendingOpenTab] = useState<TenantTabItem | null>(
    null
  );
  const [suggestedCloseTab, setSuggestedCloseTab] =
    useState<TenantTabItem | null>(null);

  /** Só persiste após hidratar a chave tenant+usuário atual (evita sobrescrever outro slot). */
  const persistedKeyRef = useRef<string | null>(null);

  // Hidrata abas do localStorage (por tenant + usuário) antes de sincronizar com a URL.
  useEffect(() => {
    if (tenantLoading || sessionLoading) {
      return;
    }
    persistedKeyRef.current = null;
    if (!tenantId) {
      setTabs([DASHBOARD_TAB]);
      setTabsHydrated(true);
      return;
    }
    if (!(userId && persistKey)) {
      setTabs([DASHBOARD_TAB]);
      setTabsHydrated(true);
      return;
    }

    const raw = window.localStorage.getItem(persistKey);
    const loaded = loadTabsFromStorage(raw);
    if (loaded && loaded.length > 0) {
      setTabs(sanitizeTabsFromStorage(loaded));
    } else {
      setTabs([DASHBOARD_TAB]);
    }
    persistedKeyRef.current = persistKey;
    setTabsHydrated(true);
  }, [tenantLoading, sessionLoading, tenantId, userId, persistKey]);

  useEffect(() => {
    if (!(persistKey && tabsHydrated)) {
      return;
    }
    if (persistedKeyRef.current !== persistKey) {
      return;
    }
    try {
      const payload: PersistedTabsPayload = {
        v: TABS_STORAGE_VERSION,
        tabs,
      };
      window.localStorage.setItem(persistKey, JSON.stringify(payload));
    } catch {
      // storage cheio ou indisponível — ignora
    }
  }, [persistKey, tabs, tabsHydrated]);

  useEffect(() => {
    if (!tabsHydrated) {
      return;
    }
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
  }, [activeHref, pathname, tabsHydrated]);

  useEffect(() => {
    if (!tabsHydrated) {
      return;
    }
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
  }, [activeTabId, tabsHydrated]);

  const navigateToTab = useCallback(
    (href: string) => {
      router.push(href as Route);
    },
    [router]
  );

  const openOrActivateTab = useCallback(
    (tab: TenantTabItem) => {
      const now = Date.now();
      let shouldNavigate = true;

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
            shouldNavigate = false;
            return current;
          }

          setPendingOpenTab({ ...tab, lastActiveAt: now });
          setSuggestedCloseTab(candidate);
          setLimitDialogOpen(true);
          shouldNavigate = false;
          return current;
        }

        return [...current, { ...tab, lastActiveAt: now }];
      });

      if (shouldNavigate) {
        navigateToTab(tab.href);
      } else {
        // nextjs-toploader escuta click em document e chama nprogress.start() *depois*
        // do nosso onClick no Link (bubble). Sem isso a barra fica ativa ao cancelar.
        queueMicrotask(() => {
          topLoader.done();
        });
      }
    },
    [navigateToTab, topLoader]
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

  const closeOtherTabs = useCallback((tabId: string) => {
    setTabs((current) => {
      const keep = new Set(
        current.filter((t) => t.isPinned || t.id === tabId).map((t) => t.id)
      );
      keep.add(DASHBOARD_TAB.id);
      return current.filter((t) => keep.has(t.id));
    });
  }, []);

  const closeTabsToRight = useCallback((tabId: string) => {
    setTabs((current) => {
      const index = current.findIndex((t) => t.id === tabId);
      if (index < 0) {
        return current;
      }

      const leftSide = current.slice(0, index + 1);
      const rightSide = current.slice(index + 1);
      const pinnedRight = rightSide.filter((t) => t.isPinned);
      const result = [...leftSide, ...pinnedRight];

      const seen = new Set<string>();
      return result.filter((t) => {
        if (seen.has(t.id)) {
          return false;
        }
        seen.add(t.id);
        return true;
      });
    });
  }, []);

  const togglePinTab = useCallback((tabId: string) => {
    setTabs((current) => {
      const index = current.findIndex((t) => t.id === tabId);
      if (index < 0) {
        return current;
      }
      const existing = current[index];
      if (!existing) {
        return current;
      }
      if (existing.id === DASHBOARD_TAB.id) {
        return current;
      }

      const next = [...current];
      next[index] = { ...existing, isPinned: !existing.isPinned };
      return next;
    });
  }, []);

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
      closeOtherTabs,
      closeTabsToRight,
      setTabLabel,
      togglePinTab,
    }),
    [
      tabs,
      activeTabId,
      openOrActivateTab,
      navigateToTab,
      closeTab,
      closeOtherTabs,
      closeTabsToRight,
      setTabLabel,
      togglePinTab,
    ]
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
                  {formatDate(new Date(suggestedCloseTab.lastActiveAt ?? 0))}
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
            queueMicrotask(() => {
              topLoader.done();
            });
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
