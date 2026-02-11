"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon, TagIcon } from "lucide-react";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTenant } from "@/contexts/tenant-context";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";

type Product = RouterOutputs["tenant"]["products"]["all"]["products"][number];

interface ProductSelectorProps {
  onSelect: (product: Product) => void;
  selectedIds: string[];
}

export function ProductSelector({
  onSelect,
  selectedIds,
}: ProductSelectorProps) {
  const { tenant } = useTenant();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    ...trpc.tenant.products.all.queryOptions({
      searchTerm: search,
      limit: 20,
      promotion: search.length === 0 ? "S" : undefined,
    }),
    enabled: !!tenant,
  });

  const products = data?.products ?? [];

  const formatPromoType = (type?: number) => {
    switch (String(type)) {
      case "1":
        return "Leve/Pague";
      case "2":
        return "Atacado";
      case "3":
        return "Promoção";
      case "4":
        return "Inativo";
      default:
        return "";
    }
  };

  return (
    <div className="flex h-full flex-col gap-1 p-1 md:gap-2 md:p-2">
      <div className="relative">
        <SearchInput
          className="md:w-full lg:w-full"
          enableF9Shortcut
          onChange={setSearch}
          placeholder="Buscar produto..."
          value={search}
        />
      </div>

      <ScrollArea className="h-[300px] w-full flex-1 md:w-auto lg:h-auto">
        <div className="space-y-1 md:space-y-2">
          {isLoading && (
            <div className="p-2 text-center text-muted-foreground text-sm md:p-4">
              Carregando...
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="flex h-full min-h-[100px] flex-col items-center justify-center gap-2 p-2 text-center text-muted-foreground text-sm md:p-4">
              {search.length === 0 ? (
                <>
                  <TagIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <span className="font-medium">Nenhuma promoção ativa</span>
                  <span className="max-w-56 text-center text-muted-foreground text-xs">
                    Pesquise acima para adicionar produtos que não estão em
                    promoção.
                  </span>
                </>
              ) : (
                <span>Nenhum produto encontrado</span>
              )}
            </div>
          )}

          {products.map((product: Product) => {
            const isSelected = selectedIds.includes(String(product.ID));
            const isKg = product.unidade_produto?.SIGLA === "KG";
            const displayCode =
              product.GTIN && !isKg && product.GTIN.length > 0
                ? product.GTIN
                : product.CODIGO_INTERNO || product.ID;

            const hasPromo = !!product.activePromotion;
            const promoType = product.activePromotion?.TIPO_PROMOCAO;
            const originalPrice = Number(product.VALOR_VENDA);
            const promoPrice = hasPromo
              ? Number(product.activePromotion.PRECO_PROMOCAO)
              : null;

            return (
              <div
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border p-2 transition-colors hover:border-accent-foreground/20 hover:bg-accent",
                  isSelected && "bg-accent/50 opacity-50"
                )}
                key={product.ID}
              >
                <div className="flex w-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden">
                  <span className="truncate font-medium text-sm">
                    {product.NOME}
                  </span>
                  <div className="flex flex-col text-muted-foreground text-xs">
                    <span className="mb-0.5 text-[10px] text-gray-500 uppercase">
                      Cód: {displayCode}
                    </span>
                    {hasPromo && promoPrice !== null ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[11px] text-green-600">
                          {formatPromoType(promoType)}:{" "}
                          {formatAsCurrency(promoPrice)}{" "}
                          {product.unidade_produto?.SIGLA}
                        </span>
                        <span className="text-[10px] line-through opacity-70">
                          {formatAsCurrency(originalPrice)}{" "}
                          {product.unidade_produto?.SIGLA}
                        </span>
                      </div>
                    ) : (
                      <span className="font-medium text-foreground/80">
                        {formatAsCurrency(originalPrice)}{" "}
                        {product.unidade_produto?.SIGLA}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  className="h-8 w-8 shrink-0"
                  onClick={() => onSelect(product)}
                  size="icon"
                  variant={isSelected ? "secondary" : "ghost"}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
