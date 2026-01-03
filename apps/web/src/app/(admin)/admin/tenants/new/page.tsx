"use client";

import type { Route } from "next";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { TenantForm } from "./_components/tenant-form";

function NewTenantPageContent() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Clientes", href: "/admin/tenants" as Route },
    { label: "Novo Cliente", isCurrent: true },
  ];

  return (
    <PageLayout
      backHref="/admin/tenants"
      breadcrumbs={breadcrumbs}
      showBackButton={true}
      subtitle="Preencha os dados para criar um novo cliente"
      title="Criar Novo Cliente"
    >
      <TenantForm />
    </PageLayout>
  );
}

export default function NewTenantPage() {
  return (
    <AdminGuard>
      <NewTenantPageContent />
    </AdminGuard>
  );
}
