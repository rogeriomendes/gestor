"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import type { Route } from "next";
import { PosterBuilder } from "./_components/PosterBuilder";

export default function PostersPage() {
  return (
    <div className="h-full">
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
