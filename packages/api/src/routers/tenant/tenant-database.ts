import { TRPCError } from "@trpc/server";

import { router, tenantProcedure } from "../../index";
import { requirePermission } from "../../middleware/permissions";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";
import { hasCompleteDatabaseCredentials } from "../../utils/tenant-db-credentials";

export const tenantDatabaseRouter = router({
  /**
   * Verificar se o tenant atual tem credenciais de banco de dados configuradas
   * Usado pelo guard no frontend para verificar acesso
   */
  checkDatabaseCredentials: tenantProcedure.query(({ ctx }) => {
    if (!ctx.tenant) {
      return {
        hasCredentials: false,
        message: "Cliente não encontrado",
      };
    }

    const hasCredentials = hasCompleteDatabaseCredentials(ctx.tenant as any);

    return {
      hasCredentials,
      message: hasCredentials
        ? "Credenciais configuradas"
        : "Credenciais não configuradas. Entre em contato com o administrador.",
    };
  }),

  /**
   * Testar conexão e buscar usuários do banco gestor
   * Requer permissão DASHBOARD:READ
   */
  testGestorConnection: tenantProcedure
    .use(requirePermission("DASHBOARD", "READ"))
    .query(async ({ ctx }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      if (!hasCompleteDatabaseCredentials(ctx.tenant as any)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Credenciais de banco de dados não configuradas",
        });
      }

      try {
        // Obter Prisma Client do banco gestor
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        // Tentar buscar usuários - como não temos o schema ainda, vamos usar uma query raw
        // Assumindo que existe uma tabela 'usuario'
        const users = await gestorPrisma.usuario.findMany({
          take: 50,
        });

        return {
          success: true,
          count: users.length,
          users: users.map((user: Record<string, unknown>) => {
            // Converter para objeto simples removendo valores complexos
            const simpleUser: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(user)) {
              // Converter BigInt, Date, etc. para valores simples
              if (typeof value === "bigint") {
                simpleUser[key] = value.toString();
              } else if (value instanceof Date) {
                simpleUser[key] = value.toISOString();
              } else if (value === null || value === undefined) {
                simpleUser[key] = null;
              } else {
                simpleUser[key] = value;
              }
            }
            return simpleUser;
          }),
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
