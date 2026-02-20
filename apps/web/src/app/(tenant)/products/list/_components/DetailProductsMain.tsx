import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTenant } from "@/contexts/tenant-context";
import {
    calculePercentage,
    calculePercentageBetweenValues,
    formatAsCurrency,
    formatAsNumber,
} from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

type productData =
  RouterOutputs["tenant"]["products"]["all"]["products"][number];

export function DetailProductsMain({
  productData,
}: {
  productData: productData;
}) {
  const { tenant } = useTenant();

  const productsNcmQuery = useQuery({
    ...trpc.tenant.products.ncm.queryOptions({ cod: productData.NCM }),
    enabled: !!tenant,
  });

  const productsCestQuery = useQuery({
    ...trpc.tenant.products.cest.queryOptions({ cod: productData.CEST }),
    enabled: !!tenant,
  });

  const productsStockQuery = useQuery({
    ...trpc.tenant.products.stock.queryOptions({ id: productData.ID }),
    enabled: !!tenant,
  });

  const valorCompra = Number(productData.VALOR_COMPRA);

  const frete = calculePercentage(valorCompra, Number(productData.FRETE));
  const icmsST = calculePercentage(valorCompra, Number(productData.ICMS_ST));
  const ipi = calculePercentage(valorCompra, Number(productData.IPI));
  const outrosImpostos = calculePercentage(
    valorCompra,
    Number(productData.OUTROSIMPOSTOS)
  );
  const outrosValores = calculePercentage(
    valorCompra,
    Number(productData.OUTROSVALORES)
  );
  const totalImpostos = frete + icmsST + ipi + outrosImpostos + outrosValores;

  const custoFinal = valorCompra + totalImpostos;

  return (
    <div className="space-y-1.5 md:space-y-3">
      <Card className="rounded-md py-2 md:py-3" size="sm">
        <CardContent className="px-2 md:px-3">
          <div className="grid grid-cols-4 items-start gap-2">
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Compra
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsCurrency(Number(productData.VALOR_COMPRA))}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Custo Final
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsCurrency(custoFinal)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Markup
                </div>
                <div className="text-xs md:text-sm">
                  {calculePercentageBetweenValues(
                    custoFinal,
                    Number(productData.VALOR_VENDA)
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <CardTitle className="text-primary text-xs md:text-sm">
                  Venda
                </CardTitle>
                <CardDescription className="text-primary text-xs md:text-sm">
                  {formatAsCurrency(Number(productData.VALOR_VENDA))}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-md py-2 md:py-3" size="sm">
        <CardContent className="px-2 md:px-3">
          <div className="grid grid-cols-4 items-start gap-2">
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Estoque Mín.
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsNumber(Number(productData.ESTOQUE_MINIMO))}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Estoque Máx
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsNumber(Number(productData.ESTOQUE_MAXIMO))}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Estoque
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsNumber(Number(productData.QUANTIDADE_ESTOQUE))}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Estoque Rede
                </div>
                <div className="text-xs md:text-sm">
                  {productsStockQuery.data?.stock?.QUANTIDADE
                    ? formatAsNumber(
                        Number(productsStockQuery.data?.stock?.QUANTIDADE)
                      )
                    : formatAsNumber(0)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-md py-2 md:py-3" size="sm">
        <CardContent className="px-2 md:px-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                Grupo:{" "}
              </div>
              <div className="text-xs md:text-sm">
                {productData.produto_sub_grupo.NOME}
              </div>
            </div>
            {productData.produto_familia && (
              <div className="flex flex-row items-center gap-2">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Família:{" "}
                </div>
                <div className="text-xs md:text-sm">
                  {productData.produto_familia.NOME}
                </div>
              </div>
            )}
            <Separator className="m-0 my-1 p-0" />
            <div className="flex flex-row items-center gap-2">
              <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                NCM:{" "}
              </div>
              <div className="text-xs md:text-sm">
                {productData.NCM} - {productsNcmQuery.data?.ncm?.DESCRICAO}
              </div>
            </div>
            {productData.CEST && (
              <div className="flex flex-row items-center gap-2">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  CEST:{" "}
                </div>
                <div className="text-xs md:text-sm">
                  {productData.CEST} - {productsCestQuery.data?.cest?.DESCRICAO}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-md py-2 md:py-3" size="sm">
        <CardContent className="px-2 md:px-3">
          <div className="grid grid-cols-3 items-start gap-2">
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Frete
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsCurrency(frete)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  ICMS ST
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsCurrency(icmsST)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  IPI
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsCurrency(ipi)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Outros Impostos
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsCurrency(outrosImpostos)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Outros Valores
                </div>
                <div className="text-xs md:text-sm">
                  {formatAsCurrency(outrosValores)}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex flex-col">
                <div className="font-semibold text-muted-foreground text-xs leading-none tracking-tight md:text-sm">
                  Total de Impostos
                </div>
                <CardDescription className="text-red-400 text-xs md:text-sm">
                  {formatAsCurrency(totalImpostos)}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
