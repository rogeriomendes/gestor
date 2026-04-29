"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import {
  calculePercentage,
  calculePercentageBetweenValues,
  cn,
  formatAsCurrency,
} from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  BarcodeIcon,
  ClockIcon,
  ScaleIcon,
  SquarePercentIcon,
  XIcon,
} from "lucide-react";
import { DetailProductsCompound } from "./DetailProductsCompound";
import { DetailProductsInformation } from "./DetailProductsInformation";
import { DetailProductsMain } from "./DetailProductsMain";
import { DetailProductsPurchase } from "./DetailProductsPurchase";
import { DetailProductsSales } from "./DetailProductsSales";

interface DetailProductsProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  productId: number;
}

export function DetailProducts({
  productId,
  open,
  onOpenChange,
}: DetailProductsProps) {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();

  const productQuery = useQuery({
    ...trpc.tenant.products.byId.queryOptions({ id: productId }),
    enabled: !!tenant && productId > 0 && (open ?? true),
  });
  const product = productQuery.data?.product;

  const valorCompra = Number(product?.VALOR_COMPRA ?? 0);
  const frete = calculePercentage(valorCompra, Number(product?.FRETE ?? 0));
  const icmsST = calculePercentage(valorCompra, Number(product?.ICMS_ST ?? 0));
  const ipi = calculePercentage(valorCompra, Number(product?.IPI ?? 0));
  const outrosImpostos = calculePercentage(
    valorCompra,
    Number(product?.OUTROSIMPOSTOS ?? 0)
  );
  const outrosValores = calculePercentage(
    valorCompra,
    Number(product?.OUTROSVALORES ?? 0)
  );
  const custoFinal =
    valorCompra + frete + icmsST + ipi + outrosImpostos + outrosValores;
  const valorVenda = Number(product?.VALOR_VENDA ?? 0);
  const markupPercent =
    custoFinal > 0 ? ((valorVenda - custoFinal) / custoFinal) * 100 : 0;
  const isPositiveMarkup = markupPercent > 0;

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            <div className="flex w-[93%] items-center">
              {productQuery.isLoading ? (
                <>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="ml-2 h-6 w-10" />
                </>
              ) : productQuery.error ? (
                "Erro ao carregar produto"
              ) : (
                <>
                  <div className="flex items-center text-left">
                    {productQuery.data?.product?.NOME}
                  </div>
                  {product?.INATIVO === "S" && (
                    <Badge
                      className="ml-3 px-1.5 py-0.5 text-xs md:text-sm"
                      variant="destructive"
                    >
                      Inativo
                    </Badge>
                  )}
                  <Badge
                    className="ml-3 px-1.5 py-0.5 text-xs md:text-sm"
                    variant="secondary"
                  >
                    {product?.unidade_produto?.SIGLA}
                  </Badge>
                </>
              )}
            </div>
          </CredenzaTitle>
          <CredenzaDescription>
            {productQuery.isLoading ? (
              <span className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
              </span>
            ) : productQuery.error ? (
              "Não foi possível carregar os dados do produto. Tente novamente."
            ) : (
              <div className="mb-1 grid grid-cols-2 gap-1 md:mb-0 md:grid-cols-3 md:space-y-0">
                <span className="flex items-center">
                  <BarcodeIcon className="mr-2 size-4" />
                  Cód. interno: {product?.CODIGO_INTERNO || "—"}
                </span>
                <span className="flex items-center">
                  <BarcodeIcon className="mr-2 size-4" />
                  GTIN: {product?.GTIN || "—"}
                </span>
                <span className="flex items-center">
                  <ScaleIcon className="mr-2 size-4" />
                  Balança: {product?.PRODUTO_PESADO === "S" ? "Sim" : "Não"}
                  {product?.PRODUTO_PESADO === "S" &&
                    typeof product?.DIA_VALIDADE === "number" &&
                    ` (${product.DIA_VALIDADE} dias)`}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="mr-2 size-4" />
                  Cadastro:{" "}
                  {product?.DATA_CADASTRO
                    ? formatDate(product.DATA_CADASTRO)
                    : "—"}
                </span>
                <span className="col-span-2 flex items-center">
                  <ClockIcon className="mr-2 size-4" />
                  Alteração:{" "}
                  {product?.DATA_ALTERACAO
                    ? formatDate(product.DATA_ALTERACAO)
                    : "—"}
                </span>
              </div>
            )}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {/* {!(productQuery.isLoading || productQuery.error) && product && (
            <div className="mb-4 grid grid-cols-4 gap-2 md:grid-cols-4">
              <div className="rounded-md border bg-muted/30 p-2">
                <div className="text-muted-foreground text-xs">Custo final</div>
                <div className="font-medium text-sm">
                  {formatAsCurrency(custoFinal)}
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-2">
                <div className="text-muted-foreground text-xs">Venda</div>
                <div className="font-medium text-sm">
                  {formatAsCurrency(Number(product.VALOR_VENDA ?? 0))}
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-2">
                <div className="text-muted-foreground text-xs">Markup</div>
                <div
                  className={cn(
                    "font-medium text-sm",
                    isPositiveMarkup
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  {calculePercentageBetweenValues(custoFinal, valorVenda, true)}
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-2">
                <div className="text-muted-foreground text-xs">Status</div>
                <div
                  className={cn(
                    "font-medium text-sm",
                    product.INATIVO === "S"
                      ? "text-destructive"
                      : "text-emerald-700 dark:text-emerald-400"
                  )}
                >
                  {product.INATIVO === "S" ? "Inativo" : "Ativo"}
                </div>
              </div>
            </div>
          )} */}
          {/* Seção de Promoção Ativa */}
          {!(productQuery.isLoading || productQuery.error) &&
            productQuery.data?.product &&
            (() => {
              const p = productQuery.data.product;
              const valorCompra = Number(p.VALOR_COMPRA ?? 0);
              const frete = calculePercentage(
                valorCompra,
                Number(p.FRETE ?? 0)
              );
              const icmsST = calculePercentage(
                valorCompra,
                Number(p.ICMS_ST ?? 0)
              );
              const ipi = calculePercentage(valorCompra, Number(p.IPI ?? 0));
              const outrosImpostos = calculePercentage(
                valorCompra,
                Number(p.OUTROSIMPOSTOS ?? 0)
              );
              const outrosValores = calculePercentage(
                valorCompra,
                Number(p.OUTROSVALORES ?? 0)
              );
              const custoFinal =
                valorCompra +
                frete +
                icmsST +
                ipi +
                outrosImpostos +
                outrosValores;
              const precoPromocao = Number(
                p.activePromotion?.PRECO_PROMOCAO ?? 0
              );
              const promoMarkupPercent =
                custoFinal > 0
                  ? ((precoPromocao - custoFinal) / custoFinal) * 100
                  : 0;
              const isPositivePromoMarkup = promoMarkupPercent > 0;
              const hasPromo = p.activePromotion?.header;

              return (
                hasPromo &&
                p.activePromotion && (
                  <Alert className="mb-4" variant="warning">
                    <SquarePercentIcon className="size-4" />
                    <AlertTitle>
                      Promoção: {hasPromo.NOME_REAJUSTE || "Promoção Ativa"}
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 grid grid-cols-3 items-start gap-2">
                        <div className="flex flex-col">
                          <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                            Promoção válida até
                          </div>
                          <div className="text-foreground text-xs md:text-sm">
                            {hasPromo.DATA_FIM
                              ? `${formatDate(hasPromo.DATA_FIM)} ${hasPromo.HORA_FIM ?? ""}`.trim()
                              : "—"}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                            Markup promoção
                          </div>
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isPositivePromoMarkup
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-destructive"
                            )}
                          >
                            {calculePercentageBetweenValues(
                              custoFinal,
                              precoPromocao,
                              true
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                            Preço promocional
                          </div>
                          <div className="font-medium text-primary text-sm">
                            {formatAsCurrency(precoPromocao)}
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )
              );
            })()}
          {productQuery.isLoading ? (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ) : productQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar o produto</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span className="text-sm">{productQuery.error.message}</span>
                <Button
                  onClick={() => void productQuery.refetch()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs className="w-full" defaultValue="default">
              <TabsList className="mb-1">
                <TabsTrigger value="default">Principal</TabsTrigger>
                <TabsTrigger value="sales">Vendas</TabsTrigger>
                <TabsTrigger value="purchase">Compras</TabsTrigger>
                {productQuery.data?.product?.COMPOSTO === "S" && (
                  <TabsTrigger value="compound">Composição</TabsTrigger>
                )}
                {productQuery.data?.product?.DESCRICAO && (
                  <TabsTrigger value="info">Informações</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="default">
                {productQuery.data?.product && (
                  <DetailProductsMain
                    productData={
                      productQuery.data.product as Parameters<
                        typeof DetailProductsMain
                      >[0]["productData"]
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="sales">
                {productQuery.data?.product && (
                  <DetailProductsSales
                    productId={productQuery.data.product?.ID}
                  />
                )}
              </TabsContent>
              <TabsContent value="purchase">
                {productQuery.data?.product && (
                  <DetailProductsPurchase
                    productId={productQuery.data.product?.ID}
                  />
                )}
              </TabsContent>
              {productQuery.data?.product?.COMPOSTO === "S" && (
                <TabsContent value="compound">
                  {productQuery.data?.product && (
                    <DetailProductsCompound
                      productId={productQuery.data.product?.ID}
                    />
                  )}
                </TabsContent>
              )}
              {productQuery.data?.product?.DESCRICAO && (
                <TabsContent value="info">
                  {productQuery.data?.product && (
                    <DetailProductsInformation
                      productData={
                        productQuery.data.product as Parameters<
                          typeof DetailProductsInformation
                        >[0]["productData"]
                      }
                    />
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
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
