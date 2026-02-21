import { Home } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type React from "react";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BreadcrumbItemType {
  href?: Route;
  isCurrent?: boolean;
  label: string;
}

interface BreadcrumbsProps {
  className?: string;
  items: BreadcrumbItemType[];
}

// Wrapper component to use Next.js Link with BreadcrumbLink
function BreadcrumbLinkWrapper({
  href,
  children,
}: {
  href: Route;
  children: React.ReactNode;
}) {
  return <BreadcrumbLink render={<Link href={href}>{children}</Link>} />;
}

// Componente para renderizar o label com ícone se for "Dashboard"
function BreadcrumbLabel({ label }: { label: string }) {
  if (label === "Dashboard") {
    return (
      <span className="flex items-center gap-1.5">
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </span>
    );
  }
  return <>{label}</>;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  // Se houver 3 ou menos itens, renderizar todos normalmente
  if (items.length <= 3) {
    return (
      <Breadcrumb className={className}>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isCurrent = item.isCurrent ?? isLast;
            const key = `${item.label}-${index}`;

            return (
              <Fragment key={key}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isCurrent || !item.href ? (
                    <BreadcrumbPage>
                      <BreadcrumbLabel label={item.label} />
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLinkWrapper href={item.href}>
                      <BreadcrumbLabel label={item.label} />
                    </BreadcrumbLinkWrapper>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Se houver mais de 3 itens, aplicar overflow
  // Estrutura: Primeiro > ... (dropdown) > Penúltimo > Último
  const firstItem = items[0];
  const intermediateItems = items.slice(1, items.length - 2);
  const secondToLastItem = items.at(-2);
  const lastItem = items.at(-1);

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Primeiro item */}
        <div className="flex items-center">
          <BreadcrumbItem>
            {firstItem.href ? (
              <BreadcrumbLinkWrapper href={firstItem.href}>
                <BreadcrumbLabel label={firstItem.label} />
              </BreadcrumbLinkWrapper>
            ) : (
              <BreadcrumbPage>
                <BreadcrumbLabel label={firstItem.label} />
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </div>

        {/* Separador */}
        <BreadcrumbSeparator />

        {/* Dropdown com itens intermediários */}
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5">
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {intermediateItems.map((item, index) => (
                <DropdownMenuItem key={`${item.label}-${index}`}>
                  {item.href ? (
                    <BreadcrumbLinkWrapper href={item.href}>
                      <BreadcrumbLabel label={item.label} />
                    </BreadcrumbLinkWrapper>
                  ) : (
                    <BreadcrumbPage>
                      <BreadcrumbLabel label={item.label} />
                    </BreadcrumbPage>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>

        {/* Separador */}
        <BreadcrumbSeparator />

        {/* Penúltimo item */}
        <div className="flex items-center">
          <BreadcrumbItem>
            {secondToLastItem?.href ? (
              <BreadcrumbLinkWrapper href={secondToLastItem.href}>
                <BreadcrumbLabel label={secondToLastItem?.label || ""} />
              </BreadcrumbLinkWrapper>
            ) : (
              <BreadcrumbPage>
                <BreadcrumbLabel label={secondToLastItem?.label || ""} />
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </div>

        {/* Separador */}
        <BreadcrumbSeparator />

        {/* Último item (página atual) */}
        <div className="flex items-center">
          <BreadcrumbItem>
            <BreadcrumbPage>
              <BreadcrumbLabel label={lastItem?.label || ""} />
            </BreadcrumbPage>
          </BreadcrumbItem>
        </div>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
