import {
  Activity,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Shield,
  Users,
} from "lucide-react";
import type { MenuItemProps } from "./types";

export type { MenuItemProps };

export const adminMenuItens: MenuItemProps[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    permission: { resource: "DASHBOARD", action: "READ" },
  },
  {
    title: "Clientes",
    url: "/admin/tenants",
    icon: Building2,
    permission: { resource: "TENANT", action: "READ" },
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: Users,
    permission: { resource: "USER", action: "READ" },
  },
  {
    title: "Planos",
    url: "/admin/plans",
    icon: Package,
    permission: { resource: "SETTINGS", action: "READ" },
  },
  {
    title: "Assinaturas",
    url: "/admin/subscriptions",
    icon: CreditCard,
    permission: { resource: "SETTINGS", action: "READ" },
  },
  {
    title: "Permissões",
    url: "/admin/permissions",
    icon: Shield,
    permission: { resource: "SETTINGS", action: "READ" },
  },
  {
    title: "Logs de Auditoria",
    url: "/admin/audit-logs",
    icon: FileText,
    permission: { resource: "AUDIT_LOG", action: "READ" },
  },
  {
    title: "Status",
    url: "/admin/status",
    icon: Activity,
    permission: { resource: "SETTINGS", action: "READ" },
  },
];
