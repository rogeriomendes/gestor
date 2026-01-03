import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Shield,
  Users,
} from "lucide-react";
import type { MenuItemProps } from "./types";

export const adminMenuItens: MenuItemProps[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    url: "/admin/tenants",
    icon: Building2,
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Planos",
    url: "/admin/plans",
    icon: Package,
  },
  {
    title: "Assinaturas",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Permissões",
    url: "/admin/permissions",
    icon: Shield,
  },
  {
    title: "Logs de Auditoria",
    url: "/admin/audit-logs",
    icon: FileText,
  },
];
