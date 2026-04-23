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
      <Card
        className="rounded-md data-[size=sm]:py-0 data-[size=sm]:md:py-0"
        size="sm"
      >
        <CardContent className="group-data-[size=sm]/card:px-0 group-data-[size=sm]/card:md:px-0">
          {productsCompoundQuery.isLoading ? (
            <div className="min-w-0 overflow-hidden">
              <Table className="w-full table-fixed bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[min(40%,8rem)]">Produto</TableHead>
                    <TableHead className="w-20 shrink-0 md:w-24">
                      Custo Un.
                    </TableHead>
                    <TableHead className="w-12 shrink-0 md:w-16">
                      Qtd.
                    </TableHead>
                    <TableHead className="w-20 shrink-0 md:w-24">
                      Custo Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs md:text-sm">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-14" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
