"use client";

import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface DataEmptyProps {
  action?: React.ReactNode;
  className?: string;
  description?: string;
  icon?: LucideIcon;
  title?: string;
}

export function DataEmpty({
  title = "Nenhum item encontrado",
  description = "Não há itens para exibir no momento.",
  icon: Icon,
  action,
  className = "",
}: DataEmptyProps) {
  return (
    <Empty className={`border-none p-12 ${className}`}>
      {Icon && (
        <EmptyMedia className="mb-4" variant="icon">
          <Icon className="h-12 w-12 text-muted-foreground/50" />
        </EmptyMedia>
      )}
      <EmptyHeader>
        <EmptyTitle className="font-semibold text-lg">{title}</EmptyTitle>
        <EmptyDescription className="mt-2 text-muted-foreground">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent className="mt-6">{action}</EmptyContent>}
    </Empty>
  );
}
