"use client";

import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";

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
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Deletar Filial</CredenzaTitle>
          <CredenzaDescription>
            Tem certeza que deseja deletar a filial "{branchName}"? Esta ação
            não pode ser desfeita.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaFooter>
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
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
