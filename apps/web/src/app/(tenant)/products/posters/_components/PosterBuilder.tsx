"use client";

import { PDFDownloadLink, PDFViewer, pdf } from "@react-pdf/renderer";
import { useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Download,
  FileText,
  LayoutGrid,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatAsCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import type { PosterProduct } from "./PosterPreview";
import { ProductSelector } from "./ProductSelector";
import { A3FullPosterPdfDocument } from "./pdf/A3FullPosterPdfDocument";
import { A4FullPosterPdfDocument } from "./pdf/A4FullPosterPdfDocument";
import { A4Grid2x2PosterPdfDocument } from "./pdf/A4Grid2x2PosterPdfDocument";
import { A4Grid2x4PosterPdfDocument } from "./pdf/A4Grid2x4PosterPdfDocument";

export function PosterBuilder() {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<PosterProduct[]>([]);
  const [format, setFormat] = useState<
    "a4-full" | "a4-grid-2x4" | "a4-grid-2x2" | "a3-full"
  >("a4-full");
  const [editingProduct, setEditingProduct] = useState<PosterProduct | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [isGeneratingMobilePreview, setIsGeneratingMobilePreview] =
    useState(false);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const [compoundDetailProduct, setCompoundDetailProduct] =
    useState<PosterProduct | null>(null);

  const handleProductSelect = async (product: any) => {
    // Map existing product type to PosterProduct
    const price = product.activePromotion?.PRECO_PROMOCAO
      ? Number(product.activePromotion.PRECO_PROMOCAO)
      : Number(product.VALOR_VENDA);

    const unit = product.unidade_produto?.SIGLA || "UN";

    const isCompound = String(product.COMPOSTO ?? "N") === "S";
    let compoundTotalQuantity: number | undefined;
    let compoundItemsCount: number | undefined;
    let compoundItems: PosterProduct["compoundItems"];

    if (isCompound) {
      const compoundResult = await queryClient.fetchQuery(
        trpc.tenant.products.compound.queryOptions({
          id: Number(product.ID),
        })
      );

      const quantities =
        compoundResult?.compound?.map((item) => Number(item.QUANTIDADE) || 0) ??
        [];
      const total = quantities.reduce((sum, qty) => sum + qty, 0);

      compoundTotalQuantity = total > 0 ? total : undefined;
      compoundItemsCount = compoundResult?.compound?.length ?? 0;
      compoundItems =
        compoundResult?.compound?.map((item) => ({
          description: item.DESCRICAO ?? "Sem descrição",
          quantity: Number(item.QUANTIDADE) || 0,
        })) ?? [];
    }

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
      compoundItemsCount,
      compoundItems,
      compoundTotalQuantity,
      ean: product.GTIN,
      code: product.CODIGO_INTERNO || String(product.ID),
      isCompound,
      showCompoundUnitInfo: false,
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

  const toggleShowCompoundUnitInfo = (internalId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.internalId === internalId
          ? { ...p, showCompoundUnitInfo: !p.showCompoundUnitInfo }
          : p
      )
    );
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

  const formatOptions: ComboboxOption[] = [
    {
      label: (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>A4 (1 por página)</span>
        </div>
      ),
      searchLabel: "A4 (1 por página)",
      value: "a4-full",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span>A4 2x2 (4 por página)</span>
        </div>
      ),
      searchLabel: "A4 2x2 (4 por página)",
      value: "a4-grid-2x2",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span>A4 2x4 (8 por página)</span>
        </div>
      ),
      searchLabel: "A4 2x4 (8 por página)",
      value: "a4-grid-2x4",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>A3 (1 por página)</span>
        </div>
      ),
      searchLabel: "A3 (1 por página)",
      value: "a3-full",
    },
  ];

  const selectedFormatLabel =
    formatOptions.find((option) => option.value === format)?.searchLabel ??
    "Selecione o formato";

  const getPdfDocument = () => {
    switch (format) {
      case "a3-full":
        return <A3FullPosterPdfDocument products={products} />;
      case "a4-grid-2x2":
        return <A4Grid2x2PosterPdfDocument products={products} />;
      case "a4-grid-2x4":
        return <A4Grid2x4PosterPdfDocument products={products} />;
      default:
        return <A4FullPosterPdfDocument products={products} />;
    }
  };

  const getPdfFileName = () =>
    `cartazes-${format}-${new Date().toISOString().slice(0, 10)}.pdf`;

  const pdfDocument = useMemo(() => getPdfDocument(), [format, products]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobilePreview(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!isMobilePreview || products.length === 0) {
      setMobilePreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return null;
      });
      return;
    }

    let cancelled = false;

    const generatePreview = async () => {
      setIsGeneratingMobilePreview(true);
      try {
        const blob = await pdf(pdfDocument).toBlob();
        const url = URL.createObjectURL(blob);

        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        setMobilePreviewUrl((previousUrl) => {
          if (previousUrl) {
            URL.revokeObjectURL(previousUrl);
          }
          return url;
        });
      } finally {
        if (!cancelled) {
          setIsGeneratingMobilePreview(false);
        }
      }
    };

    generatePreview();

    return () => {
      cancelled = true;
    };
  }, [isMobilePreview, pdfDocument, products.length]);

  const handlePrintPdf = async () => {
    if (isPrintingPdf || products.length === 0) {
      return;
    }

    setIsPrintingPdf(true);
    let previewWindow: Window | null = null;
    try {
      // Open window immediately to avoid popup blockers.
      previewWindow = window.open("", "_blank");
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);

      if (!previewWindow) {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      previewWindow.location.href = url;

      const triggerPrint = () => {
        try {
          previewWindow?.focus();
          previewWindow?.print();
        } catch {
          // If auto-print is blocked, user can still print manually in opened tab.
        }
      };

      previewWindow.onload = () => {
        setTimeout(triggerPrint, 400);
      };

      setTimeout(triggerPrint, 1400);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const openMobilePreview = () => {
    if (!mobilePreviewUrl) {
      return;
    }
    window.open(mobilePreviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex h-auto flex-col gap-2 md:h-[calc(100vh-4rem)] md:flex-row md:gap-4">
      <Card
        className="flex w-full flex-col gap-2 rounded-md px-2 md:w-1/3 md:max-w-[491px] md:shrink-0 md:gap-4 md:px-5"
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
          <Combobox
            className="mt-1.5 w-full"
            emptyMessage="Nenhum formato encontrado."
            onValueChange={(v) =>
              setFormat(
                v as "a4-full" | "a4-grid-2x4" | "a4-grid-2x2" | "a3-full"
              )
            }
            options={formatOptions}
            placeholder={selectedFormatLabel}
            searchPlaceholder="Buscar formato..."
            value={format}
          />
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
          <div className="flex-1 overflow-auto rounded-md border bg-background">
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
                    {p.isCompound ? (
                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <button
                          className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700 hover:bg-blue-200"
                          onClick={() => setCompoundDetailProduct(p)}
                          type="button"
                        >
                          <Boxes className="h-3 w-3" />
                          Composição ({p.compoundItemsCount ?? 0})
                        </button>
                      </div>
                    ) : null}
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
                  {p.isCompound &&
                  p.compoundTotalQuantity &&
                  p.compoundTotalQuantity > 0 ? (
                    <Button
                      className="h-6 px-2 text-[10px]"
                      onClick={() => toggleShowCompoundUnitInfo(p.internalId!)}
                      size="sm"
                      title="Mostrar informação de valor unitário da composição"
                      variant={p.showCompoundUnitInfo ? "secondary" : "ghost"}
                    >
                      INFO
                    </Button>
                  ) : null}
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

        <div className="grid gap-2">
          {products.length > 0 ? (
            <>
              <Button
                className="w-full gap-2"
                disabled={isPrintingPdf}
                onClick={handlePrintPdf}
              >
                <Printer className="h-4 w-4" />
                {isPrintingPdf ? "Gerando PDF..." : "Imprimir"}
              </Button>
              <PDFDownloadLink
                document={pdfDocument}
                fileName={getPdfFileName()}
              >
                {({ loading }) => (
                  <Button
                    className="w-full gap-2"
                    disabled={loading}
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                    {loading ? "Gerando PDF..." : "Baixar PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            </>
          ) : null}
        </div>
      </Card>

      {/* Área de Preview PDF */}
      <div className="flex-1 overflow-hidden rounded-md border bg-muted/20">
        {isMobilePreview ? (
          <div className="flex h-full flex-col gap-3 p-3">
            {/* <Button
                className="w-full"
                disabled={!mobilePreviewUrl || isGeneratingMobilePreview}
                onClick={openMobilePreview}
                variant="outline"
              >
                {isGeneratingMobilePreview
                  ? "Gerando preview..."
                  : "Abrir preview do PDF"}
              </Button> */}
            <div className="rounded-md border bg-background p-3 text-muted-foreground text-sm">
              No mobile, clique no botão imprimir, isso abrirá o preview em uma
              nova aba para visualizar e imprimir com maior compatibilidade.
            </div>
          </div>
        ) : products.length > 0 ? (
          <PDFViewer
            showToolbar
            style={{
              border: "none",
              height: "100%",
              minHeight: "calc(100vh - 7rem)",
              width: "100%",
            }}
          >
            {pdfDocument}
          </PDFViewer>
        ) : (
          <div className="flex h-full min-h-[480px] items-center justify-center text-muted-foreground text-sm">
            Selecione produtos para visualizar o PDF.
          </div>
        )}
      </div>

      <Dialog
        onOpenChange={(open) => !open && setCompoundDetailProduct(null)}
        open={!!compoundDetailProduct}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Itens da composição</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border p-2">
              <p className="font-semibold text-sm uppercase">
                {compoundDetailProduct?.name}
              </p>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
              {compoundDetailProduct?.compoundItems &&
              compoundDetailProduct.compoundItems.length > 0 ? (
                compoundDetailProduct.compoundItems.map((item, index) => (
                  <div
                    className="flex items-center justify-between rounded-sm bg-muted/40 px-2 py-1"
                    key={`${item.description}-${index}`}
                  >
                    <span className="mr-3 truncate text-sm">
                      {item.description}
                    </span>
                    <span className="font-semibold text-sm">
                      Qtd: {item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Não há itens de composição para este produto.
                </p>
              )}
            </div>
            {compoundDetailProduct?.compoundTotalQuantity ? (
              <p className="font-medium text-sm">
                Quantidade total da composição:{" "}
                {compoundDetailProduct.compoundTotalQuantity}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setCompoundDetailProduct(null)}
              variant="outline"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
