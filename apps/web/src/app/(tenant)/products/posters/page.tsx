"use client";

import type { Route } from "next";
import { PageLayout } from "@/components/layouts/page-layout";
import { PosterBuilder } from "./_components/PosterBuilder";

export default function PostersPage() {
  return (
    <div className="h-full">
      {/* 
        Escondemos o layout padrão na impressão através de CSS global ou classes print:hidden nos componentes de layout pai.
        Mas como PageLayout provavelmente tem header/sidebar, precisamos garantir que isso suma na impressão.
        O PageLayout geralmente aceita className ou similar, ou precisaremos de um div wrapper.
      */}
      <style global jsx>{`
        @page {
          size: auto;
          margin: 0mm;
        }
        @media print {
          nav, aside, header, footer, .no-print, .page-header {
            display: none !important;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Resetar margens do layout principal */
          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>

      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" as Route },
          { label: "Produtos", href: "/products" as Route },
          { label: "Cartazes", isCurrent: true },
        ]}
        subtitle="Imprima cartazes promocionais para seus produtos"
        title="Gerador de Cartazes"
      >
        <PosterBuilder />
      </PageLayout>
    </div>
  );
}
