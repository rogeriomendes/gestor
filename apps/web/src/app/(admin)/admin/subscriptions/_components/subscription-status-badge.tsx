"use client";

import { AlertTriangle, Ban, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
}

export function SubscriptionStatusBadge({
  status,
}: SubscriptionStatusBadgeProps) {
  switch (status) {
    case "TRIAL":
      return (
        <Badge
          className="text-blue-700 ring-1 ring-blue-600/20 ring-inset"
          variant="outline"
        >
          <Clock className="mr-1 h-3 w-3" /> Trial
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge
          className="text-green-700 ring-1 ring-green-600/20 ring-inset"
          variant="outline"
        >
          <Check className="mr-1 h-3 w-3" /> Ativo
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge
          className="text-yellow-700 ring-1 ring-yellow-600/20 ring-inset"
          variant="outline"
        >
          <AlertTriangle className="mr-1 h-3 w-3" /> Expirado
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          className="text-red-700 ring-1 ring-red-600/20 ring-inset"
          variant="outline"
        >
          <Ban className="mr-1 h-3 w-3" /> Cancelado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
