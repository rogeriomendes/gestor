"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { FbiIcon } from "@/assets/FbiIcon";
import { type BreadcrumbItemType, Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { getIconForPathname } from "@/lib/menu-icon";
import { ShowTextSwitcher } from "../show-text-switcher";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";

interface PageLayoutProps {
  actions?: React.ReactNode;
  backHref?: Route;
  breadcrumbs?: BreadcrumbItemType[];
  children: React.ReactNode;
  showBackButton?: boolean;
  subtitle?: string;
  title: string;
}

function generateBreadcrumbsFromPathname(
  pathname: string
): BreadcrumbItemType[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItemType[] = [];

  // Adicionar Home como primeiro item
  items.push({ label: "Home", href: "/" });

  // Construir breadcrumbs a partir dos segmentos
  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Capitalizar e formatar o label
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    items.push({
      label,
      href: isLast ? undefined : (currentPath as Route),
      isCurrent: isLast,
    });
  });

  return items;
}

export function PageLayout({
  title,
  subtitle,
  breadcrumbs,
  children,
  actions,
  showBackButton = false,
  backHref,
}: PageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Gerar breadcrumbs automaticamente se não fornecidos
  const finalBreadcrumbs =
    breadcrumbs ?? generateBreadcrumbsFromPathname(pathname);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const TitleIcon = getIconForPathname(pathname);

  return (
    <div className="flex flex-col print:bg-white">
      {/* Breadcrumbs */}
      <div className="flex shrink-0 flex-row items-center gap-2 rounded-t-xl border-b bg-sidebar/50 px-2 py-2 md:px-6 md:py-3 print:hidden">
        <SidebarTrigger className="cursor-pointer md:hidden" />
        <Separator className="mr-1 h-8 md:hidden" orientation="vertical" />
        <FbiIcon className="mr-2 size-6 shrink-0 md:hidden" />
        <Breadcrumbs items={finalBreadcrumbs} />
        {!pathname.startsWith("/admin") && (
          <div className="ml-auto md:hidden">
            <ShowTextSwitcher />
          </div>
        )}
      </div>

      {/* Header */}
      <header className="flex shrink-0 flex-row items-center justify-between gap-3 bg-background/95 px-2 py-2 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6 md:py-3 print:hidden">
        <div className="flex items-center gap-2 md:gap-4">
          {showBackButton && (
            <Button
              className="transition-all hover:bg-accent"
              onClick={handleBack}
              size="icon"
              variant="ghost"
            >
              <ArrowLeft className="size-4" />
              <span className="sr-only">Voltar</span>
            </Button>
          )}
          <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3">
            <h1 className="flex items-center gap-2 truncate whitespace-pre-line font-semibold text-lg tracking-tight md:text-2xl">
              {TitleIcon && (
                <TitleIcon aria-hidden className="size-5 shrink-0 md:size-6" />
              )}
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 truncate whitespace-pre-line text-muted-foreground text-xs md:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          {actions}
          {/* <ModeToggle /> */}
        </div>
      </header>

      {/* Content */}
      <div className="fade-in slide-in-from-bottom-4 flex animate-in flex-col space-y-2 p-2 pt-1 duration-300 md:space-y-4 md:p-6 md:pt-1">
        {children}
      </div>
    </div>
  );
}
