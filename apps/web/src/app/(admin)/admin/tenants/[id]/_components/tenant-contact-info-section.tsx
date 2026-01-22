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

interface TenantContactInfoSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

export function TenantContactInfoSection({
  form,
}: TenantContactInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações de Contato</CardTitle>
        <CardDescription>Informações gerais de contato</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <form.Field name="website">
          {(field: any) => (
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
      </CardContent>
    </Card>
  );
}
