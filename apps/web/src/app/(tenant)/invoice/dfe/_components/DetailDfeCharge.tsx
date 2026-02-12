import { FileCheckIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";
import { formatAsCurrency } from "@/lib/utils";
import type { Duplicata, NFeInfo } from "./DetailDfe";

export function DetailDfeCharge({ xml }: { xml: NFeInfo }) {
  const duplicatas: Duplicata[] = (() => {
    if (!xml.cobr?.dup) {
      return [];
    }
    return Array.isArray(xml.cobr.dup) ? xml.cobr.dup : [xml.cobr.dup];
  })();

  return (
    <div className="space-y-3">
      <Card className="rounded-md py-1 md:py-2">
        <CardContent className="px-0 md:px-0">
          {xml.cobr ? (
            <>
              <div className="mx-2 mb-2 grid grid-cols-2 gap-1 text-xs md:gap-2 md:text-sm">
                <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
                  <div className="mr-2">Total produtos:</div>
                  <div>
                    {formatAsCurrency(Number(xml.cobr?.fat?.vOrig || 0))}
                  </div>
                </div>
                <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
                  <div className="mr-2">Desconto:</div>
                  <div>
                    {formatAsCurrency(Number(xml.cobr?.fat?.vDesc || 0))}
                  </div>
                </div>
                <div className="relative col-span-2 flex flex-row rounded bg-muted/50 p-1.5">
                  <div className="mr-3"> Total da nota:</div>
                  <div>
                    {formatAsCurrency(Number(xml.cobr?.fat?.vLiq || 0))}
                  </div>
                </div>
              </div>
              {duplicatas.length > 0 ? (
                <Table className="bg-card">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Parc.</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs md:text-sm">
                    {duplicatas.map((dup, index) => (
                      <TableRow key={index}>
                        <TableCell className="py-3 text-center">
                          {dup.nDup}
                        </TableCell>
                        <TableCell className="py-3">
                          {formatAsCurrency(Number(dup.vDup))}
                        </TableCell>
                        <TableCell>{formatDate(new Date(dup.dVenc))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="mx-6 my-8 flex items-center justify-center text-muted-foreground text-sm">
                  <FileCheckIcon className="mr-5 size-10 md:size-14" />
                  Não existem parcelas para esta DFe.
                </div>
              )}
            </>
          ) : (
            <div className="mx-6 my-8 flex items-center justify-center text-muted-foreground text-sm">
              <FileCheckIcon className="mr-5 size-10 md:size-14" />
              Não existe cobranças para esta DFe.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
