"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { Button } from "@/components/ui/button";
import { trpcClient } from "@/utils/trpc";
import { TenantBasicInfoSection } from "./tenant-basic-info-section";
import { TenantContactInfoSection } from "./tenant-contact-info-section";
import { TenantNotesSection } from "./tenant-notes-section";

const updateTenantSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z
    .string()
    .min(1, "Slug é obrigatório")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens"
    ),
  active: z.boolean(),
  email: z
    .string()
    .refine((val) => val === "" || z.string().email().safeParse(val).success, {
      message: "Email inválido",
    }),
  phone: z.string(),
  website: z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "URL inválida",
    }),
  notes: z.string(),
  dbHost: z.string(),
  dbPort: z.string(),
  dbUsername: z.string(),
  dbPassword: z.string(),
});

interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  dbHost?: string | null;
  dbPort?: string | null;
  dbUsername?: string | null;
  dbPassword?: string | null;
  branches?: Array<{
    id: string;
    name: string;
    isMain: boolean;
  }>;
}

interface TenantDetailsFormProps {
  tenant: Tenant;
  onSuccess: () => void;
}

export function TenantDetailsForm({
  tenant,
  onSuccess,
}: TenantDetailsFormProps) {
  const router = useRouter();

  const updateTenantMutation = useMutation({
    mutationFn: (input: {
      tenantId: string;
      name?: string;
      slug?: string;
      active?: boolean;
      email?: string;
      phone?: string;
      website?: string;
      notes?: string;
      dbHost?: string;
      dbPort?: string;
      dbUsername?: string;
      dbPassword?: string;
    }) => trpcClient.admin.updateTenant.mutate(input),
  });

  const editForm = useForm({
    defaultValues: {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      active: tenant.active,
      email: tenant.email || "",
      phone: tenant.phone || "",
      website: tenant.website || "",
      notes: tenant.notes || "",
      dbHost: tenant.dbHost || "",
      dbPort: tenant.dbPort || "",
      dbUsername: tenant.dbUsername || "",
      dbPassword: tenant.dbPassword ? "••••••••" : "", // Não mostrar senha real
    },
    validators: {
      onSubmit: updateTenantSchema,
    },
    onSubmit: async ({ value }) => {
      // Transformar strings vazias em undefined para campos opcionais
      const updateData = {
        tenantId: value.tenantId,
        name: value.name,
        slug: value.slug,
        active: value.active,
        email:
          value.email && value.email.trim() !== "" ? value.email : undefined,
        phone:
          value.phone && value.phone.trim() !== "" ? value.phone : undefined,
        website:
          value.website && value.website.trim() !== ""
            ? value.website
            : undefined,
        notes:
          value.notes && value.notes.trim() !== "" ? value.notes : undefined,
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
          toast.success("Cliente atualizado com sucesso!");
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
      editForm.setFieldValue("name", tenant.name);
      editForm.setFieldValue("slug", tenant.slug);
      editForm.setFieldValue("active", tenant.active);
      editForm.setFieldValue("email", tenant.email || "");
      editForm.setFieldValue("phone", tenant.phone || "");
      editForm.setFieldValue("website", tenant.website || "");
      editForm.setFieldValue("notes", tenant.notes || "");
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
      <TenantBasicInfoSection form={editForm} />

      <TenantContactInfoSection form={editForm} />

      <TenantNotesSection form={editForm} />

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => router.push("/admin/tenants")}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <PermissionGuard action="UPDATE" resource="TENANT">
          <Button disabled={updateTenantMutation.isPending} type="submit">
            {updateTenantMutation.isPending
              ? "Salvando..."
              : "Salvar Alterações"}
          </Button>
        </PermissionGuard>
      </div>
    </form>
  );
}
