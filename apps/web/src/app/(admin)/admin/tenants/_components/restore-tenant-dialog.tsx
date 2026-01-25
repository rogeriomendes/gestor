"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface RestoreTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string | undefined;
  tenantSlug: string | undefined;
  isPending: boolean;
  onConfirm: () => void;
}

export function RestoreTenantDialog({
  open,
  onOpenChange,
  tenantName,
  tenantSlug,
  isPending,
  onConfirm,
}: RestoreTenantDialogProps) {
  return (
    <ConfirmDialog
      cancelText="Cancelar"
      confirmText="Restaurar"
      description={`Tem certeza que deseja restaurar ${tenantName} (${tenantSlug})? O cliente será reativado e voltará a aparecer na lista de clientes ativos.`}
      isLoading={isPending}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title="Restaurar Cliente"
    />
  );
}
