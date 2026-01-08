"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { trpcClient } from "@/utils/trpc";
import { TenantDatabaseConfigSection } from "./tenant-database-config-section";

const updateTenantDatabaseSchema = z.object({
  tenantId: z.string(),
  dbHost: z.string(),
  dbPort: z.string(),
  dbUsername: z.string(),
  dbPassword: z.string(),
});

interface Tenant {
  id: string;
  dbHost?: string | null;
  dbPort?: string | null;
  dbUsername?: string | null;
  dbPassword?: string | null;
}

interface TenantDatabaseTabProps {
  tenant: Tenant;
  onSuccess: () => void;
}

export function TenantDatabaseTab({
  tenant,
  onSuccess,
}: TenantDatabaseTabProps) {
  const updateTenantMutation = useMutation({
    mutationFn: (input: {
      tenantId: string;
      dbHost?: string;
      dbPort?: string;
      dbUsername?: string;
      dbPassword?: string;
    }) => trpcClient.admin.updateTenant.mutate(input),
  });

  const editForm = useForm({
    defaultValues: {
      tenantId: tenant.id,
      dbHost: tenant.dbHost || "",
      dbPort: tenant.dbPort || "",
      dbUsername: tenant.dbUsername || "",
      dbPassword: tenant.dbPassword ? "••••••••" : "", // Não mostrar senha real
    },
    validators: {
      onSubmit: updateTenantDatabaseSchema,
    },
    onSubmit: async ({ value }) => {
      // Transformar strings vazias em undefined para campos opcionais
      const updateData = {
        tenantId: value.tenantId,
        dbHost:
          value.dbHost && value.dbHost.trim() !== "" ? value.dbHost : undefined,
        dbPort:
          value.dbPort && value.dbPort.trim() !== "" ? value.dbPort : undefined,
        dbUsername:
          value.dbUsername && value.dbUsername.trim() !== ""
            ? value.dbUsername
            : undefined,
        // Só enviar senha se não for o placeholder
        dbPassword:
          value.dbPassword &&
          value.dbPassword.trim() !== "" &&
          value.dbPassword !== "••••••••"
            ? value.dbPassword
            : undefined,
      };

      await updateTenantMutation.mutateAsync(updateData, {
        onSuccess: () => {
          toast.success(
            "Credenciais de banco de dados atualizadas com sucesso!"
          );
          onSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    },
  });

  useEffect(() => {
    if (tenant && editForm.state.values.tenantId !== tenant.id) {
      editForm.setFieldValue("tenantId", tenant.id);
      editForm.setFieldValue("dbHost", tenant.dbHost || "");
      editForm.setFieldValue("dbPort", tenant.dbPort || "");
      editForm.setFieldValue("dbUsername", tenant.dbUsername || "");
      editForm.setFieldValue("dbPassword", tenant.dbPassword ? "••••••••" : "");
    }
  }, [tenant, editForm]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        editForm.handleSubmit();
      }}
    >
      <TenantDatabaseConfigSection form={editForm} tenantId={tenant.id} />

      {/* Actions */}
      {/* <div className="flex justify-end gap-4">
        <Button disabled={updateTenantMutation.isPending} type="submit">
          {updateTenantMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div> */}
    </form>
  );
}
