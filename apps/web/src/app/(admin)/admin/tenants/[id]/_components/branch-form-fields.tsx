"use client";

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

interface BranchFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

export function BranchFormFields({ form }: BranchFormFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Informações Básicas</h3>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="name">
            {(field: any) => (
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
            {(field: any) => (
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
          {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
          {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
            {(field: any) => (
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
        {(field: any) => (
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
