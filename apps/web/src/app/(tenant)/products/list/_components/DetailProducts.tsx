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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import {
  calculePercentage,
  calculePercentageBetweenValues,
  formatAsCurrency,
} from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  BarcodeIcon,
  ClockIcon,
  DotIcon,
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
  productId: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
    enabled: !!tenant && (open ?? true),
  });

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
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center text-left">
                        {productQuery.data?.product?.NOME}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      Nome
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center">
                        <Badge
                          className="ml-3 px-1.5 py-0.5 text-xs md:text-sm"
                          variant="secondary"
                        >
                          {productQuery.data?.product?.unidade_produto?.SIGLA}
                        </Badge>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      Unidade
                    </PopoverContent>
                  </Popover>
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
              <span className="flex flex-row">
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center">
                      {productQuery.data?.product?.CODIGO_INTERNO && (
                        <>
                          <BarcodeIcon className="mr-2 size-4" />
                          {productQuery.data.product.CODIGO_INTERNO}
                        </>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 text-xs">
                    Código interno
                  </PopoverContent>
                </Popover>
                {productQuery.data?.product?.CODIGO_INTERNO && <DotIcon />}
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center">
                      {productQuery.data?.product?.GTIN && (
                        <>
                          <BarcodeIcon className="mr-2 size-4" />
                          {productQuery.data.product.GTIN}
                        </>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 text-xs">
                    GTIN
                  </PopoverContent>
                </Popover>
                {productQuery.data?.product?.GTIN && <DotIcon />}
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center">
                      <ScaleIcon className="mr-2 size-4" />
                      {productQuery.data?.product?.PRODUTO_PESADO === "S"
                        ? "SIM"
                        : "NÃO"}
                      {productQuery.data?.product?.PRODUTO_PESADO === "S" &&
                        typeof productQuery.data?.product?.DIA_VALIDADE ===
                          "number" &&
                        (productQuery.data.product.DIA_VALIDADE ||
                          productQuery.data.product.DIA_VALIDADE !== 0) &&
                        ` - ${productQuery.data.product.DIA_VALIDADE} Dias`}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 text-xs">
                    Balança
                  </PopoverContent>
                </Popover>
              </span>
            )}
            {!(productQuery.isLoading || productQuery.error) && (
              <span className="flex flex-row">
                {productQuery.data?.product?.DATA_CADASTRO && (
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center">
                        <ClockIcon className="mr-2 size-4" />
                        {formatDate(productQuery.data.product.DATA_CADASTRO)}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      Data de cadastro
                    </PopoverContent>
                  </Popover>
                )}
                {productQuery.data?.product?.DATA_CADASTRO &&
                  productQuery.data?.product?.DATA_ALTERACAO && <DotIcon />}
                {productQuery.data?.product?.DATA_ALTERACAO && (
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center">
                        <ClockIcon className="mr-2 size-4" />
                        {formatDate(productQuery.data.product.DATA_ALTERACAO)}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 text-xs">
                      Data de alteração
                    </PopoverContent>
                  </Popover>
                )}
              </span>
            )}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
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
                            Válido até
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
                          <div className="text-foreground text-xs md:text-sm">
                            {calculePercentageBetweenValues(
                              custoFinal,
                              Number(p.activePromotion.PRECO_PROMOCAO ?? 0),
                              true
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-semibold text-xs text-yellow-600 leading-none tracking-tight md:text-sm dark:text-yellow-400">
                            Preço promocional
                          </div>
                          <div className="font-medium text-xs text-yellow-600 md:text-sm dark:text-yellow-400">
                            {formatAsCurrency(
                              Number(p.activePromotion.PRECO_PROMOCAO ?? 0)
                            )}
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
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Erro: {productQuery.error.message}
              </p>
            </div>
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
