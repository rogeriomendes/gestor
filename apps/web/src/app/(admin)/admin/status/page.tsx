"use client";

import type { Route } from "next";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { ConnectionStats } from "./_components/connection-stats";
import { ConnectionsTable } from "./_components/connections-table";
import { ServerStatusCards } from "./_components/server-status-cards";

function StatusPageContent() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Status", isCurrent: true },
  ];
  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      subtitle="Status do servidor e gerenciamento de conexões de banco de dados"
      title="Status do Servidor"
    >
      <div className="space-y-6">
        {/* Cards de Status do Servidor */}
        <ServerStatusCards />

        {/* Estatísticas de Conexões */}
        <ConnectionStats />

        {/* Tabela de Conexões */}
        <ConnectionsTable />
      </div>
    </PageLayout>
  );
}

export default function StatusPage() {
  return (
    <AdminGuard>
      <StatusPageContent />
    </AdminGuard>
  );
}
