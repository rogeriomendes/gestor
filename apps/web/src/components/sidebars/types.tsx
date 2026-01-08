import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import type { PermissionAction, PermissionResource } from "@/lib/permissions";

export interface MenuItemProps {
  title: string;
  url: Route;
  icon: LucideIcon;
  sub?: SubMenuItemProps[];
  permission?: {
    resource: PermissionResource;
    action: PermissionAction;
  };
}

interface SubMenuItemProps {
  title: string;
  url: Route;
  icon: LucideIcon;
  permission?: {
    resource: PermissionResource;
    action: PermissionAction;
  };
}
