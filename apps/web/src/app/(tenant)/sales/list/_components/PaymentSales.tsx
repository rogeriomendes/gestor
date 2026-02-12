import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { formatAsCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import type { Decimal } from "../../../../../../../../packages/db/prisma/generated/internal/prismaNamespace";

// type paymentData = RouterOutputs["sales"]["byId"]["sales"]["venda_recebimento"];
interface paymentData {
  ID_FIN_TIPO_RECEBIMENTO: number;
  VALOR_RECEBIDO: Decimal | null;
  VALOR_DINHEIRO: Decimal | null;
  VALOR_TROCO: Decimal | null;
}

export function PaymentSales({ paymentData }: { paymentData: paymentData }) {
  const { tenant } = useTenant();
  const id = paymentData.ID_FIN_TIPO_RECEBIMENTO;

  const { data: receiptTypeData, isPending: receiptTypeIsPending } = useQuery({
    ...trpc.tenant.receiptType.byId.queryOptions({ id }),
    enabled: !!tenant && id != null,
  });

  if (receiptTypeIsPending) {
    return (
      <div className="space-y-2">
        {/* Skeleton para tipo de recebimento simples */}
        <div className="mx-5 flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Skeleton para dinheiro (pode aparecer ou não) */}
        {Math.random() > 0.5 && (
          <>
            <div className="mx-5 flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="mx-5 flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </>
        )}
      </div>
    );
  }
  if (
    receiptTypeData?.receiptType?.TIPO === "DN" &&
    Number(paymentData?.VALOR_DINHEIRO) !== 0
  ) {
    return (
      <div className="font-bold text-sm md:text-base">
        <div className="mx-5 flex justify-between">
          <div>{receiptTypeData?.receiptType.DESCRICAO}</div>
          <div>{formatAsCurrency(Number(paymentData?.VALOR_RECEBIDO))}</div>
        </div>
        <div className="mx-5 flex justify-between">
          <div>VALOR RECEBIDO</div>
          <div>{formatAsCurrency(Number(paymentData?.VALOR_DINHEIRO))}</div>
        </div>
        <div className="mx-5 flex justify-between">
          <div>TROCO</div>
          <div>{formatAsCurrency(Number(paymentData?.VALOR_TROCO))}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-5 flex justify-between font-bold text-sm md:text-base">
      <div>{receiptTypeData?.receiptType?.DESCRICAO}</div>
      <div>{formatAsCurrency(Number(paymentData?.VALOR_RECEBIDO))}</div>
    </div>
  );
}
