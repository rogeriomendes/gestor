import { Card, CardContent } from "@/components/ui/card";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";

type entryData =
  RouterOutputs["tenant"]["invoiceEntry"]["byId"]["invoiceEntry"];

export function DetailEntryTotals({ entryData }: { entryData: entryData }) {
  return (
    <div className="space-y-3">
      <Card
        className="rounded-md data-[size=sm]:py-1 data-[size=sm]:md:py-2"
        size="sm"
      >
        <CardContent className="grid grid-cols-2 gap-1 text-xs group-data-[size=sm]/card:px-1 md:gap-2 md:text-sm group-data-[size=sm]/card:md:px-2">
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">ICMS:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_ICMS))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">ICMS ST:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_ICMS_ST))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">FCP:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_FCP))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">FCP ST:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_FCP_ST))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">IPI:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_IPI))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">DESCONTO:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_DESCONTO))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">FRETE:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_FRETE))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">SEGURO:</div>
            <div>{formatAsCurrency(Number(entryData?.VALOR_SEGURO))}</div>
          </div>
          <div className="relative col-span-2 flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2">DESPESAS ACESSÓRIAS:</div>
            <div>
              {formatAsCurrency(Number(entryData?.VALOR_DESPESAS_ACESSORIAS))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
