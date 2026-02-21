import { Card, CardContent } from "@/components/ui/card";
import { formatAsCurrency } from "@/lib/utils";
import type { ICMSTot } from "./DetailDfe";

export function DetailDfeTotals({ xml }: { xml: ICMSTot }) {
  return (
    <div className="space-y-3">
      <Card className="rounded-md py-1 md:py-2" size="sm">
        <CardContent className="grid grid-cols-2 gap-1 px-1 text-xs md:gap-2 md:px-2 md:text-sm">
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">ICMS:</div>
            <div>{formatAsCurrency(Number(xml.vICMS))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">ICMS ST:</div>
            <div>{formatAsCurrency(Number(xml.vST))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">FCP:</div>
            <div>{formatAsCurrency(Number(xml.vFCP))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">FCP ST:</div>
            <div>{formatAsCurrency(Number(xml.vFCPST))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">IPI:</div>
            <div>{formatAsCurrency(Number(xml.vIPI))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">DESCONTO:</div>
            <div>{formatAsCurrency(Number(xml.vDesc))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">FRETE:</div>
            <div>{formatAsCurrency(Number(xml.vFrete))}</div>
          </div>
          <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2 w-24">SEGURO:</div>
            <div>{formatAsCurrency(Number(xml.vSeg))}</div>
          </div>
          <div className="relative col-span-2 flex flex-row rounded bg-muted/50 p-1.5">
            <div className="mr-2">DESPESAS ACESSÓRIAS:</div>
            <div>{formatAsCurrency(Number(xml.vOutro))}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
