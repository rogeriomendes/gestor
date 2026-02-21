import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import type { PermissionAction, PermissionResource } from "@/lib/permissions";

export interface MenuItemProps {
  icon: LucideIcon;
  permission?: {
    resource: PermissionResource;
    action: PermissionAction;
  };
  sub?: SubMenuItemProps[];
  title: string;
  url: Route;
}

interface SubMenuItemProps {
  icon: LucideIcon;
  permission?: {
    resource: PermissionResource;
    action: PermissionAction;
  };
  title: string;
  url: Route;
}
