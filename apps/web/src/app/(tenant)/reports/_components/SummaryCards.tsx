"use client";

import {
  DollarSignIcon,
  PackageIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { ShowText } from "@/components/show-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAsCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  salesPerDay?: {
    totalValuePerDay: Array<{
      date: string;
      total: number;
      count: number;
    }>;
  };
  salesPerSeller?: {
    salesPerSeller: Array<{
      sellerId: number;
      sellerName: string;
      total: number;
      count: number;
    }>;
  };
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
  accountsReceivable?: {
    accountsReceivable: Array<{
      id: number;
      clientName: string;
      dueDate: Date | null;
      amount: number;
      received: number;
      pending: number;
      isOverdue: boolean | null;
    }>;
  };
  stockPosition?: {
    stockPosition: Array<{
      id: number;
      name: string;
      code: string | null;
      currentStock: number;
      minStock: number;
      maxStock: number;
      purchasePrice: number;
      salePrice: number;
      category: string;
      stockValue: number;
      isLowStock: boolean;
    }>;
  };
  financialSummary?: {
    sales: { total: number; count: number };
    receipts: { total: number };
    payments: { total: number };
    pendingReceivables: { total: number };
    pendingPayables: { total: number };
  };
}

export function SummaryCards({
  salesPerDay,
  salesPerSeller,
  topProducts,
  accountsReceivable,
  stockPosition,
  financialSummary,
}: SummaryCardsProps) {
  // Calcular totais
  const totalSales = financialSummary?.sales.total || 0;
  const totalOrders = financialSummary?.sales.count || 0;
  const totalProducts = stockPosition?.stockPosition.length || 0;
  const totalSellers = salesPerSeller?.salesPerSeller.length || 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total de Vendas</CardTitle>
          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            <ShowText>{formatAsCurrency(totalSales)}</ShowText>
          </div>
          <p className="text-muted-foreground text-xs">
            {totalOrders} pedidos realizados
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Produtos Vendidos
          </CardTitle>
          <PackageIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{totalProducts}</div>
          <p className="text-muted-foreground text-xs">produtos diferentes</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Vendedores Ativos
          </CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{totalSellers}</div>
          <p className="text-muted-foreground text-xs">vendedores com vendas</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Fluxo de Caixa</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            <ShowText>
              {formatAsCurrency(
                (financialSummary?.receipts.total || 0) -
                  (financialSummary?.payments.total || 0)
              )}
            </ShowText>
          </div>
          <p className="text-muted-foreground text-xs">saldo líquido</p>
        </CardContent>
      </Card>
    </div>
  );
}
