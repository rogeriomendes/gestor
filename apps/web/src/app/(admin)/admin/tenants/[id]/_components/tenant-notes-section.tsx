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
import { Textarea } from "@/components/ui/textarea";

interface TenantNotesSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

export function TenantNotesSection({ form }: TenantNotesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Observações</CardTitle>
        <CardDescription>
          Observações adicionais sobre este cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.Field name="notes">
          {/* biome-ignore lint/suspicious/noExplicitAny: tipagem genérica do tanstack form neste componente de apresentação */}
          {(field: any) => (
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
      </CardContent>
    </Card>
  );
}
