import {
  ChartColumn,
  ChartNoAxesColumn,
  Coins,
  Database,
  File,
  FileCheck,
  FileSearch2,
  FileText,
  HandCoins,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Package,
  PackageOpen,
  Settings,
  SheetIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SquarePercent,
  Users,
} from "lucide-react";
import type { MenuItemProps } from "./types";

export const tenantMenuItens: MenuItemProps[] = [
  {
    title: "Dashboard",
    url: "/dashboard" as any,
    icon: LayoutDashboard,
    permission: { resource: "DASHBOARD", action: "READ" },
  },
  {
    title: "Relatórios",
    url: "/reports" as any,
    icon: ChartColumn,
    // sub: [
    //   {
    //     title: "Relatórios",
    //     url: "/reports",
    //     icon: ChartLine,
    //   },
    // ],
  },
  {
    title: "Produtos",
    url: "/products" as any,
    icon: Package,
    sub: [
      {
        title: "Cadastrados",
        url: "/products/list" as any,
        icon: PackageOpen,
      },
      {
        title: "Promoções",
        url: "/products/sale" as any,
        icon: SquarePercent,
      },
      {
        title: "Cartazes",
        url: "/products/posters" as any,
        icon: FileText,
      },
    ],
  },
  {
    title: "Vendas",
    url: "/sales" as any,
    icon: ShoppingCartIcon,
    sub: [
      {
        title: "Gestão de Vendas",
        url: "/sales/list" as any,
        icon: ShoppingBagIcon,
      },
      {
        title: "Orçamentos e Pedidos",
        url: "/sales/budget" as any,
        icon: SheetIcon,
      },
    ],
  },
  {
    title: "Financeiro",
    url: "/financial" as any,
    icon: Landmark,
    sub: [
      {
        title: "Movimento do Caixa",
        url: "/financial/closing" as any,
        icon: ChartNoAxesColumn,
      },
      {
        title: "Contas a Receber",
        url: "/financial/bills/receive" as any,
        icon: HandCoins,
      },
      {
        title: "Contas a Pagar",
        url: "/financial/bills/pay" as any,
        icon: Coins,
      },
    ],
  },
  {
    title: "Estoque",
    url: "/invoice" as any,
    icon: File,
    sub: [
      {
        title: "Entrada de Nota Fiscal",
        url: "/invoice/entry" as any,
        icon: FileCheck,
      },
      {
        title: "Doc. Fiscal Eletrônico",
        url: "/invoice/dfe" as any,
        icon: FileSearch2,
      },
    ],
  },
];

export const tenantSettingsMenuItens: MenuItemProps[] = [
  {
    title: "Configurações",
    url: "/settings" as any,
    icon: Settings,
    permission: { resource: "SETTINGS", action: "READ" },
  },
  {
    title: "Suporte",
    url: "/support" as any,
    icon: LifeBuoy,
  },
  {
    title: "Usuários",
    url: "/users" as any,
    icon: Users,
    permission: { resource: "USER", action: "READ" },
  },
  {
    title: "Teste de Conexão",
    url: "/test" as any,
    icon: Database,
    permission: { resource: "SETTINGS", action: "READ" },
  },
];
