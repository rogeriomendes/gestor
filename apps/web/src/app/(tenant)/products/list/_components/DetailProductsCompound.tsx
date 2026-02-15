import { useQuery } from "@tanstack/react-query";
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
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";

type CompoundItem =
  RouterOutputs["tenant"]["products"]["compound"]["compound"][number];

export function DetailProductsCompound({ productId }: { productId: number }) {
  const { tenant } = useTenant();

  const productsCompoundQuery = useQuery({
    ...trpc.tenant.products.compound.queryOptions({ id: productId }),
    enabled: !!tenant && productId > 0,
  });

  return (
    <div className="space-y-3">
      <Card className="rounded-md leading-none" size="sm">
        <CardContent className="p-0">
          {productsCompoundQuery.isLoading ? (
            <div className="m-2 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Custo Un.</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Custo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {productsCompoundQuery.data?.compound.map(
                  (compound: CompoundItem) => (
                    <TableRow key={compound.ID}>
                      <TableCell className="py-3">
                        {compound.DESCRICAO}
                      </TableCell>
                      <TableCell className="py-3">
                        {compound.VALOR_CUSTO_UNITARIO &&
                          formatAsCurrency(
                            Number(compound.VALOR_CUSTO_UNITARIO)
                          )}
                      </TableCell>
                      <TableCell className="py-3">
                        {Number(compound.QUANTIDADE)}
                      </TableCell>
                      <TableCell className="py-3">
                        {formatAsCurrency(Number(compound.TOTAL_CUSTO_PRODUTO))}
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
