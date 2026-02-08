import type { Tenant } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure } from "../../index";
import { requirePermission } from "../../middleware/permissions";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";
import { hasCompleteDatabaseCredentials } from "../../utils/tenant-db-credentials";

/** Resultado da verificação de credenciais de banco do tenant */
export interface CheckDatabaseCredentialsResult {
  hasCredentials: boolean;
  message: string;
}

/** Usuário do banco gestor serializado (BigInt/Date convertidos para string) */
export interface GestorUserSerialized {
  [key: string]: string | number | null | boolean;
}

/** Resultado do teste de conexão e listagem de usuários do banco gestor */
export interface TestGestorConnectionResult {
  success: true;
  count: number;
  users: GestorUserSerialized[];
}

function serializeGestorUser(
  user: Record<string, unknown>
): GestorUserSerialized {
  const out: GestorUserSerialized = {};
  for (const [key, value] of Object.entries(user)) {
    if (value === null || value === undefined) {
      out[key] = null;
    } else if (typeof value === "bigint") {
      out[key] = value.toString();
    } else if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export const tenantDatabaseRouter = router({
  /**
   * Verificar se o tenant atual tem credenciais de banco de dados configuradas
   * Usado pelo guard no frontend para verificar acesso
   */
  checkDatabaseCredentials: tenantProcedure.query(
    ({ ctx }): CheckDatabaseCredentialsResult => {
      if (!ctx.tenant) {
        return {
          hasCredentials: false,
          message: "Cliente não encontrado",
        };
      }

      // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
      const hasCredentials = hasCompleteDatabaseCredentials(ctx.tenant as any);

      return {
        hasCredentials,
        message: hasCredentials
          ? "Credenciais configuradas"
          : "Credenciais não configuradas. Entre em contato com o administrador.",
      };
    }
  ),

  /**
   * Testar conexão e buscar usuários do banco gestor
   * Requer permissão DASHBOARD:READ
   */
  testGestorConnection: tenantProcedure
    .use(requirePermission("DASHBOARD", "READ"))
    .query(async ({ ctx }): Promise<TestGestorConnectionResult> => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      if (!hasCompleteDatabaseCredentials(ctx.tenant as Tenant)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Credenciais de banco de dados não configuradas",
        });
      }

      try {
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

        const users = await gestorPrisma.usuario.findMany({
          take: 50,
        });

        const serializedUsers: GestorUserSerialized[] = users.map(
          (user: Record<string, unknown>) => serializeGestorUser(user)
        );

        return {
          success: true,
          count: serializedUsers.length,
          users: serializedUsers,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao acessar banco de dados: ${errorMessage}`,
        });
      }
    }),
});
