"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-bold text-2xl">Área Administrativa</h2>
        <p className="text-muted-foreground text-sm">
          Gerencie todos os clientes do sistema
        </p>
      </div>
      <Link href="/admin/tenants">
        <Button>Gerenciar Clientes</Button>
      </Link>
    </div>
  );
}
