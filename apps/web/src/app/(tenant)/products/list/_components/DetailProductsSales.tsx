import { useQuery } from "@tanstack/react-query";
import { PackageIcon } from "lucide-react";
import { useState } from "react";
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
import { formatDate } from "@/lib/format-date";
import { removeLeadingZero } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { DetailSales } from "../../../sales/list/_components/DetailSales";

type SaleItem = RouterOutputs["tenant"]["products"]["sales"]["sales"][number];

export function DetailProductsSales({ productId }: { productId: number }) {
  const { tenant } = useTenant();
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const productsSalesQuery = useQuery({
    ...trpc.tenant.products.sales.queryOptions({ id: productId }),
    enabled: !!tenant && productId > 0,
  });

  return (
    <div className="space-y-3">
      <Card className="rounded-md py-0 md:py-0">
        <CardContent className="px-0 md:px-0">
          {productsSalesQuery.isLoading ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Nr. Venda</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>NFCe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : productsSalesQuery.data?.sales.length === 0 ? (
            <div className="my-8 flex items-center justify-center text-muted-foreground text-sm">
              <PackageIcon className="mr-5 size-10 md:size-14" /> Não existe
              vendas desse produto.
            </div>
          ) : (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Nr. Venda</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>NFCe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {productsSalesQuery.data?.sales.map((sale: SaleItem) => (
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    key={sale.ID}
                    onClick={() => {
                      setSelectedSaleId(sale.venda_cabecalho.ID);
                      setIsModalOpen(true);
                    }}
                  >
                    <TableCell className="py-3">
                      {sale.venda_cabecalho.ID}
                    </TableCell>
                    <TableCell className="py-3">
                      {sale.venda_cabecalho.DATA_VENDA &&
                        formatDate(sale.venda_cabecalho.DATA_VENDA)}
                    </TableCell>
                    <TableCell className="py-3">
                      {Number(sale.QUANTIDADE)}{" "}
                      {sale.produto.unidade_produto.SIGLA}
                    </TableCell>
                    <TableCell className="py-3">
                      {sale.venda_cabecalho.NUMERO_NFE &&
                        removeLeadingZero(sale.venda_cabecalho.NUMERO_NFE)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal do DetailSales */}
      {selectedSaleId && (
        <DetailSales
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedSaleId(null);
            }
          }}
          open={isModalOpen}
          saleId={selectedSaleId}
        />
      )}
    </div>
  );
}
