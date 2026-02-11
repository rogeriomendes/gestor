import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { formatAsCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function DetailSalesProducts({
  saleId,
}: {
  saleId: number | null | undefined;
}) {
  const { tenant } = useTenant();

  const { data: saleProductsData, isPending: saleProductsIsPending } = useQuery(
    {
      ...trpc.tenant.sales.productsById.queryOptions({ id: saleId }),
      enabled: !!tenant && saleId != null,
    }
  );

  if (saleProductsIsPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="group rounded-md p-2 transition-colors" key={index}>
            <div className="flex items-center">
              <div className="flex-1 space-y-2">
                {/* Nome do produto */}
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  {/* Código interno/GTIN */}
                  <Skeleton className="h-3 w-24" />
                  {/* Quantidade e unidade */}
                  <Skeleton className="h-3 w-16" />
                  {/* Valor unitário */}
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="ml-auto">
                {/* Valor subtotal */}
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return saleProductsData?.sale.map((products: any) => (
    <div
      className="group rounded-md p-2 transition-colors hover:bg-muted/50"
      key={products?.ID}
    >
      <div className="flex items-center">
        <div className="space-y-1">
          <p className="text-xs leading-none md:text-sm">
            {products?.produto.NOME}
          </p>
          <div className="flex gap-2 text-muted-foreground text-xs md:text-sm">
            <div className="min-w-28 md:min-w-32">
              {products?.produto.PRODUTO_PESADO === "S" ||
              !products?.produto.GTIN
                ? products?.produto.CODIGO_INTERNO
                : products?.produto.GTIN}
            </div>
            <div className="flex min-w-14 items-center md:min-w-20">
              {Number(products?.QUANTIDADE)}{" "}
              {products?.produto.unidade_produto.SIGLA}
            </div>
            <div className="flex items-center">
              {formatAsCurrency(Number(products?.VALOR_UNITARIO))}
            </div>
          </div>
        </div>
        <div className="ml-auto space-y-1">
          <div className="flex flex-col items-center text-sm md:text-base">
            {formatAsCurrency(Number(products?.VALOR_SUBTOTAL))}
          </div>
        </div>
      </div>
    </div>
  ));
}
