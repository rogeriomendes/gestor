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
    url: "/dashboard",
    icon: LayoutDashboard,
    permission: { resource: "DASHBOARD", action: "READ" },
  },
  {
    title: "Relatórios",
    url: "/reports",
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
    url: "/products",
    icon: Package,
    sub: [
      {
        title: "Cadastrados",
        url: "/products/list",
        icon: PackageOpen,
      },
      {
        title: "Promoções",
        url: "/products/sale",
        icon: SquarePercent,
      },
      {
        title: "Cartazes",
        url: "/products/posters",
        icon: FileText,
      },
    ],
  },
  {
    title: "Vendas",
    url: "/sales",
    icon: ShoppingCartIcon,
    sub: [
      {
        title: "Gestão de Vendas",
        url: "/sales/list",
        icon: ShoppingBagIcon,
      },
      {
        title: "Orçamentos e Pedidos",
        url: "/sales/budget",
        icon: SheetIcon,
      },
    ],
  },
  {
    title: "Financeiro",
    url: "/financial",
    icon: Landmark,
    sub: [
      {
        title: "Movimento do Caixa",
        url: "/financial/closing",
        icon: ChartNoAxesColumn,
      },
      {
        title: "Contas a Receber",
        url: "/financial/bills/receive",
        icon: HandCoins,
      },
      {
        title: "Contas a Pagar",
        url: "/financial/bills/pay",
        icon: Coins,
      },
    ],
  },
  {
    title: "Estoque",
    url: "/invoice",
    icon: File,
    sub: [
      {
        title: "Entrada de Nota Fiscal",
        url: "/invoice/entry",
        icon: FileCheck,
      },
      {
        title: "Doc. Fiscal Eletrônico",
        url: "/invoice/dfe",
        icon: FileSearch2,
      },
    ],
  },
];

export const tenantSettingsMenuItens: MenuItemProps[] = [
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    permission: { resource: "SETTINGS", action: "READ" },
  },
  {
    title: "Usuários",
    url: "/users",
    icon: Users,
    permission: { resource: "USER", action: "READ" },
  },
  {
    title: "Teste de Conexão",
    url: "/test",
    icon: Database,
    permission: { resource: "SETTINGS", action: "READ" },
  },
];
