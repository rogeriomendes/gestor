"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type BreadcrumbItemType, Breadcrumbs } from "@/components/breadcrumbs";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4">
          {showBackButton && (
            <Button
              className="-ml-2"
              onClick={handleBack}
              size="icon"
              variant="ghost"
            >
              <ArrowLeft className="size-4" />
              <span className="sr-only">Voltar</span>
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-lg sm:text-xl md:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-muted-foreground text-xs sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          {actions}
          <ModeToggle />
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="border-b px-4 py-2 sm:px-6 sm:py-3">
        <Breadcrumbs items={finalBreadcrumbs} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col space-y-6 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}
