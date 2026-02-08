import { useQuery } from "@tanstack/react-query";
import { ShoppingCartIcon } from "lucide-react";
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
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { DetailEntry } from "../../../invoice/entry/_components/DetailEntry";

type PurchaseItem =
  RouterOutputs["tenant"]["products"]["purchase"]["purchase"][number];

export function DetailProductsPurchase({ productId }: { productId: number }) {
  const { tenant } = useTenant();
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const productsPurchaseQuery = useQuery({
    ...trpc.tenant.products.purchase.queryOptions({ id: productId }),
    enabled: !!tenant && productId > 0,
  });

  const handleRowClick = (purchase: PurchaseItem) => {
    setSelectedEntryId(purchase.nfe_cabecalho.ID);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-3">
      <Card className="rounded-md py-0 md:py-0">
        <CardContent className="px-0 md:px-0">
          {productsPurchaseQuery.isLoading ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data ent.</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Valor unt.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : productsPurchaseQuery.data?.purchase.length === 0 ? (
            <div className="my-8 flex items-center justify-center text-muted-foreground text-sm">
              <ShoppingCartIcon className="mr-5 size-10 md:size-14" /> Não
              existe compras desse produto.
            </div>
          ) : (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data ent.</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Valor unt.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {productsPurchaseQuery.data?.purchase.map(
                  (purchase: PurchaseItem) => (
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      key={purchase.ID}
                      onClick={() => handleRowClick(purchase)}
                    >
                      <TableCell className="py-3">
                        {purchase.nfe_cabecalho.fornecedor?.pessoa.NOME}
                      </TableCell>
                      <TableCell>
                        {purchase.nfe_cabecalho.DATA_ENTRADA_SAIDA &&
                          formatDate(purchase.nfe_cabecalho.DATA_ENTRADA_SAIDA)}
                      </TableCell>
                      <TableCell className="py-3">
                        {Number(purchase.QUANTIDADE_COMERCIAL)}{" "}
                        {purchase.UNIDADE_COMERCIAL}
                      </TableCell>
                      <TableCell className="py-3">
                        {formatAsCurrency(
                          Number(purchase.VALOR_TOTAL) /
                            Number(purchase.QUANTIDADE_COMERCIAL)
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedEntryId && (
        <DetailEntry
          entryID={selectedEntryId}
          onOpenChange={setIsModalOpen}
          open={isModalOpen}
        />
      )}
    </div>
  );
}
