"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

interface DataCardsProps<T extends { id: string }> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  getHref?: (item: T) => Route | string;
  emptyMessage?: string;
  className?: string;
  onCardClick?: (item: T) => void;
}

export function DataCards<T extends { id: string }>({
  data,
  renderCard,
  getHref,
  emptyMessage = "Nenhum item encontrado.",
  className = "",
  onCardClick,
}: DataCardsProps<T>) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {data.map((item) => {
        const href = getHref?.(item);
        return (
          <Card
            className={`group transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${href || onCardClick ? "cursor-pointer" : ""}`}
            key={item.id}
            onClick={() => {
              if (href) {
                router.push(href as Route);
              }
              onCardClick?.(item);
            }}
            size="sm"
          >
            <CardContent>{renderCard(item)}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
