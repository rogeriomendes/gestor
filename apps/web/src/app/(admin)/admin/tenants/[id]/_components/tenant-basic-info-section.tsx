"use client";

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

interface TenantBasicInfoSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

export function TenantBasicInfoSection({ form }: TenantBasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
        <CardDescription>Informações básicas do cliente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="name">
            {/* biome-ignore lint/suspicious/noExplicitAny: tipagem genérica do tanstack form neste componente de apresentação */}
            {(field: any) => (
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
            {/* biome-ignore lint/suspicious/noExplicitAny: tipagem genérica do tanstack form neste componente de apresentação */}
            {(field: any) => (
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
          {/* biome-ignore lint/suspicious/noExplicitAny: tipagem genérica do tanstack form neste componente de apresentação */}
          {(field: any) => (
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
      </CardContent>
    </Card>
  );
}
