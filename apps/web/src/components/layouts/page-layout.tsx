"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type BreadcrumbItemType, Breadcrumbs } from "@/components/breadcrumbs";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "../ui/sidebar";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItemType[];
  children: React.ReactNode;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backHref?: Route;
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

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex shrink-0 flex-row items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger className="md:hidden" />
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
          <div className="min-w-0 flex-1">
            <h1 className="truncate whitespace-pre-line font-semibold text-base tracking-tight md:text-xl">
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
          <ModeToggle />
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30 px-4 py-2 md:px-6 md:py-3">
        <Breadcrumbs items={finalBreadcrumbs} />
      </div>

      {/* Content */}
      <div className="fade-in slide-in-from-bottom-4 flex animate-in flex-col space-y-6 p-4 duration-300 md:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
