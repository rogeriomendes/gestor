"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deletar Cliente</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja deletar{" "}
            <strong>
              {tenantName} ({tenantSlug})
            </strong>
            ? O cliente será movido para a lixeira e poderá ser restaurado
            posteriormente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            variant="destructive"
          >
            {isPending ? "Deletando..." : "Deletar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
