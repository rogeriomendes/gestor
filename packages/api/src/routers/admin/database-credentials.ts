import prisma, { decryptCredential, encryptCredential } from "@gestor/db";
import { AuditAction, AuditResourceType } from "@gestor/db/types";
import { DfeClient } from "@gestor/db-dfe/client";
import { GestorClient } from "@gestor/db-gestor/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../index";
import { requirePermission } from "../../middleware/permissions";
import { createAuditLogFromContext } from "../../utils/audit-log";

const dbCredentialsSchema = z.object({
  host: z.string().min(1, "Host é obrigatório"),
  port: z.number().int().min(1).max(65_535).default(3306),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const databaseCredentialsRouter = router({
  // Atualizar credenciais MySQL (usadas para ambos db-gestor e db-dfe)
  updateCredentials: adminProcedure
    .use(requirePermission("TENANT", "UPDATE"))
    .input(
      z.object({
        tenantId: z.string(),
        credentials: dbCredentialsSchema,
        enableDfe: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      const encryptedPassword = encryptCredential(input.credentials.password);

      await prisma.tenant.update({
        where: { id: input.tenantId },
        data: {
          dbMysqlHost: input.credentials.host,
          dbMysqlPort: input.credentials.port,
          dbMysqlUsername: input.credentials.username,
          dbMysqlPassword: encryptedPassword,
          ...(input.enableDfe !== undefined && {
            dbDfeEnabled: input.enableDfe,
          }),
        },
      });

      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_TENANT,
          resourceType: AuditResourceType.TENANT,
          resourceId: tenant.id,
          metadata: {
            action: "update_mysql_credentials",
            host: input.credentials.host,
            port: input.credentials.port,
            dfeEnabled: input.enableDfe,
          },
        },
        ctx
      );

      return { success: true };
    }),

  // Alternar habilitação do db-dfe
  toggleDfe: adminProcedure
    .use(requirePermission("TENANT", "UPDATE"))
    .input(
      z.object({
        tenantId: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      await prisma.tenant.update({
        where: { id: input.tenantId },
        data: {
          dbDfeEnabled: input.enabled,
        },
      });

      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_TENANT,
          resourceType: AuditResourceType.TENANT,
          resourceId: tenant.id,
          metadata: {
            action: "toggle_dfe",
            enabled: input.enabled,
          },
        },
        ctx
      );

      return { success: true };
    }),

  // Testar conexão com db-gestor
  testGestorConnection: adminProcedure
    .use(requirePermission("TENANT", "READ"))
    .input(
      z.object({
        tenantId: z.string().optional(),
        credentials: dbCredentialsSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      let credentials = input.credentials;

      if (!credentials && input.tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: input.tenantId },
          select: {
            dbMysqlHost: true,
            dbMysqlPort: true,
            dbMysqlUsername: true,
            dbMysqlPassword: true,
          },
        });

        if (!tenant?.dbMysqlPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhuma credencial configurada",
          });
        }

        credentials = {
          host: tenant.dbMysqlHost ?? "",
          port: tenant.dbMysqlPort ?? 3306,
          username: tenant.dbMysqlUsername ?? "",
          password: decryptCredential(tenant.dbMysqlPassword),
        };
      }

      if (!credentials) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Credenciais são obrigatórias",
        });
      }

      try {
        const adapter = new PrismaMariaDb({
          host: credentials.host,
          port: credentials.port,
          user: credentials.username,
          password: credentials.password,
          database: "bussolla_db",
        });

        const client = new GestorClient({ adapter });

        await client.$connect();
        await client.$disconnect();

        return { success: true, message: "Conexão bem-sucedida com db-gestor" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha na conexão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  // Testar conexão com db-dfe
  testDfeConnection: adminProcedure
    .use(requirePermission("TENANT", "READ"))
    .input(
      z.object({
        tenantId: z.string().optional(),
        credentials: dbCredentialsSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      let credentials = input.credentials;

      if (!credentials && input.tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: input.tenantId },
          select: {
            dbMysqlHost: true,
            dbMysqlPort: true,
            dbMysqlUsername: true,
            dbMysqlPassword: true,
            dbDfeEnabled: true,
          },
        });

        if (!tenant?.dbDfeEnabled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "db-dfe não está habilitado para este tenant",
          });
        }

        if (!tenant?.dbMysqlPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhuma credencial configurada",
          });
        }

        credentials = {
          host: tenant.dbMysqlHost ?? "",
          port: tenant.dbMysqlPort ?? 3306,
          username: tenant.dbMysqlUsername ?? "",
          password: decryptCredential(tenant.dbMysqlPassword),
        };
      }

      if (!credentials) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Credenciais são obrigatórias",
        });
      }

      try {
        const adapter = new PrismaMariaDb({
          host: credentials.host,
          port: credentials.port,
          user: credentials.username,
          password: credentials.password,
          database: "opytex_db_dfe",
        });

        const client = new DfeClient({ adapter });

        await client.$connect();
        await client.$disconnect();

        return { success: true, message: "Conexão bem-sucedida com db-dfe" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha na conexão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  // Obter credenciais (com senha mascarada)
  getCredentials: adminProcedure
    .use(requirePermission("TENANT", "READ"))
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
        select: {
          dbMysqlHost: true,
          dbMysqlPort: true,
          dbMysqlUsername: true,
          dbMysqlPassword: true,
          dbDfeEnabled: true,
        },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      return {
        mysql: tenant.dbMysqlPassword
          ? {
              host: tenant.dbMysqlHost,
              port: tenant.dbMysqlPort,
              username: tenant.dbMysqlUsername,
              hasPassword: true,
            }
          : null,
        dfeEnabled: tenant.dbDfeEnabled,
      };
    }),
});
