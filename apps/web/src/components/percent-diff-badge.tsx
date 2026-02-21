"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { InfoPopover } from "@/components/info-popover";
import { Badge } from "@/components/ui/badge";
import { useTextContext } from "@/contexts/text-show-context";

interface PercentDiffBadgeProps {
  currentValue: number;
  description?: string;
  label?: string;
  previousValue: number;
}

/**
 * Calcula a diferença percentual entre dois valores
 */
function calculatePercentDiff(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Retorna a cor baseada na diferença percentual
 */
function getPercentColor(percentDiff: number): string {
  if (percentDiff > 0) {
    return "bg-green-500/15 text-green-600 dark:text-green-400";
  }
  if (percentDiff < 0) {
    return "bg-red-500/15 text-red-600 dark:text-red-400";
  }
  return "bg-muted text-foreground";
}

/**
 * Retorna o label formatado com ícones
 */
function getPercentLabel(percentDiff: number): React.ReactNode {
  return (
    <span className="flex items-center gap-1">
      {percentDiff > 0 ? (
        <>
          <TrendingUp className="size-3" />
          <span>+{percentDiff.toFixed(1)}%</span>
        </>
      ) : percentDiff < 0 ? (
        <>
          <TrendingDown className="size-3" />
          <span>{percentDiff.toFixed(1)}%</span>
        </>
      ) : (
        <span>{percentDiff.toFixed(1)}%</span>
      )}
    </span>
  );
}

export function PercentDiffBadge({
  currentValue,
  previousValue,
  label,
  description,
}: PercentDiffBadgeProps) {
  const percentDiff = calculatePercentDiff(currentValue, previousValue);
  const color = getPercentColor(percentDiff);
  const badgeLabel = getPercentLabel(percentDiff);
  const displayLabel = label || description;
  const displayDescription = description || label;

  const { isShowing } = useTextContext();

  if (isShowing) {
    return (
      <div className="py-1">
        <div className="h-4 w-11 rounded-md bg-muted" />
      </div>
    );
  }

  if (!(displayLabel || displayDescription)) {
    return (
      <Badge
        className={`px-1.5 py-0.5 text-[10px] ${color}`}
        variant="secondary"
      >
        {badgeLabel}
      </Badge>
    );
  }

  return (
    <InfoPopover content={displayDescription || ""} label={displayLabel || ""}>
      <Badge
        className={`px-1.5 py-0.5 text-[10px] ${color}`}
        title={displayDescription || displayLabel || ""}
        variant="secondary"
      >
        {badgeLabel}
      </Badge>
    </InfoPopover>
  );
}

/**
 * Hook utilitário para calcular diferença percentual
 */
export function usePercentDiff(currentValue: number, previousValue: number) {
  const percentDiff = calculatePercentDiff(currentValue, previousValue);
  const color = getPercentColor(percentDiff);
  const label = getPercentLabel(percentDiff);

  return {
    percentDiff,
    color,
    label,
  };
}
