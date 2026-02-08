import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";

type EntryProductItem =
  RouterOutputs["tenant"]["invoiceEntry"]["products"]["invoiceEntry"][number];

export function DetailEntryProducts({ entryID }: { entryID: number }) {
  const { tenant } = useTenant();

  const invoiceEntryProductsQuery = useQuery({
    ...trpc.tenant.invoiceEntry.products.queryOptions({ id: entryID }),
    enabled: !!tenant && entryID > 0,
  });

  return (
    <div className="space-y-3">
      <Card className="rounded-md py-1 md:py-2">
        <CardContent className="px-1 md:px-2">
          {invoiceEntryProductsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="group rounded-md p-2 transition-colors"
                  key={index}
                >
                  <div className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="ml-auto space-y-1">
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {invoiceEntryProductsQuery.data?.invoiceEntry.map(
                (entry: EntryProductItem) => (
                  <div
                    className="group rounded-md p-2 transition-colors hover:bg-muted/50"
                    key={entry.ID}
                  >
                    <div className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-xs leading-none md:text-sm">
                          {entry.NOME_PRODUTO}
                        </p>
                        <div className="flex gap-2 text-muted-foreground text-xs md:text-sm">
                          <div className="flex items-center">
                            {Number(entry.QUANTIDADE_COMERCIAL)}{" "}
                            {entry.UNIDADE_COMERCIAL}
                          </div>
                        </div>
                      </div>
                      <div className="ml-auto space-y-1">
                        <div className="flex flex-col items-center text-xs md:text-sm">
                          {formatAsCurrency(Number(entry.VALOR_TOTAL))}
                        </div>
                        <div className="flex flex-col items-center text-muted-foreground text-xs md:text-sm">
                          {formatAsCurrency(
                            Number(entry.VALOR_TOTAL) /
                              Number(entry.QUANTIDADE_COMERCIAL)
                          )}{" "}
                          {entry.UNIDADE_COMERCIAL}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
