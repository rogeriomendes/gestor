"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc, trpcClient } from "@/utils/trpc";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    name: string;
  };
}

interface SubscriptionEditFormProps {
  subscription: Subscription;
}

const updateSubscriptionSchema = z.object({
  planId: z.string().min(1, "Plano é obrigatório"),
  status: z.enum(["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED"]),
  expiresAt: z.string(),
  trialEndsAt: z.string(),
});

export function SubscriptionEditForm({
  subscription,
}: SubscriptionEditFormProps) {
  const queryClient = useQueryClient();

  const { data: availablePlans } = useQuery({
    ...trpc.admin.subscriptions.getAvailablePlans.queryOptions(),
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: (input: {
      subscriptionId: string;
      planId?: string;
      status?: SubscriptionStatus;
      expiresAt?: Date | null;
      trialEndsAt?: Date | null;
    }) => trpcClient.admin.subscriptions.update.mutate(input),
  });

  const form = useForm({
    defaultValues: {
      planId: subscription.planId,
      status: subscription.status,
      expiresAt: subscription.expiresAt
        ? format(new Date(subscription.expiresAt), "yyyy-MM-dd")
        : "",
      trialEndsAt: subscription.trialEndsAt
        ? format(new Date(subscription.trialEndsAt), "yyyy-MM-dd")
        : "",
    },
    validators: {
      onSubmit: updateSubscriptionSchema,
    },
    onSubmit: async ({ value }) => {
      await updateSubscriptionMutation.mutateAsync(
        {
          subscriptionId: subscription.id,
          planId: value.planId,
          status: value.status as SubscriptionStatus,
          expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
          trialEndsAt: value.trialEndsAt ? new Date(value.trialEndsAt) : null,
        },
        {
          onSuccess: () => {
            toast.success("Assinatura atualizada com sucesso!");
            queryClient.invalidateQueries({
              queryKey: ["admin", "subscriptions"],
            });
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
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Assinatura</CardTitle>
          <CardDescription>
            Altere o plano, status e datas da assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.Field name="planId">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Plano</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(value) => field.handleChange(value || "")}
                    value={field.state.value}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {availablePlans?.find((p) => p.id === field.state.value)
                          ?.name || "Selecione um plano"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                          {plan.isDefault && " (Padrão)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
                <FieldError>{field.state.meta.errors?.[0]?.message}</FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(value as SubscriptionStatus)
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {field.state.value === "TRIAL"
                          ? "Trial"
                          : field.state.value === "ACTIVE"
                            ? "Ativa"
                            : field.state.value === "EXPIRED"
                              ? "Expirada"
                              : field.state.value === "CANCELLED"
                                ? "Cancelada"
                                : "Selecione o status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRIAL">Trial</SelectItem>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="EXPIRED">Expirado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
                <FieldError>{field.state.meta.errors?.[0]?.message}</FieldError>
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="trialEndsAt">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Fim do Trial</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="date"
                      value={field.state.value || ""}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors?.[0]?.message}
                  </FieldError>
                </Field>
              )}
            </form.Field>

            <form.Field name="expiresAt">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Data de Expiração
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="date"
                      value={field.state.value || ""}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors?.[0]?.message}
                  </FieldError>
                </Field>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={updateSubscriptionMutation.isPending} type="submit">
          {updateSubscriptionMutation.isPending
            ? "Salvando..."
            : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
