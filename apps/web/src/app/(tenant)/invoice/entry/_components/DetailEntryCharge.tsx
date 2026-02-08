import { useQuery } from "@tanstack/react-query";
import { FileCheckIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTenant } from "@/contexts/tenant-context";
import { formatDate } from "@/lib/format-date";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";

type entryData =
  RouterOutputs["tenant"]["invoiceEntry"]["byId"]["invoiceEntry"];

type chargeItem =
  RouterOutputs["tenant"]["invoiceEntry"]["charge"]["invoiceEntry"][number];

export function DetailEntryCharge({
  entryData,
  billsPayID,
}: {
  entryData: entryData;
  billsPayID?: number;
}) {
  const { tenant } = useTenant();
  const entryId = entryData?.ID ?? 0;

  const invoiceEntryChargeQuery = useQuery({
    ...trpc.tenant.invoiceEntry.charge.queryOptions({ id: entryId }),
    enabled: !!tenant && entryId > 0,
  });

  return (
    <div className="space-y-3">
      <Card className="rounded-md py-1 md:py-2">
        <CardContent className="px-0 md:px-0">
          <div className="mx-2 mb-2 grid grid-cols-2 gap-1 text-xs md:gap-2 md:text-sm">
            <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
              <div className="mr-2">Total produtos:</div>
              <div>
                {formatAsCurrency(Number(entryData?.VALOR_TOTAL_PRODUTOS))}
              </div>
            </div>
            <div className="relative flex flex-row rounded bg-muted/50 p-1.5">
              <div className="mr-2">Desconto:</div>
              <div>{formatAsCurrency(Number(entryData?.VALOR_DESCONTO))}</div>
            </div>
            <div className="relative col-span-2 flex flex-row rounded bg-muted/50 p-1.5">
              <div className="mr-3"> Total da nota:</div>
              <div>{formatAsCurrency(Number(entryData?.VALOR_TOTAL))}</div>
            </div>
          </div>
          {invoiceEntryChargeQuery.isLoading ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Parc.</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Quitado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-3 text-center">
                      <Skeleton className="mx-auto h-4 w-6" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : invoiceEntryChargeQuery.data?.invoiceEntry.length === 0 ? (
            <div className="mx-6 my-8 flex items-center justify-center text-muted-foreground text-sm">
              <FileCheckIcon className="mr-5 size-10 md:size-14" />
              Não existe Cobranças para esta entrada de nota.
            </div>
          ) : (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Parc.</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Quitado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {invoiceEntryChargeQuery.data?.invoiceEntry.map(
                  (charge: chargeItem) => (
                    <TableRow
                      data-state={billsPayID === charge.ID && "selected"}
                      key={charge.ID}
                    >
                      <TableCell className="py-3 text-center">
                        {charge.NUMERO_PARCELA}
                      </TableCell>
                      <TableCell className="py-3">
                        {formatAsCurrency(Number(charge.VALOR))}
                      </TableCell>
                      <TableCell>
                        {charge.DATA_VENCIMENTO &&
                          formatDate(charge.DATA_VENCIMENTO)}
                      </TableCell>
                      <TableCell>
                        {charge.fin_parcela_pagamento[0]?.DATA_PAGAMENTO &&
                          formatDate(
                            charge.fin_parcela_pagamento[0]?.DATA_PAGAMENTO
                          )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
