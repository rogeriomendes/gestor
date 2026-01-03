"use client";

import type { UseFormReturn } from "@tanstack/react-form";
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
  form: UseFormReturn<
    {
      tenantId: string;
      name: string;
      slug: string;
      active: boolean;
      email: string;
      phone: string;
      website: string;
      notes: string;
    },
    unknown
  >;
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
      </CardContent>
    </Card>
  );
}
