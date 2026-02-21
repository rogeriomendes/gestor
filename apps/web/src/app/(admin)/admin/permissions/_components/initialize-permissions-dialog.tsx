"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";

interface InitializePermissionsDialogProps {
  isPending: boolean;
  onInitialize: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function InitializePermissionsDialog({
  open,
  onOpenChange,
  isPending,
  onInitialize,
}: InitializePermissionsDialogProps) {
  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Inicializar Permissões</CredenzaTitle>
          <CredenzaDescription>
            Isso irá criar todas as permissões padrão do sistema e atribuí-las
            às roles. As permissões existentes serão atualizadas.
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
          <Button disabled={isPending} onClick={onInitialize}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inicializando...
              </>
            ) : (
              "Inicializar"
            )}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
