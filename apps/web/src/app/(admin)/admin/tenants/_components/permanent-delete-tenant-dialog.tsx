"use client";

import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
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
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Excluir Permanentemente</CredenzaTitle>
          <CredenzaDescription>
            <strong className="text-destructive">
              ATENÇÃO: Esta ação é irreversível!
            </strong>
            <br />
            <br />
            Tem certeza que deseja excluir permanentemente {tenantName} (
            {tenantSlug})? Todos os dados relacionados serão perdidos e não
            poderão ser recuperados.
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
            {isPending ? "Excluindo..." : "Excluir Permanentemente"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
