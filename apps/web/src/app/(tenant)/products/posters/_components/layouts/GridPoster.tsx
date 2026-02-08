import { Oswald } from "next/font/google";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { PosterProduct } from "../types";

const oswald = Oswald({
  subsets: ["latin"],
});

export function GridPoster({
  product,
  showYellowBackground,
}: {
  product: PosterProduct;
  showYellowBackground: boolean;
}) {
  const [int, cents] = product.price.toFixed(2).split(".");

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
    <div className="flex h-full flex-col border-[0.5px] border-gray-300 border-dashed">
      <div className="flex h-[20%] items-center justify-center bg-[#E63946]">
        <h1
          className={cn("rotate-[-2deg] text-3xl text-white", oswald.className)}
        >
          OFERTA
        </h1>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-between px-4 py-2 text-center text-zinc-900",
          showYellowBackground ? "bg-[#FFCB05]" : "bg-white"
        )}
      >
        <div className="flex w-full flex-1 flex-col items-center justify-center overflow-hidden">
          {/* 1. Name */}
          <h2
            className={cn(
              "text-center leading-none",
              oswald.className,
              hasPromo
                ? "mb-6 line-clamp-2 text-3xl"
                : "my-auto line-clamp-4 text-4xl"
            )}
          >
            {product.name}
          </h2>

          {/* 2. Info Row: Original + Badges */}
          <div className="flex w-full items-start justify-between px-1">
            {/* Original Price */}
            {hasPromo && (
              <div className="flex flex-col text-left leading-none">
                <span className="font-bold text-[0.6rem] text-zinc-800">
                  Comprando 1 unidade:
                </span>
                <span
                  className={cn(
                    "font-bold text-xs text-zinc-800",
                    !hasPromo && "line-through"
                  )}
                >
                  {formatAsCurrency(product.originalPrice)}
                </span>
              </div>
            )}

            {product.showOriginalPrice && product.originalPrice && (
              <div className="mb-2 flex flex-col text-start font-bold text-[0.7rem] text-red-700/80 decoration-red-700/80 opacity-80">
                <span className="line-through decoration-4">
                  De {formatAsCurrency(product.originalPrice)}
                </span>
                <span className="">por</span>
              </div>
            )}

            {/* Badges (Right aligned, stacked if needed) */}
            <div className="mt-2 mr-16 flex rotate-[-2deg] flex-col items-end">
              {isPack && (
                <div className="rounded-sm bg-blue-600 px-2 py-0.5 font-bold text-[0.6rem] text-white">
                  LEVE {product.qtdPromocao} PAGUE {product.qtdPagar}
                </div>
              )}
              {isWholesale && (
                <div className="rounded-sm bg-green-600 px-2 py-0.5 font-bold text-[0.6rem] text-white">
                  A PARTIR DE {product.qtdPromocao} UN
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 3. Price */}
        <div
          className={cn(
            "mt-5 flex w-full items-center px-5",
            oswald.className,
            isPack ? "justify-between" : "justify-center"
          )}
        >
          {isPack && (
            <div className="flex max-w-[40%] flex-col text-left text-[0.7rem] text-zinc-800 leading-none">
              <span>Comprando</span>
              <span>{product.qtdPromocao} unidades,</span>
              <span>cada 1 sai por:</span>
            </div>
          )}

          <div className="mb-2 flex items-start font-bold text-[#D00000]">
            <span className="mt-2 text-sm">R$</span>
            <span className="text-6xl leading-none tracking-tighter">
              {int}
            </span>
            <div className="flex flex-col">
              <span className="text-2xl underline decoration-2 underline-offset-2">
                ,{cents}
              </span>
              <span className="ml-3 self-start font-normal text-xs text-zinc-800 leading-none">
                {product.unit}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
