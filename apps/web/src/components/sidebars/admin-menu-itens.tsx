import {
  Building2,
  FileText,
  LayoutDashboard,
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
    title: "Tenants",
    url: "/admin/tenants",
    icon: Building2,
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Permissões",
    url: "/admin/permissions",
    icon: Shield,
  },
  {
    title: "Audit Logs",
    url: "/admin/audit-logs",
    icon: FileText,
  },
];
