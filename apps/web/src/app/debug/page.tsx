"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/tenant-context";
import { useIsAdmin } from "@/lib/permissions";
import { trpc } from "@/utils/trpc";

export default function DebugPage() {
  const { tenant, role, isSuperAdmin, isTenantAdmin, isLoading } = useTenant();
  const isAdmin = useIsAdmin();

  const { data: contextData } = useQuery({
    ...trpc.debug.getMyContext.queryOptions(),
  });

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="font-bold text-2xl">Debug - Contexto do Usuário</h1>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Cliente Context (Frontend)</h2>
          <pre className="overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(
              {
                tenant,
                role,
                isSuperAdmin,
                isTenantAdmin,
                isLoading,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">API Context (Backend)</h2>
          <pre className="overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(contextData, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Hooks de Permissão</h2>
          <pre className="overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(
              {
                useIsAdmin: isAdmin,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
