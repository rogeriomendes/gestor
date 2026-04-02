import { DetailProducts } from "@/app/(tenant)/products/list/_components/DetailProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { formatAsCurrency, removeLeadingZero } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, PackageIcon } from "lucide-react";
import { useState } from "react";

type EntryProductItem =
  RouterOutputs["tenant"]["invoiceEntry"]["products"]["invoiceEntry"][number];

function fmtQuantidadeEntrada(value: unknown): string {
  if (value == null) {
    return "—";
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return "—";
  }
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
}

function fmtMoneyXml(value: unknown): string {
  if (value == null) {
    return "—";
  }
  return formatAsCurrency(Number(value));
}

/** Bruto + frete + seguro + outras despesas + outros valores − desconto (campos XML da entrada). */
function fmtTotalLinhaXml(detail: {
  XML_VLR_BRUTO_PROD: unknown;
  XML_VLR_DESCONTO: unknown;
  XML_VLR_FRETE: unknown;
  XML_VLR_OUTRAS_DESPESAS: unknown;
  XML_VLR_SEGURO: unknown;
  XML_OUTROS_VALORES: unknown;
}): string {
  if (detail.XML_VLR_BRUTO_PROD == null) {
    return "—";
  }
  const total =
    Number(detail.XML_VLR_BRUTO_PROD) +
    Number(detail.XML_VLR_FRETE ?? 0) +
    Number(detail.XML_VLR_SEGURO ?? 0) +
    Number(detail.XML_VLR_OUTRAS_DESPESAS ?? 0) +
    Number(detail.XML_OUTROS_VALORES ?? 0) -
    Number(detail.XML_VLR_DESCONTO ?? 0);
  return formatAsCurrency(total);
}

function ProductEntryDetail({
  accessKey,
  isOpen,
  nfeDetalheId,
  numeroItem,
}: {
  accessKey?: string | null;
  isOpen: boolean;
  nfeDetalheId: number;
  numeroItem?: number | null;
}) {
  const { tenant } = useTenant();

  const productDetailQuery = useQuery({
    ...trpc.tenant.invoiceEntry.productDetailByAccessKey.queryOptions({
      chaveAcesso: accessKey || "",
      nfeDetalheId,
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
  const informacoesAdicionais =
    productDetailQuery.data?.informacoesAdicionais?.trim() || null;

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
        <span className="text-muted-foreground">Nome:</span>{" "}
        <span className="font-medium">{detail.XML_NOME_PRODUTO || "—"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">Código Forn:</span>{" "}
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
        {/* <div>
          <span className="text-muted-foreground">Quantidade (entrada):</span>{" "}
          <span>{fmtQuantidadeEntrada(detail.XML_QUANT_COM)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Unidade:</span>{" "}
          <span>{detail.XML_UNID_COM || "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Valor unitário:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_UNIT_COM)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Valor bruto:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_BRUTO_PROD)}</span>
        </div> */}
        <div>
          <span className="text-muted-foreground">Frete:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_FRETE)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Seguro:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_SEGURO)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Desconto:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_DESCONTO)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Outras despesas:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_OUTRAS_DESPESAS)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">ICMS:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_ICMS)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">ICMS ST:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_ST)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">IPI:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_IPI)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">FCP ST:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_FCP_ST)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Outros impostos:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_VLR_OUTROS_IMPOSTOS)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Outros valores:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_OUTROS_VALORES)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Custo final:</span>{" "}
          <span>{fmtMoneyXml(detail.XML_CUSTO_FINAL)}</span>
        </div>
        {/* <div>
          <span className="text-muted-foreground">Total:</span>{" "}
          <span className="font-medium">{fmtTotalLinhaXml(detail)}</span>
          <span className="mt-0.5 block text-[0.65rem] text-muted-foreground leading-snug">
            bruto + frete + seguro + outras despesas + outros valores − desconto
          </span>
        </div> */}
        {informacoesAdicionais && (
          <div className="col-span-2 border-t pt-2">
            <span className="text-muted-foreground">
              Informações adicionais:
            </span>
            <p className="wrap-break-word mt-0.5 whitespace-pre-wrap">
              {informacoesAdicionais || "—"}
            </p>
          </div>
        )}
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
  const [catalogProductId, setCatalogProductId] = useState<number | null>(null);

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
          {/* <div className="mb-2.5 flex items-center gap-1 text-muted-foreground text-xs">
            <LinkIcon className="size-3" />
            Clique em um produto para ver dados do XML de entrada; use o ícone
            de cadastro para abrir a ficha do produto vinculado.
          </div> */}

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
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      className="min-w-0 flex-1 cursor-pointer text-left"
                      onClick={() =>
                        setOpenedProductId((current) =>
                          current === entry.ID ? null : entry.ID
                        )
                      }
                      type="button"
                    >
                      <div className="flex items-center">
                        <div className="min-w-0 flex-1 space-y-1">
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
                        <div className="ml-2 flex shrink-0 items-center gap-1 sm:gap-3">
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
                            <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>
                    <Button
                      className="size-8 shrink-0 cursor-pointer"
                      disabled={!entry.ID_PRODUTO}
                      onClick={() => {
                        if (entry.ID_PRODUTO) {
                          setCatalogProductId(entry.ID_PRODUTO);
                        }
                      }}
                      size="icon"
                      title={
                        entry.ID_PRODUTO
                          ? "Abrir produto no cadastro"
                          : "Produto não vinculado ao cadastro"
                      }
                      type="button"
                      variant="ghost"
                    >
                      <PackageIcon className="size-4" />
                    </Button>
                  </div>

                  <ProductEntryDetail
                    accessKey={accessKey}
                    isOpen={openedProductId === entry.ID}
                    nfeDetalheId={entry.ID}
                    numeroItem={entry.NUMERO_ITEM}
                  />
                </div>
              )
            )
          )}
        </CardContent>
      </Card>

      {catalogProductId != null && (
        <DetailProducts
          onOpenChange={(open) => {
            if (!open) {
              setCatalogProductId(null);
            }
          }}
          open={true}
          productId={catalogProductId}
        />
      )}
    </div>
  );
}
