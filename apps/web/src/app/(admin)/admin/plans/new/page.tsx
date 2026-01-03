"use client";

import type { Route } from "next";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { PlanForm } from "./_components/plan-form";

function NewPlanPageContent() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Planos", href: "/admin/plans" as Route },
    { label: "Novo Plano", isCurrent: true },
  ];

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      subtitle="Defina os limites e funcionalidades do novo plano"
      title="Criar Novo Plano"
    >
      <PlanForm />
    </PageLayout>
  );
}

export default function NewPlanPage() {
  return (
    <AdminGuard>
      <NewPlanPageContent />
    </AdminGuard>
  );
}
