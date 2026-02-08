"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BudgetSales } from "./BudgetSales";

export function BudgetCard() {
  return (
    <Card className="col-span-4 rounded-md md:grid-cols-3 lg:col-span-2">
      <CardHeader>
        <CardTitle>30 últimos orçamentos em digitação</CardTitle>
      </CardHeader>
      <CardContent className="h-min-[400px]">
        <ScrollArea className="h-[400px]">
          <BudgetSales />
        </ScrollArea>
        {/* Botão fixo na parte de baixo */}
        <div className="sticky bottom-0 mt-2 border-t bg-card pt-2">
          <Link href="/sales/budget">
            <Button className="w-full justify-center" size="sm" variant="ghost">
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              Ver todos os orçamentos
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
