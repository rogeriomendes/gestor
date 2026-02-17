"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import {
  calculePercentage,
  calculePercentageBetweenValues,
  formatAsCurrency,
} from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  type IDetectedBarcode,
  Scanner,
  useDevices,
} from "@yudiel/react-qr-scanner";
import {
  GroupIcon,
  PackageIcon,
  ScaleIcon,
  ScanBarcodeIcon,
  SquarePercentIcon,
} from "lucide-react";
import type { Route } from "next";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { DetailProducts } from "./_components/DetailProducts";
import { ProductGrid } from "./_components/ProductGrid";

type ProductData =
  RouterOutputs["tenant"]["products"]["all"]["products"][number];

export default function ProductsList() {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [group, setGroup] = useQueryState("group", { defaultValue: "0" });
  const [scale, setScale] = useQueryState("scale", { defaultValue: "T" });
  const [promotion, setPromotion] = useQueryState("promotion", {
    defaultValue: "T",
  });

  // Estados para controlar o modal de detalhes
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [stopScan, setStopScan] = useState(true);
  const devices = useDevices();

  const enabled = !!tenant;

  const productsQuery = useInfiniteQuery({
    ...trpc.tenant.products.all.infiniteQueryOptions({
      limit: 20,
      searchTerm: search,
      group: group !== "0" ? Number(group) : undefined,
      scale: scale !== "T" ? scale : undefined,
      promotion: promotion !== "T" ? promotion : undefined,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  });

  const groupQuery = useQuery({
    ...trpc.tenant.group.all.queryOptions(),
    enabled,
  });

  const groupOptions: ComboboxOption[] = [
    { value: "0", label: "TODOS" },
    ...(groupQuery.data?.group?.map(
      (item: { ID: number; NOME: string | null }) => ({
        value: String(item.ID),
        label: item.NOME ?? "",
      })
    ) ?? []),
  ];

  const scaleOptions: ComboboxOption[] = [
    { value: "T", label: "TODOS" },
    { value: "S", label: "SIM" },
    { value: "N", label: "NÃO" },
  ];

  const promotionOptions: ComboboxOption[] = [
    { value: "T", label: "TODOS" },
    { value: "S", label: "ATIVA" },
    { value: "N", label: "INATIVA" },
  ];

  function handleOnScan(detectedCodes: IDetectedBarcode[]) {
    void setSearch(detectedCodes?.[0]?.rawValue || "");
    setStopScan(true);
    setOpen(false);
  }

  function custoFinal(
    valuePurchase: number | null,
    ValueFreight: number | null,
    ValueIcmsSt: number | null,
    ValueIpi: number | null,
    ValueOtherTaxes: number | null,
    ValueOthersValues: number | null
  ) {
    const valorCompra = Number(valuePurchase);

    const frete = calculePercentage(valorCompra, Number(ValueFreight));
    const icmsST = calculePercentage(valorCompra, Number(ValueIcmsSt));
    const ipi = calculePercentage(valorCompra, Number(ValueIpi));
    const outrosImpostos = calculePercentage(
      valorCompra,
      Number(ValueOtherTaxes)
    );
    const outrosValores = calculePercentage(
      valorCompra,
      Number(ValueOthersValues)
    );
    const totalImpostos = frete + icmsST + ipi + outrosImpostos + outrosValores;

    const custoFinal = valorCompra + totalImpostos;

    return custoFinal;
  }

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Produtos", href: "/products" as Route, isCurrent: true },
        { label: "Cadastrados", isCurrent: true },
      ]}
      subtitle="Consulte o cadastro de produtos"
      title="Produtos"
    >
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex flex-row gap-2">
          <SearchInput
            className="w-full flex-1 md:w-96"
            enableF9Shortcut
            onChange={(v: string) => void setSearch(v)}
            placeholder="Pesquisar por produtos"
            value={search}
          />
          <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger
              className="md:hidden"
              render={<Button size="icon" variant="default" />}
            >
              <ScanBarcodeIcon className="size-5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ler código de barras</DialogTitle>
              </DialogHeader>
              <Select
                defaultValue={deviceId}
                onValueChange={(value) => setDeviceId(value ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>Selecione a câmera</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device, index) => (
                    <SelectItem key={index} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Scanner
                components={{
                  torch: true,
                  zoom: true,
                  finder: true,
                }}
                constraints={{
                  deviceId,
                }}
                formats={["ean_8", "ean_13"]}
                onError={(_error) => {
                  // console.log(`onError: ${error}'`);
                  toast.error("Erro ao ler codigo de barras");
                }}
                onScan={handleOnScan}
                paused={!stopScan}
                scanDelay={2000}
                sound={true}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
          <Combobox
            className="flex-1 md:w-48"
            icon={<GroupIcon />}
            onValueChange={setGroup}
            options={groupOptions}
            placeholder="Grupos"
            searchPlaceholder="Buscar grupos..."
            value={group}
          />
        </div>
        <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
          <Combobox
            className="flex-1 md:w-48"
            icon={<ScaleIcon />}
            onValueChange={setScale}
            options={scaleOptions}
            placeholder="Balança"
            searchPlaceholder="Buscar balança..."
            value={scale}
          />
          <Combobox
            className="flex-1 md:w-48"
            icon={<SquarePercentIcon />}
            onValueChange={setPromotion}
            options={promotionOptions}
            placeholder="Promoção"
            searchPlaceholder="Buscar promoção..."
            value={promotion}
          />
        </div>
      </div>
      {isMobile ? (
        <ProductGrid
          data={productsQuery.data?.pages}
          emptyIcon={<PackageIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontrados produtos."
          fetchNextPage={productsQuery.fetchNextPage}
          hasNextPage={productsQuery.hasNextPage}
          isFetchingNextPage={productsQuery.isFetchingNextPage}
          isLoading={productsQuery.isLoading}
          loadingMessage="Carregando produtos..."
          loadMoreMessage="Carregar mais produtos"
          noMoreDataMessage="Não há mais produtos para carregar"
          onProductClick={(product: ProductData) => {
            setSelectedProductId(product.ID);
            setIsModalOpen(true);
          }}
          pageItemKeys={["products"]}
        />
      ) : (
        <DataTableInfinite<ProductData>
          data={productsQuery.data?.pages}
          emptyIcon={<PackageIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados Produtos."
          fetchNextPage={productsQuery.fetchNextPage}
          getRowKey={(product) => product.ID}
          hasNextPage={productsQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            {
              key: "codigo",
              label: "Cód. int.",
              className: "hidden sm:table-cell",
            },
            { key: "gtin", label: "GTIN", className: "hidden sm:table-cell" },
            { key: "nome", label: "Nome", className: "text-left" },
            { key: "unidade", label: "UN", className: "hidden sm:table-cell" },
            { key: "custo", label: "Custo Final", className: "text-right" },
            { key: "markup", label: "Markup", className: "text-center" },
            { key: "venda", label: "Vlr. Venda", className: "text-left" },
            {
              key: "data",
              label: "Alteração",
              className: "hidden sm:table-cell",
            },
          ]}
          isFetchingNextPage={productsQuery.isFetchingNextPage}
          isLoading={productsQuery.isLoading}
          loadingMessage="Carregando mais produtos..."
          loadMoreMessage="Carregar mais produtos"
          noMoreDataMessage="Não há mais produtos para carregar"
          onRowClick={(product) => {
            setSelectedProductId(product.ID);
            setIsModalOpen(true);
          }}
          pageItemKeys={["products"]}
          renderRow={(product, _index) => {
            // Verificar se o produto existe
            if (!product) {
              return null;
            }

            // Aplicar filtro de busca
            if (search) {
              const matchesSearch =
                product.CODIGO_INTERNO?.toString().includes(search) ||
                product.GTIN?.toString().includes(search) ||
                product.NOME?.toString().includes(search.toUpperCase());
              if (!matchesSearch) {
                return null;
              }
            }

            return [
              "",
              product.CODIGO_INTERNO,
              product.GTIN,
              <div className="flex items-center gap-2">
                {product.activePromotion && (
                  <SquarePercentIcon
                    aria-label="Promoção ativa"
                    className="size-4 text-orange-700 dark:text-orange-300"
                  />
                )}
                <span>{product.NOME}</span>
              </div>,
              product.unidade_produto.SIGLA,
              formatAsCurrency(
                custoFinal(
                  product.VALOR_COMPRA != null
                    ? Number(product.VALOR_COMPRA)
                    : null,
                  product.FRETE != null ? Number(product.FRETE) : null,
                  product.ICMS_ST != null ? Number(product.ICMS_ST) : null,
                  product.IPI != null ? Number(product.IPI) : null,
                  product.OUTROSVALORES != null
                    ? Number(product.OUTROSVALORES)
                    : null,
                  product.OUTROSIMPOSTOS != null
                    ? Number(product.OUTROSIMPOSTOS)
                    : null
                )
              ),
              calculePercentageBetweenValues(
                custoFinal(
                  product.VALOR_COMPRA != null
                    ? Number(product.VALOR_COMPRA)
                    : null,
                  product.FRETE != null ? Number(product.FRETE) : null,
                  product.ICMS_ST != null ? Number(product.ICMS_ST) : null,
                  product.IPI != null ? Number(product.IPI) : null,
                  product.OUTROSVALORES != null
                    ? Number(product.OUTROSVALORES)
                    : null,
                  product.OUTROSIMPOSTOS != null
                    ? Number(product.OUTROSIMPOSTOS)
                    : null
                ),
                Number(product.VALOR_VENDA),
                true
              ),
              <span className="text-primary">
                {formatAsCurrency(Number(product.VALOR_VENDA))}
              </span>,
              product.DATA_ALTERACAO && formatDate(product.DATA_ALTERACAO),
            ];
          }}
        />
      )}

      {/* Modal de detalhes do produto */}
      {selectedProductId && (
        <DetailProducts
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedProductId(null);
            }
          }}
          open={isModalOpen}
          productId={selectedProductId}
        />
      )}
    </PageLayout>
  );
}
