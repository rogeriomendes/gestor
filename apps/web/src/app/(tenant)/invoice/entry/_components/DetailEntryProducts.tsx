import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { formatAsCurrency, removeLeadingZero } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, LinkIcon } from "lucide-react";
import { useState } from "react";

type EntryProductItem =
  RouterOutputs["tenant"]["invoiceEntry"]["products"]["invoiceEntry"][number];

function ProductEntryDetail({
  accessKey,
  isOpen,
  numeroItem,
}: {
  accessKey?: string | null;
  isOpen: boolean;
  numeroItem?: number | null;
}) {
  const { tenant } = useTenant();

  const productDetailQuery = useQuery({
    ...trpc.tenant.invoiceEntry.productDetailByAccessKey.queryOptions({
      chaveAcesso: accessKey || "",
      numeroItem: numeroItem || null,
    }),
    enabled: !!tenant && !!accessKey && accessKey.length === 44 && isOpen,
  });

  if (!isOpen) {
    return null;
  }

  if (productDetailQuery.isLoading) {
    return (
      <div className="mt-2 rounded-md border bg-muted/20 p-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-1 h-3 w-1/2" />
      </div>
    );
  }

  const detail = productDetailQuery.data?.invoiceEntryDetail;
  if (!detail) {
    return (
      <div className="mt-2 rounded-md border bg-muted/20 p-2 text-muted-foreground text-xs">
        Nenhum detalhe encontrado do XML de entrada para este item.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-md border bg-muted/20 p-2 text-xs md:text-sm">
      <div className="mb-2">
        <span className="text-muted-foreground">Produto:</span>{" "}
        <span className="font-medium">{detail.XML_NOME_PRODUTO || "—"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">Código:</span>{" "}
          <span>
            {removeLeadingZero(detail.XML_CODIGO_PRODUTO || "") || "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">GTIN:</span>{" "}
          <span>{detail.XML_GTIN || "—"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">NCM/CEST:</span>{" "}
          <span>
            {detail.XML_NCM || "—"} / {detail.XML_CEST || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DetailEntryProducts({
  entryID,
  accessKey,
}: {
  entryID: number;
  accessKey?: string | null;
}) {
  const { tenant } = useTenant();
  const [openedProductId, setOpenedProductId] = useState<number | null>(null);

  const invoiceEntryProductsQuery = useQuery({
    ...trpc.tenant.invoiceEntry.products.queryOptions({ id: entryID }),
    enabled: !!tenant && entryID > 0,
  });

  return (
    <div className="space-y-3">
      <Card
        className="rounded-md data-[size=sm]:py-1 data-[size=sm]:md:py-2"
        size="sm"
      >
        <CardContent className="group-data-[size=sm]/card:px-1 group-data-[size=sm]/card:md:px-2">
          <div className="mb-2.5 flex items-center gap-1 text-muted-foreground text-xs">
            <LinkIcon className="size-3" />
            Clique em um produto para ver dados do XML de entrada
          </div>

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
            invoiceEntryProductsQuery.data?.invoiceEntry.map(
              (entry: EntryProductItem) => (
                <div
                  className="group rounded-md p-2 transition-colors hover:bg-muted/50"
                  key={entry.ID}
                >
                  <button
                    className="w-full cursor-pointer text-left"
                    onClick={() =>
                      setOpenedProductId((current) =>
                        current === entry.ID ? null : entry.ID
                      )
                    }
                    type="button"
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
                      <div className="ml-auto flex items-center gap-3">
                        <div className="space-y-1">
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
                        {openedProductId === entry.ID ? (
                          <ChevronUpIcon className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDownIcon className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  <ProductEntryDetail
                    accessKey={accessKey}
                    isOpen={openedProductId === entry.ID}
                    numeroItem={entry.NUMERO_ITEM}
                  />
                </div>
              )
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
