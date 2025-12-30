"use client";

import { AdminGuard } from "@/components/admin";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TenantForm } from "./_components/tenant-form";

function NewTenantPageContent() {
  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Tenants", href: "/admin/tenants" },
    { label: "Novo Tenant", isCurrent: true },
  ];

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />

      <div>
        <h2 className="font-bold text-2xl">Criar Novo Tenant</h2>
        <p className="text-muted-foreground text-sm">
          Preencha os dados para criar um novo tenant.
        </p>
      </div>

      <TenantForm />
    </div>
  );
}

export default function NewTenantPage() {
  return (
    <AdminGuard>
      <NewTenantPageContent />
    </AdminGuard>
  );
}
