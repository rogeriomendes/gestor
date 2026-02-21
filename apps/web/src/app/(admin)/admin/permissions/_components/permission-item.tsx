"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { getPermissionActionLabel } from "@/lib/permission-labels";

interface PermissionItemProps {
  action: string;
  isGranted: boolean;
  isPending: boolean;
  name: string;
  onToggle: (permissionId: string, currentlyGranted: boolean) => void;
  permissionId: string;
}

export function PermissionItem({
  permissionId,
  action,
  name,
  isGranted,
  isPending,
  onToggle,
}: PermissionItemProps) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex-1">
        <div className="font-medium">{getPermissionActionLabel(action)}</div>
        <div className="text-muted-foreground text-xs">{name}</div>
      </div>
      <button
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
          isGranted
            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
            : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
        }`}
        disabled={isPending}
        onClick={() => onToggle(permissionId, isGranted)}
        type="button"
      >
        {isGranted ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Permitido
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4" />
            Negado
          </>
        )}
      </button>
    </div>
  );
}
