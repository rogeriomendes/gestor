"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/utils/trpc";

const formSchema = z.object({
  host: z.string().min(1, "Host é obrigatório"),
  port: z.coerce.number().int().min(1).max(65_535).default(3306),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  enableDfe: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface DatabaseCredentialsFormProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function DatabaseCredentialsForm({
  tenantId,
  onSuccess,
}: DatabaseCredentialsFormProps) {
  const { data: credentials, isLoading: loadingCredentials } = useQuery({
    ...trpc.admin.databaseCredentials.getCredentials.queryOptions({
      tenantId,
    }),
  });

  const form = useForm<FormValues>({
    defaultValues: {
      host: "",
      port: 3306,
      username: "",
      password: "",
      enableDfe: false,
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate({
        tenantId,
        credentials: {
          host: value.host,
          port: value.port,
          username: value.username,
          password: value.password,
        },
        enableDfe: value.enableDfe,
      });
    },
    validators: {
      onChange: formSchema,
    },
  });

  // Atualizar form quando credenciais forem carregadas
  useEffect(() => {
    if (credentials?.mysql) {
      form.setFieldValue("host", credentials.mysql.host ?? "");
      form.setFieldValue("port", credentials.mysql.port ?? 3306);
      form.setFieldValue("username", credentials.mysql.username ?? "");
      form.setFieldValue("password", ""); // Não preencher senha por segurança
      form.setFieldValue("enableDfe", credentials.dfeEnabled ?? false);
    }
  }, [credentials, form]);

  const updateMutation = useMutation({
    ...trpc.admin.databaseCredentials.updateCredentials.mutationOptions(),
    onSuccess: () => {
      toast.success("Credenciais atualizadas com sucesso");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Erro ao atualizar credenciais");
    },
  });

  const testGestorMutation = useMutation({
    ...trpc.admin.databaseCredentials.testGestorConnection.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message ?? "Conexão bem-sucedida");
    },
    onError: (error) => {
      toast.error(error.message ?? "Erro ao testar conexão");
    },
  });

  const testDfeMutation = useMutation({
    ...trpc.admin.databaseCredentials.testDfeConnection.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message ?? "Conexão bem-sucedida");
    },
    onError: (error) => {
      toast.error(error.message ?? "Erro ao testar conexão");
    },
  });

  const handleTestGestor = () => {
    const state = form.state.values;
    testGestorMutation.mutate({
      credentials: {
        host: state.host,
        port: state.port,
        username: state.username,
        password: state.password,
      },
    });
  };

  const handleTestDfe = () => {
    const state = form.state.values;
    if (!state.enableDfe) {
      toast.error("db-dfe não está habilitado");
      return;
    }
    testDfeMutation.mutate({
      credentials: {
        host: state.host,
        port: state.port,
        username: state.username,
        password: state.password,
      },
    });
  };

  if (loadingCredentials) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="space-y-4">
        <form.Field name="host">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Host</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="localhost"
                  value={field.state.value}
                />
                <FieldDescription>Endereço do servidor MySQL</FieldDescription>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="port">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Porta</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  placeholder="3306"
                  type="number"
                  value={field.state.value}
                />
                <FieldDescription>
                  Porta do servidor MySQL (padrão: 3306)
                </FieldDescription>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="username">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Usuário</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="root"
                  value={field.state.value}
                />
                <FieldDescription>
                  Usuário do banco de dados MySQL
                </FieldDescription>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={
                    credentials?.mysql?.hasPassword
                      ? "••••••••"
                      : "Digite a senha"
                  }
                  type="password"
                  value={field.state.value}
                />
                <FieldDescription>
                  {credentials?.mysql?.hasPassword
                    ? "Deixe em branco para manter a senha atual"
                    : "Senha do banco de dados MySQL"}
                </FieldDescription>
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="enableDfe">
          {(field) => (
            <Field orientation="horizontal">
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor={field.name}>Habilitar db-dfe</FieldLabel>
                <FieldDescription>
                  Ativar banco de dados de documentos fiscais eletrônicos
                </FieldDescription>
              </div>
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

      <div className="flex flex-wrap gap-2">
        <Button disabled={updateMutation.isPending} type="submit">
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Salvar Credenciais
        </Button>

        <Button
          disabled={testGestorMutation.isPending}
          onClick={handleTestGestor}
          type="button"
          variant="outline"
        >
          {testGestorMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Testar db-gestor
        </Button>

        <form.Subscribe selector={(state) => state.values.enableDfe}>
          {(enableDfe) => (
            <Button
              disabled={testDfeMutation.isPending || !enableDfe}
              onClick={handleTestDfe}
              type="button"
              variant="outline"
            >
              {testDfeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Testar db-dfe
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
