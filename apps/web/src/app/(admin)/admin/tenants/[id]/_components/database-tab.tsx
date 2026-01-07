"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Database, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

import { DatabaseCredentialsForm } from "./database-credentials-form";

interface DatabaseTabProps {
  tenantId: string;
}

export function DatabaseTab({ tenantId }: DatabaseTabProps) {
  const { data: credentials, refetch } = useQuery({
    ...trpc.admin.databaseCredentials.getCredentials.queryOptions({
      tenantId,
    }),
  });

  const hasCredentials = !!credentials?.mysql;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status das Conexões
          </CardTitle>
          <CardDescription>
            Configuração dos bancos de dados MySQL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">db-gestor</p>
              <p className="text-muted-foreground text-sm">
                Banco de dados principal do gestor
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasCredentials ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600 text-sm">
                    Configurado
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600 text-sm">
                    Não configurado
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">db-dfe</p>
              <p className="text-muted-foreground text-sm">
                Banco de documentos fiscais eletrônicos
              </p>
            </div>
            <div className="flex items-center gap-2">
              {credentials?.dfeEnabled ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600 text-sm">
                    Habilitado
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-muted-foreground text-sm">
                    Desabilitado
                  </span>
                </>
              )}
            </div>
          </div>

          {hasCredentials && credentials?.mysql && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 font-medium text-sm">Informações da Conexão</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host:</span>
                  <span className="font-mono">{credentials.mysql.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Porta:</span>
                  <span className="font-mono">{credentials.mysql.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuário:</span>
                  <span className="font-mono">
                    {credentials.mysql.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bancos:</span>
                  <span className="font-mono">
                    gestor{credentials.dfeEnabled ? ", dfe" : ""}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Credenciais</CardTitle>
          <CardDescription>
            As mesmas credenciais são usadas para ambos os bancos (db-gestor e
            db-dfe). Os nomes dos bancos são definidos automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseCredentialsForm
            onSuccess={() => refetch()}
            tenantId={tenantId}
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-500/50 bg-blue-500/10">
        <CardHeader>
          <CardTitle className="text-blue-600 text-sm dark:text-blue-400">
            ℹ️ Informação Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • As credenciais são criptografadas antes de serem armazenadas no
            banco de dados
          </p>
          <p>
            • O banco{" "}
            <code className="rounded bg-blue-500/20 px-1">gestor</code> é
            obrigatório para o funcionamento da área do tenant
          </p>
          <p>
            • O banco <code className="rounded bg-blue-500/20 px-1">dfe</code> é
            opcional e pode ser habilitado/desabilitado conforme necessário
          </p>
          <p>
            • Teste as conexões antes de salvar para garantir que as credenciais
            estão corretas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
