"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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

const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  active: z.boolean().default(true),
  legalName: z.string().optional(),
  cnpj: z
    .string()
    .regex(/^\d{14}$/, "CNPJ must contain exactly 14 digits")
    .optional()
    .or(z.literal("")),
  email: z.email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.url("Invalid URL").optional().or(z.literal("")),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressDistrict: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().max(2, "State must be 2 characters (UF)").optional(),
  addressZipCode: z
    .string()
    .regex(/^\d{8}$/, "CEP must contain exactly 8 digits")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export function TenantForm() {
  const router = useRouter();

  const createTenantMutation = useMutation({
    mutationFn: (input: {
      name: string;
      slug: string;
      active: boolean;
      email?: string;
      phone?: string;
      website?: string;
      notes?: string;
      // Campos para criar a primeira filial (matriz)
      legalName?: string;
      cnpj?: string;
      addressStreet?: string;
      addressNumber?: string;
      addressComplement?: string;
      addressDistrict?: string;
      addressCity?: string;
      addressState?: string;
      addressZipCode?: string;
    }) => trpcClient.admin.createTenant.mutate(input),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      active: true,
      email: "",
      phone: "",
      website: "",
      notes: "",
      // Campos para criar a primeira filial (matriz)
      legalName: "",
      cnpj: "",
      addressStreet: "",
      addressNumber: "",
      addressComplement: "",
      addressDistrict: "",
      addressCity: "",
      addressState: "",
      addressZipCode: "",
    },
    validators: {
      onSubmit: createTenantSchema,
    },
    onSubmit: async ({ value }) => {
      await createTenantMutation.mutateAsync(value, {
        onSuccess: (tenant) => {
          toast.success("Cliente criado com sucesso!");
          router.push(`/admin/tenants/${tenant.id}`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* Basic Information */}
      <div className="space-y-4 rounded-lg border p-6">
        <h3 className="font-semibold text-lg">Dados Básicos</h3>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="name">
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
          </form.Field>

          <form.Field name="slug">
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
          </form.Field>
        </div>

        <form.Field name="active">
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
        </form.Field>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 rounded-lg border p-6">
        <h3 className="font-semibold text-lg">Informações de Contato</h3>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="email">
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
          </form.Field>

          <form.Field name="phone">
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
          </form.Field>
        </div>

        <form.Field name="website">
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
        </form.Field>
      </div>

      {/* First Branch (Matriz) Information */}
      <div className="space-y-4 rounded-lg border p-6">
        <div>
          <h3 className="font-semibold text-lg">
            Dados da Filial Principal (Matriz)
          </h3>
          <p className="text-muted-foreground text-sm">
            Estes dados serão usados para criar a primeira filial (matriz) do
            cliente. Você poderá adicionar mais filiais depois.
          </p>
        </div>
        <div className="space-y-4">
          <form.Field name="legalName">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Razão Social</FieldLabel>
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
          </form.Field>

          <form.Field name="cnpj">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  CNPJ (apenas números)
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    maxLength={14}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.handleChange(value);
                    }}
                    placeholder="00000000000000"
                    value={field.state.value}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 rounded-lg border p-6">
        <h3 className="font-semibold text-lg">Endereço</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <form.Field name="addressStreet">
              {(field) => (
                <Field className="col-span-2">
                  <FieldLabel htmlFor={field.name}>Rua</FieldLabel>
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
            </form.Field>

            <form.Field name="addressNumber">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Número</FieldLabel>
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
            </form.Field>
          </div>

          <form.Field name="addressComplement">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Complemento</FieldLabel>
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
          </form.Field>

          <form.Field name="addressDistrict">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Bairro</FieldLabel>
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
          </form.Field>

          <div className="grid grid-cols-3 gap-4">
            <form.Field name="addressCity">
              {(field) => (
                <Field className="col-span-2">
                  <FieldLabel htmlFor={field.name}>Cidade</FieldLabel>
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
            </form.Field>

            <form.Field name="addressState">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>UF</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      maxLength={2}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.value.toUpperCase())
                      }
                      placeholder="SP"
                      value={field.state.value}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="addressZipCode">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  CEP (apenas números)
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    maxLength={8}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.handleChange(value);
                    }}
                    placeholder="00000000"
                    value={field.state.value}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4 rounded-lg border p-6">
        <h3 className="font-semibold text-lg">Observações</h3>
        <form.Field name="notes">
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
        </form.Field>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => router.push("/admin/tenants")}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={createTenantMutation.isPending} type="submit">
          {createTenantMutation.isPending ? "Criando..." : "Criar Cliente"}
        </Button>
      </div>
    </form>
  );
}
