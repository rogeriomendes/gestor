import { Oswald } from "next/font/google";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { PosterProduct } from "../types";

const oswald = Oswald({
  subsets: ["latin"],
});

export function QuarterPagePoster({
  product,
  showYellowBackground,
}: {
  product: PosterProduct;
  showYellowBackground: boolean;
}) {
  const [int, cents] = product.price.toFixed(2).split(".");
  const [originalInt, originalCents] = product.originalPrice
    .toFixed(2)
    .split(".");

  const hasPromo = product.qtdPromocao != null && product.qtdPromocao > 0;

  const isPack =
    hasPromo &&
    product.qtdPagar != null &&
    product.qtdPagar > 0 &&
    product.qtdPagar !== product.qtdPromocao;

  const isWholesale =
    hasPromo &&
    (!product.qtdPagar ||
      product.qtdPagar === product.qtdPromocao ||
      product.qtdPagar === 0);

  return (
    <div className="flex h-full flex-col border border-gray-300 border-dashed">
      {/* Header Vermelho */}
      <div className="relative flex h-[18%] items-center justify-center bg-[#E63946]">
        <h1
          className={cn(
            "rotate-[-2deg] text-5xl text-white drop-shadow-md",
            oswald.className
          )}
        >
          OFERTA
        </h1>
      </div>

      <div
        className={cn(
          "relative flex flex-1 flex-col items-center justify-between overflow-hidden p-4 text-center",
          showYellowBackground ? "bg-[#FFCB05]" : "bg-white"
        )}
      >
        {/* PROMO PACK */}
        {hasPromo ? (
          <div className="flex h-full w-full flex-1 flex-col justify-between">
            <div className="flex flex-1 items-center justify-center px-2">
              <h2
                className={cn(
                  "line-clamp-3 text-center text-4xl text-zinc-900 uppercase leading-tight",
                  oswald.className
                )}
              >
                {product.name}
              </h2>
            </div>

            {/* ORIGINAL + BADGES */}
            <div className="flex w-full items-start justify-between px-2 pt-1">
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-zinc-800">
                  Comprando 1 unidade:
                </span>
                <div className="flex items-start font-bold text-zinc-800">
                  <span className="mt-0.5 text-sm">R$</span>
                  <span className="text-4xl leading-none tracking-tighter">
                    {originalInt}
                  </span>
                  <div className="mt-0.5 flex flex-col">
                    <span className="items-start justify-start text-xl">
                      ,
                      <span className="underline decoration-2 underline-offset-2">
                        {originalCents}
                      </span>
                    </span>
                    <span className="ml-1 items-center justify-center text-xs text-zinc-800">
                      {product.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* PACK */}
              {isPack && (
                <div className="top-2 right-2 mr-8 rotate-[-2deg]">
                  <div className="rounded-full border-2 border-white bg-blue-600 px-3 py-1 text-center shadow-lg">
                    <div className="font-black text-lg text-white leading-tight">
                      LEVE {product.qtdPromocao}
                    </div>
                    <div className="font-black text-lg text-white leading-tight">
                      PAGUE {product.qtdPagar}
                    </div>
                  </div>
                </div>
              )}

              {/* ATACADO */}
              {isWholesale && (
                <div className="top-2 right-2 mr-8 rotate-[-2deg]">
                  <div className="rounded-lg border-2 border-white bg-green-600 px-3 py-1 text-center shadow-lg">
                    <div className="font-black text-lg text-white leading-tight">
                      A PARTIR DE
                    </div>
                    <div className="font-black text-lg text-white leading-tight">
                      {product.qtdPromocao} UN
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PREÇO FINAL */}
            <div
              className={cn(
                "mt-2 flex w-full items-center px-2",
                isPack ? "justify-between" : "justify-center"
              )}
            >
              {isPack && (
                <div className="flex max-w-[40%] flex-col text-left font-bold text-sm text-zinc-800 leading-tight">
                  <span>Comprando</span>
                  <span>{product.qtdPromocao} unidades,</span>
                  <span>cada 1 sai por:</span>
                </div>
              )}

              <div
                className={cn(
                  "flex items-start font-bold text-[#D00000]",
                  oswald.className
                )}
              >
                <span className="mt-3 text-3xl">R$</span>
                <span className="text-[8rem] leading-none tracking-tighter">
                  {int}
                </span>
                <div className="flex flex-col pt-3">
                  <span className="items-start justify-start text-4xl">
                    ,
                    <span className="underline decoration-2 underline-offset-2">
                      {cents}
                    </span>
                  </span>
                  <span className="mt-1 ml-1 items-center justify-center text-2xl text-zinc-800">
                    {product.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* STANDARD MODE */}
            <div className="relative z-10 flex w-full flex-1 items-center justify-center p-2">
              <h2
                className={cn(
                  "line-clamp-3 text-5xl text-zinc-900 uppercase leading-tight",
                  oswald.className
                )}
                style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}
              >
                {product.name}
              </h2>
            </div>

            <div className="relative z-10 mb-1">
              {product.showOriginalPrice && product.originalPrice && (
                <div className="mb-1 flex flex-col text-start font-bold text-red-700/80 text-xl decoration-red-700/80 opacity-80">
                  <span className="line-through decoration-2">
                    De {formatAsCurrency(product.originalPrice)}
                  </span>
                  <span className="">por</span>
                </div>
              )}

              <div
                className={cn(
                  "flex items-start justify-center font-bold text-[#D00000]",
                  oswald.className
                )}
              >
                <span className="mt-4 text-3xl">R$</span>
                <span className="text-[10rem] leading-none tracking-tighter">
                  {int}
                </span>
                <div className="flex flex-col pt-4">
                  <span className="items-start justify-start text-5xl">
                    ,
                    <span className="underline decoration-2 underline-offset-2">
                      {cents}
                    </span>
                  </span>
                  <span className="mt-1 ml-1 items-center justify-center text-3xl text-zinc-800">
                    {product.unit}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
