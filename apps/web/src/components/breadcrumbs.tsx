import Link from "next/link";
import type React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemType {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
  className?: string;
}

// Wrapper component to use Next.js Link with BreadcrumbLink
function BreadcrumbLinkWrapper({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <BreadcrumbLink
      // @ts-expect-error - Next.js Link href type is compatible with string
      render={<Link href={href}>{children}</Link>}
    />
  );
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.isCurrent ?? isLast;
          const key = `${item.label}-${index}`;

          return (
            <div className="flex items-center" key={key}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isCurrent || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLinkWrapper href={item.href}>
                    {item.label}
                  </BreadcrumbLinkWrapper>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
