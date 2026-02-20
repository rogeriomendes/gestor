import type { LucideIcon } from "lucide-react";
import { adminMenuItens } from "@/components/sidebars/admin-menu-itens";
import {
  tenantMenuItens,
  tenantSettingsMenuItens,
} from "@/components/sidebars/tenant-menu-itens";
import type { MenuItemProps } from "@/components/sidebars/types";

/**
 * Achata itens do menu (incluindo subitens) em uma lista de { url, icon }.
 * Útil para resolver ícone por pathname ou outras buscas por rota.
 */
export function flattenMenuItems(
  items: MenuItemProps[]
): { url: string; icon: LucideIcon }[] {
  const result: { url: string; icon: LucideIcon }[] = [];
  for (const item of items) {
    result.push({ url: String(item.url), icon: item.icon });
    if (item.sub) {
      for (const sub of item.sub) {
        result.push({ url: String(sub.url), icon: sub.icon });
      }
    }
  }
  return result;
}

const APP_MENU_ITEMS = [
  ...adminMenuItens,
  ...tenantMenuItens,
  ...tenantSettingsMenuItens,
];

/**
 * Retorna o ícone do menu associado ao pathname atual.
 * Usa o match mais específico (prefixo mais longo), ex.: /financial/bills/receive
 * usa o ícone de "Contas a Receber", não de "Financeiro".
 */
export function getIconForPathname(pathname: string): LucideIcon | null {
  const flat = flattenMenuItems(APP_MENU_ITEMS);
  const sorted = [...flat].sort((a, b) => b.url.length - a.url.length);
  const match = sorted.find(
    (item) => pathname === item.url || pathname.startsWith(`${item.url}/`)
  );
  return match?.icon ?? null;
}
