import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

export interface MenuItemProps {
  title: string;
  url: Route;
  icon: LucideIcon;
  sub?: SubMenuItemProps[];
}

interface SubMenuItemProps {
  title: string;
  url: Route;
  icon: LucideIcon;
}
