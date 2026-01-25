"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeleteBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function DeleteBranchDialog({
  open,
  onOpenChange,
  branchName,
  isPending,
  onConfirm,
}: DeleteBranchDialogProps) {
  return (
    <ConfirmDialog
      cancelText="Cancelar"
      confirmText="Deletar"
      description={`Tem certeza que deseja deletar a filial "${branchName}"? Esta ação não pode ser desfeita.`}
      isLoading={isPending}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title="Deletar Filial"
      variant="destructive"
    />
  );
}
