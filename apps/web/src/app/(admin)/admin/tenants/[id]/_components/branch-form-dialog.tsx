"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc, trpcClient } from "@/utils/trpc";

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isMain: z.boolean(),
  legalName: z.string(),
  cnpj: z
    .string()
    .regex(/^\d{14}$/, "CNPJ must contain exactly 14 digits")
    .or(z.literal("")),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string(),
  addressStreet: z.string(),
  addressNumber: z.string(),
  addressComplement: z.string(),
  addressDistrict: z.string(),
  addressCity: z.string(),
  addressState: z.string().max(2, "State must be 2 characters (UF)"),
  addressZipCode: z
    .string()
    .regex(/^\d{8}$/, "CEP must contain exactly 8 digits")
    .or(z.literal("")),
  notes: z.string(),
  active: z.boolean(),
});

interface BranchFormDialogProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  branchId?: string | null;
}

export function BranchFormDialog({
  open,
  onClose,
  tenantId,
  branchId,
}: BranchFormDialogProps) {
  const isEditing = !!branchId;

  const { data: branch, isLoading: branchLoading } = useQuery({
    ...trpc.admin.branch.getBranch.queryOptions({ branchId: branchId ?? "" }),
    enabled: isEditing && !!branchId,
  });

  const createBranchMutation = useMutation({
    mutationFn: (input: z.infer<typeof branchSchema>) =>
      trpcClient.admin.branch.createBranch.mutate({
        tenantId,
        ...input,
      }),
  });

  const updateBranchMutation = useMutation({
    mutationFn: (input: z.infer<typeof branchSchema>) =>
      trpcClient.admin.branch.updateBranch.mutate({
        branchId: branchId ?? "",
        ...input,
      }),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      isMain: false,
      legalName: "",
      cnpj: "",
      email: "",
      phone: "",
      addressStreet: "",
      addressNumber: "",
      addressComplement: "",
      addressDistrict: "",
      addressCity: "",
      addressState: "",
      addressZipCode: "",
      notes: "",
      active: true,
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = branchSchema.safeParse(value);
        if (!result.success) {
          const fieldErrors: Record<string, string[]> = {};
          for (const error of result.error.issues) {
            const path = error.path.join(".");
            if (!fieldErrors[path]) {
              fieldErrors[path] = [];
            }
            fieldErrors[path].push(error.message);
          }
          return fieldErrors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditing) {
          await updateBranchMutation.mutateAsync(
            value as z.infer<typeof branchSchema>
          );
          toast.success("Filial atualizada com sucesso!");
        } else {
          await createBranchMutation.mutateAsync(
            value as z.infer<typeof branchSchema>
          );
          toast.success("Filial criada com sucesso!");
        }
        onClose();
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao salvar filial"
        );
      }
    },
  });

  // Função para preencher os campos do formulário com os dados da filial
  const populateFormFields = useCallback(
    (branchData: typeof branch) => {
      if (!branchData) {
        return;
      }

      form.setFieldValue("name", branchData.name);
      form.setFieldValue("isMain", branchData.isMain);
      form.setFieldValue("legalName", branchData.legalName || "");
      form.setFieldValue("cnpj", branchData.cnpj || "");
      form.setFieldValue("email", branchData.email || "");
      form.setFieldValue("phone", branchData.phone || "");
      form.setFieldValue("addressStreet", branchData.addressStreet || "");
      form.setFieldValue("addressNumber", branchData.addressNumber || "");
      form.setFieldValue(
        "addressComplement",
        branchData.addressComplement || ""
      );
      form.setFieldValue("addressDistrict", branchData.addressDistrict || "");
      form.setFieldValue("addressCity", branchData.addressCity || "");
      form.setFieldValue("addressState", branchData.addressState || "");
      form.setFieldValue("addressZipCode", branchData.addressZipCode || "");
      form.setFieldValue("notes", branchData.notes || "");
      form.setFieldValue("active", branchData.active);
    },
    [form]
  );

  // Carregar dados da filial quando estiver editando
  useEffect(() => {
    if (!isEditing) {
      form.reset();
      return;
    }

    populateFormFields(branch);
  }, [branch, isEditing, form, populateFormFields]);

  const isLoading =
    branchLoading ||
    createBranchMutation.isPending ||
    updateBranchMutation.isPending;

  return (
    <Credenza onOpenChange={onClose} open={open}>
      <CredenzaContent className="max-h-[90vh] max-w-3xl">
        <CredenzaHeader>
          <CredenzaTitle>
            {isEditing ? "Editar Filial" : "Nova Filial"}
          </CredenzaTitle>
          <CredenzaDescription>
            {isEditing
              ? "Atualize as informações da filial"
              : "Preencha os dados da nova filial"}
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="name">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Nome da Filial *
                      </FieldLabel>
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

                <form.Field name="isMain">
                  {(field) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor={field.name}>
                        Filial Principal
                      </FieldLabel>
                      <FieldContent>
                        <FieldDescription>
                          Marque se esta é a matriz/filial principal
                        </FieldDescription>
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

              <form.Field name="active">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor={field.name}>Ativa</FieldLabel>
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

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dados da Empresa</h3>
              <div className="grid grid-cols-2 gap-4">
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
                        CNPJ (14 dígitos)
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
                          value={field.state.value}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

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
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Endereço</h3>
              <form.Field name="addressStreet">
                {(field) => (
                  <Field>
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

              <div className="grid grid-cols-3 gap-4">
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

                <form.Field name="addressZipCode">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>CEP</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          maxLength={8}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            field.handleChange(value);
                          }}
                          value={field.state.value}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
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

                <form.Field name="addressCity">
                  {(field) => (
                    <Field>
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
                      <FieldLabel htmlFor={field.name}>Estado (UF)</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          maxLength={2}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(e.target.value.toUpperCase())
                          }
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
            <form.Field name="notes">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Observações</FieldLabel>
                  <FieldContent>
                    <Textarea
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

            <CredenzaFooter>
              <Button onClick={onClose} type="button" variant="outline">
                Cancelar
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading && "Salvando..."}
                {isEditing ? "Atualizar" : "Criar"}
              </Button>
            </CredenzaFooter>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
