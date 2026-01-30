"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpcClient } from "@/utils/trpc";

const createPlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string(),
  price: z.number().min(0, "Valor deve ser maior ou igual a zero"),
  active: z.boolean(),
  isDefault: z.boolean(),
});

interface PlanFormProps {
  onCancel?: () => void;
  onSuccess?: (plan: { id: string }) => void;
}

export function PlanForm({ onCancel, onSuccess }: PlanFormProps) {
  const createPlanMutation = useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      price: number;
      active: boolean;
      isDefault: boolean;
    }) => trpcClient.admin.plans.create.mutate(input),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      active: true,
      isDefault: false,
    },
    validators: {
      onSubmit: createPlanSchema,
    },
    onSubmit: async ({ value }) => {
      await createPlanMutation.mutateAsync(
        {
          ...value,
          description: value.description || undefined,
        },
        {
          onSuccess: (plan) => {
            toast.success("Plano criado com sucesso!");
            onSuccess?.(plan);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
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
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Defina o nome e descrição do plano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Nome do Plano *</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Ex: Básico, Premium, Enterprise"
                    value={field.state.value}
                  />
                </FieldContent>
                <FieldError>{field.state.meta.errors?.[0]?.message}</FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Descrição</FieldLabel>
                <FieldContent>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Descreva os benefícios deste plano..."
                    rows={3}
                    value={field.state.value}
                  />
                </FieldContent>
                <FieldError>{field.state.meta.errors?.[0]?.message}</FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="price">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Valor Mensal (R$)</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    min={0}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={field.state.value || ""}
                  />
                </FieldContent>
                <FieldError>{field.state.meta.errors?.[0]?.message}</FieldError>
              </Field>
            )}
          </form.Field>

          <div className="flex items-center gap-6">
            <form.Field name="active">
              {(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <label
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    htmlFor={field.name}
                  >
                    Plano ativo
                  </label>
                </div>
              )}
            </form.Field>

            <form.Field name="isDefault">
              {(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <label
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    htmlFor={field.name}
                  >
                    Plano padrão (para novos clientes)
                  </label>
                </div>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} type="button" variant="outline">
          Cancelar
        </Button>
        <Button disabled={createPlanMutation.isPending} type="submit">
          {createPlanMutation.isPending ? "Criando..." : "Criar Plano"}
        </Button>
      </div>
    </form>
  );
}
