"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";

type DfeItem =
  RouterOutputs["tenant"]["invoiceDfe"]["all"]["invoiceDfe"][number];

interface HideDfeDialogProps {
  dfe: DfeItem;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
}

export function HideDfeDialog({
  dfe,
  open,
  onOpenChange,
  onSuccess,
}: HideDfeDialogProps) {
  const hideDfeMutation = useMutation({
    mutationFn: (input: { chaveAcesso: string; cnpjEmpresa: string }) =>
      trpcClient.tenant.invoiceDfe.hide.mutate(input),
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const confirmHide = () => {
    hideDfeMutation.mutate({
      chaveAcesso: dfe.CHAVE_ACESSO,
      cnpjEmpresa: dfe.CNPJ_EMPRESA ?? "",
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ocultar Registro</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja ocultar este registro? Esta ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 rounded bg-card p-2 text-xs md:text-sm">
          <p>
            <strong>Fornecedor:</strong>{" "}
            <span className="uppercase">{dfe.RAZAO_SOCIAL}</span>
          </p>
          <p>
            <strong>NFe:</strong> {dfe.NUMERO}
          </p>
          <p>
            <strong>Valor:</strong> {formatAsCurrency(Number(dfe.VALOR))}
          </p>
        </div>
        <DialogFooter className="flex w-full flex-row justify-between gap-2">
          <Button
            className="w-full"
            disabled={hideDfeMutation.isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            className="w-full"
            disabled={hideDfeMutation.isPending}
            onClick={confirmHide}
            variant="destructive"
          >
            {hideDfeMutation.isPending ? "Ocultando..." : "Ocultar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
