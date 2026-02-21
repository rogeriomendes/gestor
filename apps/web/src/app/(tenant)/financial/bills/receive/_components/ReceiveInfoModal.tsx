"use client";

import { ClockIcon, DotIcon, InfoIcon, UserIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";

type ReceiveItem =
  RouterOutputs["tenant"]["financialBillsReceive"]["all"]["receive"][number];

interface ReceiveInfoModalProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  receive: ReceiveItem | null;
}

export function ReceiveInfoModal({
  receive,
  open,
  onOpenChange,
}: ReceiveInfoModalProps) {
  const isMobile = useIsMobile();
  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            <div className="flex items-center gap-2">
              <InfoIcon className="size-5" />
              Adicionado Manualmente
            </div>
          </CredenzaTitle>
          <CredenzaDescription>
            <span className="flex flex-row">
              <Popover>
                <PopoverTrigger>
                  <span className="flex items-center">
                    <UserIcon className="mr-2 size-4" />
                    {receive?.fin_lancamento_receber?.ID_CLIENTE
                      ? receive.fin_lancamento_receber?.cliente?.pessoa?.NOME
                      : "Cliente não informado"}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 text-xs">
                  Cliente
                </PopoverContent>
              </Popover>
              <DotIcon />
              <Popover>
                <PopoverTrigger>
                  <span className="flex items-center">
                    <ClockIcon className="mr-2 size-4" />
                    {receive?.fin_lancamento_receber?.DATA_LANCAMENTO &&
                      formatDate(
                        receive?.fin_lancamento_receber?.DATA_LANCAMENTO
                      )}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 text-xs">
                  Data de lançamento
                </PopoverContent>
              </Popover>
            </span>
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {receive && (
            <Card className="rounded-md py-1 md:py-2" size="sm">
              <CardContent className="space-y-1.5 px-1 md:px-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-muted-foreground text-sm">
                      Valor a Receber
                    </label>
                    <p className="font-semibold text-sm">
                      {formatAsCurrency(
                        Number(receive.fin_lancamento_receber.VALOR_A_RECEBER)
                      )}
                    </p>
                  </div>
                </div>

                {receive.fin_lancamento_receber.HISTORICO && (
                  <div>
                    <label className="font-medium text-muted-foreground text-sm">
                      Observação
                    </label>
                    <p className="text-sm">
                      {receive.fin_lancamento_receber.HISTORICO}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Alert className="mt-4" variant="default">
            <AlertDescription>
              Este recebimento foi adicionado manualmente no sistema e não
              possui uma venda associada.
            </AlertDescription>
          </Alert>
        </CredenzaBody>

        {isMobile && (
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant="outline">
                <XIcon className="mr-2 size-5" />
                Fechar
              </Button>
            </CredenzaClose>
          </CredenzaFooter>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
