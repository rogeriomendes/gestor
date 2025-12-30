"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpcClient } from "@/utils/trpc";

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
});

type Tenant = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  branches?: Array<{
    id: string;
    name: string;
    isMain: boolean;
  }>;
};

type TenantDetailsFormProps = {
  tenant: Tenant;
  onSuccess: () => void;
};

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
      };

      await updateTenantMutation.mutateAsync(updateData, {
        onSuccess: () => {
          toast.success("Tenant atualizado com sucesso!");
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
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Informações básicas do tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <editForm.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Nome Fantasia *</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </editForm.Field>

            <editForm.Field name="slug">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Slug *</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </editForm.Field>
          </div>

          <editForm.Field name="active">
            {(field) => (
              <Field orientation="horizontal">
                <FieldLabel htmlFor={field.name}>Ativo</FieldLabel>
                <FieldContent>
                  <Switch
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={field.handleChange}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </editForm.Field>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
          <CardDescription>Informações gerais de contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <editForm.Field name="email">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="email"
                      value={field.state.value}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </editForm.Field>

            <editForm.Field name="phone">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Telefone</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </editForm.Field>
          </div>

          <editForm.Field name="website">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Website</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://example.com"
                    type="url"
                    value={field.state.value}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </editForm.Field>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
          <CardDescription>
            Observações adicionais sobre este tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <editForm.Field name="notes">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Observações</FieldLabel>
                <FieldContent>
                  <Textarea
                    className="h-32"
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={5}
                    value={field.state.value}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </editForm.Field>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => router.push("/admin/tenants")}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button disabled={updateTenantMutation.isPending} type="submit">
          {updateTenantMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
