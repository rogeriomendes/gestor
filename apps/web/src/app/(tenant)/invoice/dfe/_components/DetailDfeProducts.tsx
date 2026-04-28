import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatAsCurrency } from "@/lib/utils";
import type { NFeInfo, ProdutoDetalhe } from "./DetailDfe";

function fmtMoney(value?: string): string {
  if (!value) {
    return "—";
  }
  return formatAsCurrency(Number(value));
}

function fmtQuantidade(value?: string): string {
  if (!value) {
    return "—";
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return "—";
  }
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
}

function ProductDfeDetail({ item }: { item: ProdutoDetalhe }) {
  const { prod, infAdProd } = item;

  return (
    <div className="mt-2 rounded-md border bg-muted/20 p-2 text-xs md:text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">Código:</span>{" "}
          <span>{prod.cProd || "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">GTIN:</span>{" "}
          <span>{prod.cEAN || "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">NCM / CEST:</span>{" "}
          <span>
            {prod.NCM || "—"} / {prod.CEST || "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">CFOP / EX TIPI:</span>{" "}
          <span>
            {prod.CFOP || "—"} / {prod.EXTIPI || "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Quantidade:</span>{" "}
          <span>{fmtQuantidade(prod.qCom)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Unidade:</span>{" "}
          <span>{prod.uCom || "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Valor unitário:</span>{" "}
          <span>{fmtMoney(prod.vUnCom)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Valor total:</span>{" "}
          <span>{fmtMoney(prod.vProd)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Frete:</span>{" "}
          <span>{fmtMoney(prod.vFrete)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Desconto:</span>{" "}
          <span>{fmtMoney(prod.vDesc)}</span>
        </div>

        {infAdProd && (
          <div className="col-span-2 border-t pt-2">
            <span className="text-muted-foreground">
              Informações adicionais:
            </span>
            <p className="wrap-break-word mt-0.5 whitespace-pre-wrap">
              {infAdProd}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DetailDfeProducts({ xml }: { xml: NFeInfo }) {
  const [openedProductIndex, setOpenedProductIndex] = useState<number | null>(
    null
  );
  const products: ProdutoDetalhe[] = Array.isArray(xml.det)
    ? xml.det
    : [xml.det];

  return (
    <div className="space-y-3">
      <Card
        className="rounded-md data-[size=sm]:py-1 data-[size=sm]:md:py-2"
        size="sm"
      >
        <CardContent className="group-data-[size=sm]/card:px-1 group-data-[size=sm]/card:md:px-2">
          {products.map((item, index) => (
            <div
              className="group rounded-md p-2 transition-colors hover:bg-muted/50"
              key={index}
            >
              <button
                className="w-full cursor-pointer text-left"
                onClick={() =>
                  setOpenedProductIndex((current) =>
                    current === index ? null : index
                  )
                }
                type="button"
              >
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-xs leading-none md:text-sm">
                      {item.prod.xProd}
                    </p>
                    <div className="flex gap-2 text-muted-foreground text-xs md:text-sm">
                      <div className="flex items-center">
                        {fmtQuantidade(item.prod.qCom)} {item.prod.uCom}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-col items-center text-xs md:text-sm">
                        {fmtMoney(item.prod.vProd)}
                      </div>
                      <div className="flex flex-col items-center text-muted-foreground text-xs md:text-sm">
                        {fmtMoney(item.prod.vUnCom)} {item.prod.uCom}
                      </div>
                    </div>
                    {openedProductIndex === index ? (
                      <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
              {openedProductIndex === index && <ProductDfeDetail item={item} />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
