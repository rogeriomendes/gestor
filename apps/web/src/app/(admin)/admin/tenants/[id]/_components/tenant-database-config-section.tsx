"use client";

import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, TestTube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { trpcClient } from "@/utils/trpc";

interface TenantDatabaseConfigSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  tenantId: string;
}

export function TenantDatabaseConfigSection({
  form,
  tenantId,
}: TenantDatabaseConfigSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    gestor?: { success: boolean };
    dfe?: { success: boolean };
  } | null>(null);

  const updateTenantMutation = useMutation({
    mutationFn: (input: {
      tenantId: string;
      dbHost?: string;
      dbPort?: string;
      dbUsername?: string;
      dbPassword?: string;
    }) => trpcClient.admin.updateTenant.mutate(input),
  });

  const testConnectionMutation = useMutation({
    mutationFn: (input: {
      tenantId?: string;
      dbHost?: string;
      dbPort?: string;
      dbUsername?: string;
      dbPassword?: string;
    }) => trpcClient.admin.testDatabaseConnection.mutate(input),
    onSuccess: async (data) => {
      setTestResult(data);
      if (data.success) {
        toast.success("Conexão testada com sucesso! Salvando credenciais...");

        // Se o teste foi bem-sucedido, salvar automaticamente as credenciais
        const values = form.state.values;
        try {
          await updateTenantMutation.mutateAsync({
            tenantId,
            dbHost: values.dbHost?.trim() || undefined,
            dbPort: values.dbPort?.trim() || undefined,
            dbUsername: values.dbUsername?.trim() || undefined,
            dbPassword: values.dbPassword?.trim() || undefined,
          });
          toast.success("Credenciais salvas com sucesso!");
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao salvar credenciais"
          );
        }
      } else {
        toast.error(
          ("error" in data ? data.error : undefined) || "Erro ao testar conexão"
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao testar conexão");
      setTestResult({
        success: false,
        error: error.message,
      });
    },
  });

  const handleTestConnection = () => {
    const values = form.state.values;
    testConnectionMutation.mutate({
      tenantId,
      dbHost: values.dbHost || undefined,
      dbPort: values.dbPort || undefined,
      dbUsername: values.dbUsername || undefined,
      dbPassword: values.dbPassword || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Banco de Dados</CardTitle>
        <CardDescription>
          Credenciais para o banco de dados MySQL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informação sobre os bancos */}
        {/* <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Bancos configurados:</p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>
                  <strong>Gestor:</strong> bussolla_db
                </li>
                <li>
                  <strong>DFE:</strong> opytex_db_dfe
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert> */}

        {/* Campos de credenciais */}
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="dbHost">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Host *</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="localhost ou IP do servidor"
                    value={field.state.value}
                  />
                  <FieldError errors={field.state.meta.errors || []} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="dbPort">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Porta *</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="3306"
                    type="number"
                    value={field.state.value}
                  />
                  <FieldError errors={field.state.meta.errors || []} />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="dbUsername">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Username *</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="usuário MySQL"
                    value={field.state.value}
                  />
                  <FieldError errors={field.state.meta.errors || []} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="dbPassword">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="senha MySQL"
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <Button
                      className="absolute top-0 right-0 h-full px-3"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPassword(!showPassword);
                      }}
                      type="button"
                      variant="ghost"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FieldError errors={field.state.meta.errors || []} />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </div>

        {/* Botão de teste de conexão */}
        <div className="flex justify-end">
          <Button
            disabled={
              testConnectionMutation.isPending || updateTenantMutation.isPending
            }
            onClick={handleTestConnection}
            type="button"
            variant="outline"
          >
            <TestTube className="mr-2 h-4 w-4" />
            {testConnectionMutation.isPending || updateTenantMutation.isPending
              ? "Testando e salvando..."
              : "Testar e Salvar"}
          </Button>
        </div>

        {/* Resultado do teste */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertDescription>
              {testResult.success ? (
                <div>
                  <p className="font-medium">Conexão testada com sucesso!</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {testResult.gestor && (
                      <p>
                        <strong>Gestor (bussolla_db):</strong>{" "}
                        {testResult.gestor.success ? "✓ Conectado" : "✗ Erro"}
                      </p>
                    )}
                    {testResult.dfe && (
                      <p>
                        <strong>DFE (opytex_db_dfe):</strong>{" "}
                        {testResult.dfe.success ? "✓ Conectado" : "✗ Erro"}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p>
                  <strong>Erro ao testar conexão:</strong> {testResult.error}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
