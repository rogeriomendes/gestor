import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ShowText } from "@/components/show-text";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatAsCurrency } from "@/lib/utils";

interface MetricCardProps {
  badge?: ReactNode;
  className?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  isLoading?: boolean;
  onClick?: () => void;
  subtitle?: string | ReactNode;
  title: string | ReactNode;
  useShowText?: boolean;
  value: number | string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading = false,
  onClick,
  className = "",
  iconClassName = "",
  badge,
  useShowText = true,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "h-full cursor-pointer rounded-md transition-all data-[size=sm]:gap-2 data-[size=sm]:py-2 data-[size=sm]:md:gap-4 data-[size=sm]:md:py-4",
        onClick && "hover:cursor-pointer",
        className
      )}
      onClick={onClick}
      size="sm"
    >
      <CardHeader className="flex flex-row items-center justify-between group-data-[size=sm]/card:px-2 group-data-[size=sm]/card:md:px-4 group-data-[size=sm]/card:[.border-b]:pb-2">
        <CardTitle className="truncate font-medium text-xs md:text-sm">
          {title}
        </CardTitle>
        <CardAction className="flex items-center gap-1.5 md:gap-2">
          {isLoading ? (
            <Skeleton className="h-5 w-7 animate-pulse" />
          ) : badge ? (
            badge
          ) : Icon ? (
            <Icon
              className={cn("h-5 w-5 text-muted-foreground", iconClassName)}
            />
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="group-data-[size=sm]/card:px-2 group-data-[size=sm]/card:md:px-4">
        <div className="font-bold text-xl md:text-2xl">
          {isLoading ? (
            <Skeleton className="h-7 w-full" />
          ) : useShowText ? (
            <ShowText>
              {typeof value === "number" ? formatAsCurrency(value) : value}
            </ShowText>
          ) : typeof value === "number" ? (
            formatAsCurrency(value)
          ) : (
            value
          )}
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
