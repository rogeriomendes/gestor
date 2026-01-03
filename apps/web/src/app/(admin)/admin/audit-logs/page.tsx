"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { trpc } from "@/utils/trpc";
import { AuditLogDetailsDialog } from "./_components/audit-log-details-dialog";
import { AuditLogsFilters } from "./_components/audit-logs-filters";
import { AuditLogsList } from "./_components/audit-logs-list";

function AuditLogsPageContent() {
  const [page, setPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedResourceType, setSelectedResourceType] =
    useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    ...trpc.audit.listLogs.queryOptions({
      page,
      limit: 20,
      ...(selectedAction !== "all" && {
        action: selectedAction as
          | "CREATE_TENANT"
          | "UPDATE_TENANT"
          | "DELETE_TENANT"
          | "RESTORE_TENANT"
          | "CREATE_USER"
          | "UPDATE_USER"
          | "UPDATE_USER_ROLE"
          | "REMOVE_USER"
          | "INVITE_USER"
          | "CREATE_BRANCH"
          | "UPDATE_BRANCH"
          | "DELETE_BRANCH"
          | "RESTORE_BRANCH"
          | "UPDATE_PERMISSIONS"
          | "INITIALIZE_PERMISSIONS"
          | "CREATE_PLAN"
          | "UPDATE_PLAN"
          | "DELETE_PLAN"
          | "ACTIVATE_PLAN"
          | "DEACTIVATE_PLAN"
          | "CREATE_SUBSCRIPTION"
          | "UPDATE_SUBSCRIPTION"
          | "CANCEL_SUBSCRIPTION",
      }),
      ...(selectedResourceType !== "all" && {
        resourceType: selectedResourceType as
          | "TENANT"
          | "USER"
          | "TENANT_USER"
          | "BRANCH"
          | "PERMISSION"
          | "PLAN"
          | "SUBSCRIPTION",
      }),
      ...(selectedTenant !== "all" && { tenantId: selectedTenant }),
      ...(selectedUser !== "all" && { userId: selectedUser }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    }),
  });

  const { data: tenantsData } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  const { data: usersData } = useQuery({
    ...trpc.admin.listAllUsers.queryOptions({ page: 1, limit: 100 }),
  });

  const { data: logDetails, isLoading: isLoadingDetails } = useQuery({
    ...trpc.audit.getLog.queryOptions({ logId: selectedLog || "" }),
    enabled: !!selectedLog,
  });

  const logs = logsData?.data || [];
  const pagination = logsData?.pagination;
  const tenants = tenantsData?.data || [];
  const users = usersData?.data || [];

  const handleResetFilters = () => {
    setSelectedAction("all");
    setSelectedResourceType("all");
    setSelectedTenant("all");
    setSelectedUser("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Logs de Auditoria" },
      ]}
      subtitle="Histórico completo de todas as ações realizadas no sistema"
      title="Logs de Auditoria"
    >
      <AuditLogsFilters
        endDate={endDate}
        onActionChange={setSelectedAction}
        onEndDateChange={setEndDate}
        onResetFilters={handleResetFilters}
        onResourceTypeChange={setSelectedResourceType}
        onStartDateChange={setStartDate}
        onTenantChange={setSelectedTenant}
        onUserChange={setSelectedUser}
        selectedAction={selectedAction}
        selectedResourceType={selectedResourceType}
        selectedTenant={selectedTenant}
        selectedUser={selectedUser}
        startDate={startDate}
        tenants={tenants}
        users={users}
      />

      <AuditLogsList
        isLoading={isLoadingLogs}
        logs={logs}
        onLogClick={setSelectedLog}
        onPageChange={setPage}
        pagination={pagination}
      />

      <AuditLogDetailsDialog
        isLoading={isLoadingDetails}
        logDetails={logDetails}
        onOpenChange={(open: boolean) => !open && setSelectedLog(null)}
        open={!!selectedLog}
      />
    </PageLayout>
  );
}

export default function AuditLogsPage() {
  return (
    <AdminGuard>
      <AuditLogsPageContent />
    </AdminGuard>
  );
}
