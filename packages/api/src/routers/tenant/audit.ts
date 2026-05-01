import type { Tenant } from "@gestor/db/types";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

function normalizeActionKey(value: string): string {
  return (
    value
      // Alguns textos chegam corrompidos (ex: ALTERA??O). Tratamos "??" como "CA".
      .replace(/\?\?/g, "CA")
      .replace(/\?/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .toUpperCase()
  );
}

function pickBestActionLabel(current: string, candidate: string): string {
  const currentQuestionMarks = (current.match(/\?/g) ?? []).length;
  const candidateQuestionMarks = (candidate.match(/\?/g) ?? []).length;
  if (candidateQuestionMarks < currentQuestionMarks) {
    return candidate;
  }

  const currentHasAccents = /[À-ÿ]/.test(current);
  const candidateHasAccents = /[À-ÿ]/.test(candidate);
  if (candidateHasAccents && !currentHasAccents) {
    return candidate;
  }

  return candidate.length > current.length ? candidate : current;
}

export const tenantAuditRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        searchTerm: z.string().nullish(),
        companyId: z.number().min(1).nullish(),
        auditType: z.string().min(1).max(2).nullish(),
        origin: z.string().min(1).max(1).nullish(),
        user: z.string().min(1).nullish(),
        action: z.string().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 20;
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        let actionCandidates: string[] | null = null;

        if (input.action) {
          const actionKey = normalizeActionKey(input.action);
          const existingActions = await gestorPrisma.auditoria.findMany({
            where: { ACAO: { not: null } },
            select: { ACAO: true },
            distinct: ["ACAO"],
            take: 1000,
          });

          actionCandidates = existingActions
            .map((item) => item.ACAO)
            .filter(
              (value): value is string =>
                !!value &&
                value.trim().length > 0 &&
                normalizeActionKey(value) === actionKey
            );
        }

        const whereSearch = input.searchTerm
          ? {
              OR: [
                { ID: Number(input.searchTerm) || -1 },
                { RESUMO: { contains: input.searchTerm } },
                { ACAO: { contains: input.searchTerm } },
                { JANELA_CONTROLLER: { contains: input.searchTerm } },
                { NOME_USU_AUTO: { contains: input.searchTerm } },
                { usuario: { is: { LOGIN: { contains: input.searchTerm } } } },
              ],
            }
          : {};

        const whereCompany = input.companyId
          ? { ID_EMPRESA: input.companyId }
          : {};
        const whereType = input.auditType
          ? { TIPO_AUDITORIA: input.auditType }
          : {};
        const whereOrigin = input.origin ? { ORIGEM: input.origin } : {};
        const whereUser = input.user
          ? {
              OR: [
                { NOME_USU_AUTO: { equals: input.user } },
                { usuario: { is: { LOGIN: { equals: input.user } } } },
              ],
            }
          : {};
        const whereAction = input.action
          ? {
              ACAO: {
                in:
                  actionCandidates && actionCandidates.length > 0
                    ? actionCandidates
                    : [input.action],
              },
            }
          : {};

        const where = {
          ...whereSearch,
          ...whereCompany,
          ...whereType,
          ...whereOrigin,
          ...whereUser,
          ...whereAction,
        };

        const audit = await gestorPrisma.auditoria.findMany({
          take: limit + 1,
          cursor: input.cursor ? { ID: Number(input.cursor) } : undefined,
          where,
          select: {
            ID: true,
            ID_EMPRESA: true,
            DATA_REGISTRO: true,
            HORA_REGISTRO: true,
            RESUMO: true,
            ACAO: true,
            JANELA_CONTROLLER: true,
            TIPO_AUDITORIA: true,
            ORIGEM: true,
            NOME_USU_AUTO: true,
            usuario: {
              select: {
                LOGIN: true,
              },
            },
          },
          orderBy: [{ ID: "desc" }],
        });

        let nextCursor: string | undefined;
        if (audit.length > limit) {
          const nextItem = audit.pop();
          nextCursor = String(nextItem?.ID);
        }

        return {
          audit,
          nextCursor,
        };
      } catch (error) {
        console.error("An error occurred when returning tenant audit:", error);
        throw error;
      }
    }),

  filterOptions: tenantProcedure.query(async ({ ctx }) => {
    try {
      const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

      const [actionsRaw, usersAutoRaw, usersRaw, systemUser] =
        await Promise.all([
          gestorPrisma.auditoria.findMany({
            where: { ACAO: { not: null } },
            select: { ACAO: true },
            distinct: ["ACAO"],
            orderBy: [{ ACAO: "asc" }],
            take: 500,
          }),
          gestorPrisma.auditoria.findMany({
            where: { NOME_USU_AUTO: { not: null } },
            select: { NOME_USU_AUTO: true },
            distinct: ["NOME_USU_AUTO"],
            orderBy: [{ NOME_USU_AUTO: "asc" }],
            take: 500,
          }),
          gestorPrisma.usuario.findMany({
            where: {
              LOGIN: { not: null },
              ID: { not: 1 },
            },
            select: { LOGIN: true },
            distinct: ["LOGIN"],
            orderBy: [{ LOGIN: "asc" }],
            take: 500,
          }),
          gestorPrisma.usuario.findUnique({
            where: { ID: 1 },
            select: { LOGIN: true },
          }),
        ]);

      const rawActions = actionsRaw
        .map((item) => item.ACAO)
        .filter((value): value is string => !!value && value.trim().length > 0);
      const actionMap = new Map<string, string>();
      for (const action of rawActions) {
        const key = normalizeActionKey(action);
        if (!key) {
          continue;
        }
        const current = actionMap.get(key);
        actionMap.set(
          key,
          current ? pickBestActionLabel(current, action) : action
        );
      }
      const actions = Array.from(actionMap.values()).sort((a, b) =>
        a.localeCompare(b)
      );

      const blockedLogin = systemUser?.LOGIN?.trim().toUpperCase() || null;
      const users = Array.from(
        new Set(
          [
            ...usersAutoRaw.map((item) => item.NOME_USU_AUTO),
            ...usersRaw.map((item) => item.LOGIN),
          ].filter(
            (value): value is string =>
              !!value &&
              value.trim().length > 0 &&
              value.trim().toUpperCase() !== blockedLogin
          )
        )
      ).sort((a, b) => a.localeCompare(b));

      return { actions, users };
    } catch (error) {
      console.error(
        "An error occurred when returning tenant audit filter options:",
        error
      );
      throw error;
    }
  }),

  byId: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const audit = await gestorPrisma.auditoria.findUnique({
          where: { ID: input.id },
          select: {
            ID: true,
            ID_EMPRESA: true,
            DATA_REGISTRO: true,
            HORA_REGISTRO: true,
            JANELA_CONTROLLER: true,
            ACAO: true,
            CONTEUDO: true,
            TIPO_AUDITORIA: true,
            ORIGEM: true,
            NOME_USU_AUTO: true,
            RESUMO: true,
            TEXTO_ANTES: true,
            TEXTO_DEPOIS: true,
            usuario: {
              select: {
                LOGIN: true,
              },
            },
          },
        });

        return { audit };
      } catch (error) {
        console.error(
          "An error occurred when returning tenant audit by id:",
          error
        );
        throw error;
      }
    }),
});
