"use client";

import { cn } from "@/lib/utils";
import { A3PagePoster } from "./layouts/A3PagePoster";
import { FullPagePoster } from "./layouts/FullPagePoster";
import { GridPoster } from "./layouts/GridPoster";
import { QuarterPagePoster } from "./layouts/QuarterPagePoster";
import type { PosterProduct } from "./types";

// Re-export type if needed or use from types.ts
export type { PosterProduct };

interface PosterPreviewProps {
  products: PosterProduct[];
  format: "a4-full" | "a4-grid-2x4" | "a4-grid-2x2" | "a3-full";
  showYellowBackground: boolean;
}

export function PosterPreview({
  products,
  format,
  showYellowBackground,
}: PosterPreviewProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-[297mm] w-[210mm] items-center justify-center border-2 border-gray-300 border-dashed bg-gray-50 text-gray-400 text-xl">
        Nenhum produto selecionado
      </div>
    );
  }

  return (
    <div className="print:m-0" id="print-area">
      {/* A3 FULL PAGE */}
      {format === "a3-full" &&
        products.map((product, index) => (
          <div
            className={cn(
              "mb-8 h-[420mm] w-[297mm] items-center justify-center overflow-hidden bg-white shadow-lg print:mb-0 print:h-[413mm] print:w-[297mm] print:shadow-none",
              index < products.length - 1
                ? "page-break-after-always break-after-page"
                : ""
            )}
            key={product.internalId || product.id}
          >
            <A3PagePoster
              product={product}
              showYellowBackground={showYellowBackground}
            />
          </div>
        ))}

      {/* FULL PAGE */}
      {format === "a4-full" &&
        products.map((product, index) => (
          <div
            className={cn(
              "mb-8 h-[290mm] w-[210mm] items-center justify-center overflow-hidden bg-white shadow-lg print:mb-0 print:h-[290mm] print:w-[210mm] print:shadow-none",
              index < products.length - 1
                ? "page-break-after-always break-after-page"
                : ""
            )}
            key={product.internalId || product.id}
          >
            <FullPagePoster
              product={product}
              showYellowBackground={showYellowBackground}
            />
          </div>
        ))}

      {/* GRID 2x4 (Landscape Cells basically) */}
      {format === "a4-grid-2x4" &&
        Array.from({ length: Math.ceil(products.length / 8) }).map(
          (_, pageIndex) => (
            <div
              className="mb-8 h-[290mm] w-[210mm] items-center justify-center overflow-hidden bg-white shadow-lg print:mb-0 print:h-[290mm] print:w-[210mm] print:shadow-none"
              key={pageIndex}
              style={{
                pageBreakAfter:
                  pageIndex < Math.ceil(products.length / 8) - 1
                    ? "always"
                    : "auto",
              }}
            >
              <div className="grid h-full grid-cols-2 grid-rows-4">
                {products
                  .slice(pageIndex * 8, (pageIndex + 1) * 8)
                  .map((product) => (
                    <div
                      className="relative overflow-hidden border border-gray-200 border-dashed"
                      key={product.internalId || product.id}
                    >
                      <GridPoster
                        product={product}
                        showYellowBackground={showYellowBackground}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )
        )}

      {/* NEW: GRID 2x2 (Quarter Page - Portrait Cells) */}
      {format === "a4-grid-2x2" &&
        Array.from({ length: Math.ceil(products.length / 4) }).map(
          (_, pageIndex) => (
            <div
              className="mb-8 h-[290mm] w-[210mm] items-center justify-center overflow-hidden bg-white shadow-lg print:mb-0 print:h-[290mm] print:w-[210mm] print:shadow-none"
              key={pageIndex}
              style={{
                pageBreakAfter:
                  pageIndex < Math.ceil(products.length / 4) - 1
                    ? "always"
                    : "auto",
              }}
            >
              <div className="grid h-full grid-cols-2 grid-rows-2">
                {products
                  .slice(pageIndex * 4, (pageIndex + 1) * 4)
                  .map((product) => (
                    <div
                      className="relative overflow-hidden border border-gray-200 border-dashed"
                      key={product.internalId || product.id}
                    >
                      <QuarterPagePoster
                        product={product}
                        showYellowBackground={showYellowBackground}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )
        )}
    </div>
  );
}
