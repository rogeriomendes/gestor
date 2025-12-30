"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TenantNotFound() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-7xl p-6 text-center">
      <h1 className="mb-4 font-bold text-2xl">Tenant Não Encontrado</h1>
      <p className="text-muted-foreground">
        O tenant que você está procurando não existe.
      </p>
      <Button
        className="mt-4"
        onClick={() => router.push("/admin/tenants")}
        variant="outline"
      >
        Voltar para Tenants
      </Button>
    </div>
  );
}
