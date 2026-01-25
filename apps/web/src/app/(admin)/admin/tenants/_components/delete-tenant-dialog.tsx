"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeleteTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string | undefined;
  tenantSlug: string | undefined;
  isPending: boolean;
  onConfirm: () => void;
}

export function DeleteTenantDialog({
  open,
  onOpenChange,
  tenantName,
  tenantSlug,
  isPending,
  onConfirm,
}: DeleteTenantDialogProps) {
  return (
    <ConfirmDialog
      cancelText="Cancelar"
      confirmText="Deletar"
      description={
        <>
          Tem certeza que deseja deletar{" "}
          <strong>
            {tenantName} ({tenantSlug})
          </strong>
          ? O cliente será movido para a lixeira e poderá ser restaurado
          posteriormente.
        </>
      }
      isLoading={isPending}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title="Deletar Cliente"
      variant="destructive"
    />
  );
}
