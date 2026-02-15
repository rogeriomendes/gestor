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
      unitName: string;
      unitDescription: string;
    }>;
  };
}

export function ProductsList({ topProducts }: ProductsListProps) {
  const products = topProducts?.topProducts || [];

  if (products.length === 0) {
    return (
      <Card size="sm">
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
    <Card size="sm">
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
        <CardDescription>
          Lista dos produtos com maior volume de vendas no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Visualização Gráfica (Top 5) */}
        <div className="mb-6 space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            Top 5 Produtos
          </h3>
          <div className="space-y-2">
            {products.slice(0, 5).map((product) => {
              const maxVal = Math.max(...products.map((p) => p.totalValue));
              const percentage = (product.totalValue / maxVal) * 100;

              return (
                <div className="space-y-1" key={product.productId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="max-w-[200px] truncate font-medium">
                      {product.productName}
                    </span>
                    <span className="text-muted-foreground">
                      {formatAsCurrency(product.totalValue)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-28">Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="w-28 text-right">Quantidade</TableHead>
                <TableHead className="w-28 text-right">Valor Total</TableHead>
                <TableHead className="w-28 text-right">Preço Unit.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.productId}>
                  <TableCell className="font-medium">
                    <Badge variant="secondary">{index + 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {product.productCode || "N/A"}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{product.productName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <ShowText>
                      {product.quantity.toLocaleString()} {product.unitName}
                    </ShowText>
                  </TableCell>
                  <TableCell className="text-right">
                    <ShowText className="font-medium">
                      {formatAsCurrency(product.totalValue)}
                    </ShowText>
                  </TableCell>
                  <TableCell className="text-right">
                    <ShowText className="text-muted-foreground text-sm">
                      {formatAsCurrency(product.unitPrice)} {product.unitName}
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
