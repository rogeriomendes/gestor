"use client";

import type { ReactNode } from "react";
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
import type { RouterInputs } from "@/utils/trpc";

type BranchFormValues = RouterInputs["admin"]["branch"]["createBranch"];

interface BranchFieldState<T> {
  meta: {
    errors: Array<{ message?: string }>;
  };
  value: T;
}

interface BranchFieldApi<T> {
  handleBlur: () => void;
  handleChange: (value: T) => void;
  name: string;
  state: BranchFieldState<T>;
}

interface BranchFormApi {
  Field: <TName extends keyof BranchFormValues>(props: {
    name: TName;
    children: (field: BranchFieldApi<BranchFormValues[TName]>) => ReactNode;
  }) => ReactNode;
}

interface BranchFormFieldsProps {
  form: BranchFormApi;
}

export function BranchFormFields({ form }: BranchFormFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Informações Básicas</h3>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Nome da Filial *</FieldLabel>
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
                <FieldLabel htmlFor={field.name}>Filial Principal</FieldLabel>
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
                <FieldLabel htmlFor={field.name}>CNPJ (14 dígitos)</FieldLabel>
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
    </>
  );
}
