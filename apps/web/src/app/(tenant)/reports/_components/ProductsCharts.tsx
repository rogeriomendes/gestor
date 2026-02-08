"use client";

import { ShowText } from "@/components/show-text";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAsCurrency } from "@/lib/utils";

interface ProductsListProps {
  topProducts?: {
    topProducts: Array<{
      productId: number;
      productName: string;
      productCode: string | null;
      quantity: number;
      totalValue: number;
      unitPrice: number;
    }>;
  };
}

export function ProductsList({ topProducts }: ProductsListProps) {
  const products = topProducts?.topProducts || [];

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
          <CardDescription>
            Lista dos produtos com maior volume de vendas no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <p>Nenhum produto encontrado para o período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
        <CardDescription>
          Lista dos produtos com maior volume de vendas no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead className="w-[100px] text-right">
                  Quantidade
                </TableHead>
                <TableHead className="w-[120px] text-right">
                  Valor Total
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  Preço Unit.
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.productId}>
                  <TableCell className="font-medium">
                    <Badge variant="secondary">{index + 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{product.productName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {product.productCode || "N/A"}
                    </code>
                  </TableCell>
                  <TableCell className="text-right">
                    <ShowText>{product.quantity.toLocaleString()}</ShowText>
                  </TableCell>
                  <TableCell className="text-right">
                    <ShowText className="font-medium">
                      {formatAsCurrency(product.totalValue)}
                    </ShowText>
                  </TableCell>
                  <TableCell className="text-right">
                    <ShowText className="text-muted-foreground text-sm">
                      {formatAsCurrency(product.unitPrice)}
                    </ShowText>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <div className="font-bold text-2xl">
              <ShowText>{products.length}</ShowText>
            </div>
            <div className="text-muted-foreground text-xs">Produtos</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">
              <ShowText>
                {products
                  .reduce((sum, p) => sum + p.quantity, 0)
                  .toLocaleString()}
              </ShowText>
            </div>
            <div className="text-muted-foreground text-xs">Total Vendido</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">
              <ShowText>
                {formatAsCurrency(
                  products.reduce((sum, p) => sum + p.totalValue, 0)
                )}
              </ShowText>
            </div>
            <div className="text-muted-foreground text-xs">Faturamento</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
