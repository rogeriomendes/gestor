import { Oswald } from "next/font/google";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { PosterProduct } from "../types";

const oswald = Oswald({
  subsets: ["latin"],
});

export function FullPagePoster({
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
    <div className="flex h-full flex-col bg-white">
      {/* Header Vermelho */}
      <div className="relative flex h-[18%] items-center justify-center bg-[#E63946]">
        <h1
          className={cn(
            "rotate-[-2deg] text-9xl text-white drop-shadow-md",
            oswald.className
          )}
        >
          OFERTA
        </h1>
      </div>

      <div
        className={cn(
          "relative flex flex-1 flex-col items-center justify-between overflow-hidden p-10 text-center",
          showYellowBackground ? "bg-[#FFCB05]" : "bg-white"
        )}
      >
        {/* PROMO PACK */}
        {hasPromo ? (
          <div className="flex h-full w-full flex-1 flex-col justify-between">
            <div className="flex flex-1 items-center justify-center px-4">
              <h2
                className={cn(
                  "line-clamp-3 text-center text-7xl text-zinc-900 uppercase leading-tight",
                  oswald.className
                )}
              >
                {product.name}
              </h2>
            </div>

            {/* ORIGINAL + BADGES */}
            <div className="flex w-full items-start justify-between px-4 pt-2">
              <div className="flex flex-col items-start">
                <span className="font-bold text-2xl text-zinc-800">
                  Comprando 1 unidade:
                </span>
                <div className="flex items-start font-bold text-zinc-800">
                  <span className="mt-1 text-2xl">R$</span>
                  <span className="text-8xl leading-none tracking-tighter">
                    {originalInt}
                  </span>
                  <div className="mt-1 flex flex-col">
                    <span className="items-start justify-start text-4xl">
                      ,
                      <span className="underline decoration-4 underline-offset-4">
                        {originalCents}
                      </span>
                    </span>
                    <span className="mt-1 ml-2 items-center justify-center text-1xl text-zinc-800">
                      {product.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* PACK */}
              {isPack && (
                <div className="top-4 right-4 mr-16 rotate-[-2deg]">
                  <div className="rounded-full border-4 border-white bg-blue-600 px-6 py-2 text-center shadow-lg">
                    <div className="font-black text-3xl text-white leading-tight">
                      LEVE {product.qtdPromocao}
                    </div>
                    <div className="font-black text-3xl text-white leading-tight">
                      PAGUE {product.qtdPagar}
                    </div>
                  </div>
                </div>
              )}

              {/* ATACADO */}
              {isWholesale && (
                <div className="top-4 right-4 mr-16 rotate-[-2deg]">
                  <div className="rounded-lg border-4 border-white bg-green-600 px-6 py-2 text-center shadow-lg">
                    <div className="font-black text-3xl text-white leading-tight">
                      A PARTIR DE
                    </div>
                    <div className="font-black text-3xl text-white leading-tight">
                      {product.qtdPromocao} UN
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PREÇO FINAL */}
            <div
              className={cn(
                "mt-5 flex w-full items-center px-5",
                isPack ? "justify-between" : "justify-center"
              )}
            >
              {isPack && (
                <div className="flex max-w-[40%] flex-col text-left font-bold text-2xl text-zinc-800 leading-tight">
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
                <span className="mt-6 text-6xl">R$</span>
                <span className="text-[16rem] leading-none tracking-tighter">
                  {int}
                </span>
                <div className="flex flex-col pt-6">
                  <span className="items-start justify-start text-8xl">
                    ,
                    <span className="underline decoration-4 underline-offset-4">
                      {cents}
                    </span>
                  </span>
                  <span className="mt-2 ml-2 items-center justify-center text-5xl text-zinc-800">
                    {product.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* STANDARD MODE */}
            <div className="relative z-10 flex w-full flex-1 items-center justify-center p-4">
              <h2
                className={cn(
                  "line-clamp-3 text-8xl text-zinc-900 uppercase leading-tight",
                  oswald.className
                )}
                style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.1)" }}
              >
                {product.name}
              </h2>
            </div>

            <div className="relative z-10 mb-2">
              {product.showOriginalPrice && product.originalPrice && (
                <div className="mb-2 flex flex-col text-start font-bold text-4xl text-red-700/80 decoration-red-700/80 opacity-80">
                  <span className="line-through decoration-4">
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
                <span className="mt-9 text-6xl">R$</span>
                <span className="text-[22rem] leading-none tracking-tighter">
                  {int}
                </span>
                <div className="flex flex-col pt-8">
                  <span className="items-start justify-start text-9xl">
                    ,
                    <span className="underline decoration-4 underline-offset-4">
                      {cents}
                    </span>
                  </span>
                  <span className="mt-2 ml-8 items-center justify-center text-6xl text-zinc-800">
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
