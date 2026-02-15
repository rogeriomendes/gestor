"use client";

import { FileText, LayoutGrid, Pencil, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatAsCurrency } from "@/lib/utils";
import { PosterPreview, type PosterProduct } from "./PosterPreview";
import { ProductSelector } from "./ProductSelector";

export function PosterBuilder() {
  const [products, setProducts] = useState<PosterProduct[]>([]);
  const [format, setFormat] = useState<
    "a4-full" | "a4-grid-2x4" | "a4-grid-2x2" | "a3-full"
  >("a4-full");
  const [showYellowBackground, _setShowYellowBackground] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PosterProduct | null>(
    null
  );
  const [editName, setEditName] = useState("");

  const handleProductSelect = (product: any) => {
    // Map existing product type to PosterProduct
    const price = product.activePromotion?.PRECO_PROMOCAO
      ? Number(product.activePromotion.PRECO_PROMOCAO)
      : Number(product.VALOR_VENDA);

    const unit = product.unidade_produto?.SIGLA || "UN";

    // Map existing product type to PosterProduct
    const newProduct: PosterProduct = {
      id: String(product.ID),
      name: product.NOME,
      price,
      unit,
      internalId:
        Math.random().toString(36).substring(2) + Date.now().toString(36),
      originalPrice: Number(product.VALOR_VENDA),
      showOriginalPrice: false,
      promoType: product.activePromotion?.TIPO_PROMOCAO,
      qtdPromocao: product.activePromotion?.QTD_PROMOCAO
        ? Number(product.activePromotion.QTD_PROMOCAO)
        : undefined,
      qtdPagar: product.activePromotion?.QTD_PAGAR
        ? Number(product.activePromotion.QTD_PAGAR)
        : undefined,
      ean: product.GTIN,
      code: product.CODIGO_INTERNO || String(product.ID),
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const toggleShowOriginalPrice = (internalId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.internalId === internalId
          ? { ...p, showOriginalPrice: !p.showOriginalPrice }
          : p
      )
    );
  };

  const removeProduct = (internalId: string) => {
    setProducts((prev) => prev.filter((p) => p.internalId !== internalId));
  };

  const startEdit = (product: PosterProduct) => {
    setEditingProduct(product);
    setEditName(product.name);
  };

  const saveEdit = () => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.internalId === editingProduct.internalId
            ? { ...p, name: editName }
            : p
        )
      );
      setEditingProduct(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPromoTypeName = (type?: number) => {
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
        return type ? `Tipo ${type}` : "";
    }
  };

  return (
    <div className="flex h-auto flex-col gap-2 md:h-[calc(100vh-4rem)] md:flex-row md:gap-4 print:block print:h-auto">
      {/* Sidebar de Configuração - Hide on Print */}
      <Card
        className="flex w-full flex-col gap-2 rounded-md px-2 md:w-1/3 md:max-w-[500px] md:shrink-0 md:gap-4 md:px-5 print:hidden"
        size="sm"
      >
        <div>
          <h2 className="font-semibold text-lg">Configuração</h2>
          <p className="text-muted-foreground text-sm">
            Selecione o formato e os produtos para impressão.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="font-medium text-sm">Formato</label>
          <Select
            onValueChange={(v) =>
              setFormat(
                v as "a4-full" | "a4-grid-2x4" | "a4-grid-2x2" | "a3-full"
              )
            }
            value={format}
          >
            <SelectTrigger>
              <SelectValue>Selecione o formato</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4-full">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>A4 (1 por página)</span>
                </div>
              </SelectItem>
              <SelectItem value="a4-grid-2x2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span>A4 2x2 (4 por página)</span>
                </div>
              </SelectItem>
              <SelectItem value="a4-grid-2x4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span>A4 2x4 (8 por página)</span>
                </div>
              </SelectItem>
              <SelectItem value="a3-full">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>A3 (1 por página)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="show-bg"
            checked={showYellowBackground}
            onCheckedChange={(checked) =>
              setShowYellowBackground(checked as boolean)
            }
          />
          <label
            htmlFor="show-bg"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Fundo Amarelo
          </label>
        </div> */}

        <div className="flex flex-1 flex-col overflow-hidden">
          <label className="mb-2 font-medium text-sm">Adicionar Produtos</label>
          <div className="flex-1 overflow-hidden rounded-md border bg-background">
            <ProductSelector
              onSelect={handleProductSelect}
              selectedIds={products.map((p) => p.id)}
            />
          </div>
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto border-t pt-2 md:space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">
              Selecionados ({products.length})
            </span>
            {products.length > 0 && (
              <Button
                className="h-6 px-2 text-destructive text-xs"
                onClick={() => setProducts([])}
                size="sm"
                variant="ghost"
              >
                Limpar
              </Button>
            )}
          </div>
          {products.map((p) => {
            const isKg = p.unit === "KG";
            const displayCode = p.ean && !isKg ? p.ean : p.code;

            return (
              <div
                className="flex items-center justify-between rounded border p-2 text-sm"
                key={p.internalId}
              >
                <div className="mr-2 flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium uppercase">
                    {p.name}
                  </span>
                  <div className="flex flex-col text-muted-foreground text-xs">
                    <span className="text-[10px] text-gray-500">
                      Cód: {displayCode}
                    </span>
                    {p.promoType ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-green-600">
                          {getPromoTypeName(p.promoType)}:{" "}
                          {formatAsCurrency(p.price)} {p.unit}
                        </span>
                        <span className="text-[11px] line-through opacity-70">
                          {formatAsCurrency(p.originalPrice)} {p.unit}
                        </span>
                      </div>
                    ) : (
                      <span>
                        {formatAsCurrency(p.price)} {p.unit}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    onClick={() => startEdit(p)}
                    size="icon"
                    title="Editar nome"
                    variant="ghost"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {p.promoType === 3 && (
                    <Button
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={() => toggleShowOriginalPrice(p.internalId!)}
                      size="icon"
                      title="Mostrar preço original"
                      variant={p.showOriginalPrice ? "secondary" : "ghost"}
                    >
                      <span className="font-bold text-[10px]">DE</span>
                    </Button>
                  )}
                  <Button
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProduct(p.internalId!)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          className="w-full gap-2"
          disabled={products.length === 0}
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          Imprimir Cartazes
        </Button>
      </Card>

      {/* Área de Preview */}
      <div className="flex-1 overflow-auto rounded-md bg-gray-100/50 px-1 py-2 md:px-2 md:py-6 print:rounded-none print:bg-white print:px-0 print:py-0">
        <div
          className={`mx-2 max-w-full origin-top-left transition-transform md:mx-auto md:origin-top print:mx-0 print:max-w-none print:scale-100 ${
            format === "a3-full"
              ? "w-[297mm] scale-[0.32] sm:scale-[0.52] md:max-w-[297mm] md:scale-[0.6] print:relative"
              : "w-[210mm] scale-[0.45] sm:scale-[0.75] md:max-w-[210mm] md:scale-100 print:relative"
          }`}
        >
          <PosterPreview
            format={format}
            products={products}
            showYellowBackground={showYellowBackground}
          />
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => !open && setEditingProduct(null)}
        open={!!editingProduct}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome do Produto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                className="uppercase"
                id="name"
                onChange={(e) => setEditName(e.target.value)}
                value={editName}
              />
              {editName.length > 50 && (
                <p className="font-medium text-xs text-yellow-600">
                  Atenção: Nome muito longo pode quebrar o layout.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingProduct(null)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
