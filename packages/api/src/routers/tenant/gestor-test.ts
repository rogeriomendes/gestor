import prisma, { getGestorClientForTenant } from "@gestor/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { activeTenantProcedure, router } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";
import { requirePermission } from "../../middleware/permissions";

export const gestorTestRouter = router({
  /**
   * Lista contas de caixa do db-gestor do tenant
   * Usado para testar conexão com o banco de dados externo
   */
  listContaCaixa: activeTenantProcedure
    .use(requirePermission("DASHBOARD", "READ"))
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      // Buscar credenciais do tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.tenant.id },
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
          message:
            "Credenciais do banco de dados não configuradas. Configure as credenciais MySQL nas configurações do tenant.",
        });
      }

      try {
        // Obter cliente do db-gestor
        const gestorClient = await getGestorClientForTenant(ctx.tenant.id);
        const { skip, take } = getPaginationParams(input.page, input.limit);

        // Buscar contas de caixa
        const [contas, total] = await Promise.all([
          gestorClient.conta_caixa.findMany({
            skip,
            take,
            orderBy: { ID: "desc" },
            select: {
              ID: true,
              CODIGO: true,
              NOME: true,
              DESCRICAO: true,
              TIPO: true,
              SALDO_ATUAL: true,
              STATUS_CAIXA_ABERTO: true,
              empresa: {
                select: {
                  ID: true,
                  RAZAO_SOCIAL: true,
                },
              },
            },
          }),
          gestorClient.conta_caixa.count(),
        ]);

        return {
          data: contas.map((conta) => ({
            id: conta.ID,
            codigo: conta.CODIGO,
            nome: conta.NOME,
            descricao: conta.DESCRICAO,
            tipo: conta.TIPO,
            saldoAtual: conta.SALDO_ATUAL?.toNumber() ?? 0,
            caixaAberto: conta.STATUS_CAIXA_ABERTO === "S",
            empresa: conta.empresa
              ? {
                  id: conta.empresa.ID,
                  razaoSocial: conta.empresa.RAZAO_SOCIAL,
                }
              : null,
          })),
          pagination: createPaginationResponse(input.page, input.limit, total),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao acessar banco de dados externo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Detalhe de uma conta de caixa específica
   */
  getContaCaixa: activeTenantProcedure
    .use(requirePermission("DASHBOARD", "READ"))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.tenant.id },
        select: {
          dbMysqlPassword: true,
        },
      });

      if (!tenant?.dbMysqlPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Credenciais do banco de dados não configuradas.",
        });
      }

      try {
        const gestorClient = await getGestorClientForTenant(ctx.tenant.id);

        const conta = await gestorClient.conta_caixa.findUnique({
          where: { ID: input.id },
          select: {
            ID: true,
            CODIGO: true,
            DIGITO: true,
            NOME: true,
            DESCRICAO: true,
            TIPO: true,
            SALDO_INICIAL: true,
            DATA_SALDO_INICIAL: true,
            SALDO_ATUAL: true,
            STATUS_CAIXA_ABERTO: true,
            DATA_ULTIMA_ABERTURA: true,
            HORA_ULTIMA_ABERTURA: true,
            TEM_GAVETA: true,
            empresa: {
              select: {
                ID: true,
                RAZAO_SOCIAL: true,
                NOME_FANTASIA: true,
              },
            },
            agencia_banco: {
              select: {
                ID: true,
                NUMERO: true,
                DIGITO: true,
                NOME: true,
              },
            },
          },
        });

        if (!conta) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conta de caixa não encontrada",
          });
        }

        return {
          id: conta.ID,
          codigo: conta.CODIGO,
          digito: conta.DIGITO,
          nome: conta.NOME,
          descricao: conta.DESCRICAO,
          tipo: conta.TIPO,
          saldoInicial: conta.SALDO_INICIAL?.toNumber() ?? 0,
          dataSaldoInicial: conta.DATA_SALDO_INICIAL,
          saldoAtual: conta.SALDO_ATUAL?.toNumber() ?? 0,
          caixaAberto: conta.STATUS_CAIXA_ABERTO === "S",
          dataUltimaAbertura: conta.DATA_ULTIMA_ABERTURA,
          horaUltimaAbertura: conta.HORA_ULTIMA_ABERTURA,
          temGaveta: conta.TEM_GAVETA === "S",
          empresa: conta.empresa
            ? {
                id: conta.empresa.ID,
                razaoSocial: conta.empresa.RAZAO_SOCIAL,
                nomeFantasia: conta.empresa.NOME_FANTASIA,
              }
            : null,
          agenciaBanco: conta.agencia_banco
            ? {
                id: conta.agencia_banco.ID,
                numero: conta.agencia_banco.NUMERO,
                digito: conta.agencia_banco.DIGITO,
                nome: conta.agencia_banco.NOME,
              }
            : null,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao acessar banco de dados externo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Estatísticas gerais do db-gestor
   */
  getStats: activeTenantProcedure
    .use(requirePermission("DASHBOARD", "READ"))
    .query(async ({ ctx }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.tenant.id },
        select: {
          dbMysqlPassword: true,
        },
      });

      if (!tenant?.dbMysqlPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Credenciais do banco de dados não configuradas.",
        });
      }

      try {
        const gestorClient = await getGestorClientForTenant(ctx.tenant.id);

        const [totalContaCaixa, totalEmpresas, caixasAbertos] =
          await Promise.all([
            gestorClient.conta_caixa.count(),
            gestorClient.empresa.count(),
            gestorClient.conta_caixa.count({
              where: { STATUS_CAIXA_ABERTO: "S" },
            }),
          ]);

        return {
          totalContaCaixa,
          totalEmpresas,
          caixasAbertos,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao acessar banco de dados externo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),
});
