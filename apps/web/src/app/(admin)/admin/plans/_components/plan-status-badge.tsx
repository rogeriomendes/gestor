"use client";

import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlanStatusBadgeProps {
  active: boolean;
}

export function PlanStatusBadge({ active }: PlanStatusBadgeProps) {
  if (active) {
    return (
      <Badge
        className="text-green-700 ring-1 ring-green-600/20 ring-inset"
        variant="outline"
      >
        <Check className="mr-1 h-3 w-3" /> Ativo
      </Badge>
    );
  }

  return (
    <Badge
      className="text-red-700 ring-1 ring-red-600/20 ring-inset"
      variant="outline"
    >
      <X className="mr-1 h-3 w-3" /> Inativo
    </Badge>
  );
}
