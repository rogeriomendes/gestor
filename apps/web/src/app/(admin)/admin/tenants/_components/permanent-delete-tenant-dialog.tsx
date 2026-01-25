"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface PermanentDeleteTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string | undefined;
  tenantSlug: string | undefined;
  isPending: boolean;
  onConfirm: () => void;
}

export function PermanentDeleteTenantDialog({
  open,
  onOpenChange,
  tenantName,
  tenantSlug,
  isPending,
  onConfirm,
}: PermanentDeleteTenantDialogProps) {
  return (
    <ConfirmDialog
      cancelText="Cancelar"
      confirmText="Excluir Permanentemente"
      description={
        <>
          <strong className="text-destructive">
            ATENÇÃO: Esta ação é irreversível!
          </strong>
          <br />
          <br />
          Tem certeza que deseja excluir permanentemente {tenantName} (
          {tenantSlug})? Todos os dados relacionados serão perdidos e não
          poderão ser recuperados.
        </>
      }
      isLoading={isPending}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title="Excluir Permanentemente"
      variant="destructive"
    />
  );
}
