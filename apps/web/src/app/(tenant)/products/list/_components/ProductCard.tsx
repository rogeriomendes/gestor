"use client";

import { DotIcon, SquarePercentIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import {
  calculePercentage,
  calculePercentageBetweenValues,
  cn,
  formatAsCurrency,
} from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";

type ProductData =
  RouterOutputs["tenant"]["products"]["all"]["products"][number];

interface ProductCardProps {
  product: ProductData;
  onClick?: (product: ProductData) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  function custoFinal(
    valuePurchase: unknown | null,
    ValueFreight: unknown | null,
    ValueIcmsSt: unknown | null,
    ValueIpi: unknown | null,
    ValueOtherTaxes: unknown | null,
    ValueOthersValues: unknown | null
  ) {
    const valorCompra = Number(valuePurchase);

    const frete = calculePercentage(valorCompra, Number(ValueFreight));
    const icmsST = calculePercentage(valorCompra, Number(ValueIcmsSt));
    const ipi = calculePercentage(valorCompra, Number(ValueIpi));
    const outrosImpostos = calculePercentage(
      valorCompra,
      Number(ValueOtherTaxes)
    );
    const outrosValores = calculePercentage(
      valorCompra,
      Number(ValueOthersValues)
    );
    const totalImpostos = frete + icmsST + ipi + outrosImpostos + outrosValores;

    const custoFinal = valorCompra + totalImpostos;

    return custoFinal;
  }

  const finalCost = custoFinal(
    product.VALOR_COMPRA,
    product.FRETE,
    product.ICMS_ST,
    product.IPI,
    product.OUTROSVALORES,
    product.OUTROSIMPOSTOS
  );

  const markup = calculePercentageBetweenValues(
    finalCost,
    Number(product.VALOR_VENDA),
    true
  );

  return (
    <Card
      className={cn(
        "h-full cursor-pointer rounded-md transition-all"
        // product.activePromotion &&
        //   "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20",
      )}
      onClick={() => onClick?.(product)}
    >
      <CardContent>
        {/* Header com nome e promoção */}
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {product.activePromotion && (
              <SquarePercentIcon
                aria-label="Promoção ativa"
                className="size-3.5 flex-shrink-0 text-orange-700 dark:text-orange-300"
              />
            )}
            <h3 className="line-clamp-2 font-medium text-sm leading-tight">
              {product.NOME}
            </h3>
          </div>
          <Badge
            className="px-1.5 py-0.5 text-xs md:text-sm"
            variant="secondary"
          >
            {product.unidade_produto.SIGLA}
          </Badge>
        </div>

        {/* Códigos */}
        <div className="mb-1.5 flex items-center text-muted-foreground text-xs">
          {product.CODIGO_INTERNO && <>Cód. int.: {product.CODIGO_INTERNO}</>}
          {product.CODIGO_INTERNO && product.GTIN && <DotIcon />}
          {product.GTIN && <>GTIN: {product.GTIN}</>}
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {/* Custo final */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Custo Final</span>
            <div className="font-medium">{formatAsCurrency(finalCost)}</div>
          </div>

          {/* Markup */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Markup</span>
            <div className="font-medium">{markup}</div>
          </div>

          {/* Preço de venda */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Venda</span>
            <div className="font-semibold text-primary">
              {formatAsCurrency(Number(product.VALOR_VENDA))}
            </div>
          </div>

          {/* Data de alteração */}
          {product.DATA_ALTERACAO && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Alteração</span>
              <div className="text-xs">
                {formatDate(product.DATA_ALTERACAO, true)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
