import type { Tenant } from "@gestor/db/types";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

function normalizeActionKey(value: string): string {
  return value
    .replace(/\?\?/g, "CA")
    .replace(/\?/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toUpperCase();
}

/** Expande o rótulo enviado pelo cliente em variantes para `ACAO IN (...)`. */
function actionFilterCandidates(label: string): string[] {
  const trimmed = label.trim();
  if (!trimmed) {
    return [];
  }

  const asciiUpper = trimmed
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC");

  const out = new Set<string>([
    trimmed,
    trimmed.toUpperCase(),
    asciiUpper,
    asciiUpper.toLowerCase(),
  ]);

  if (asciiUpper.endsWith("CAO") && asciiUpper.length >= 3) {
    const stem = asciiUpper.slice(0, -3);
    out.add(`${stem}??O`);
    out.add(`${stem}ÇÃO`);
  }

  if (asciiUpper.endsWith("SAO") && asciiUpper.length >= 3) {
    const stem = asciiUpper.slice(0, -3);
    out.add(`${stem}??O`);
    out.add(`${stem}ÃO`);
  }

  const key = normalizeActionKey(trimmed);
  const list = [...out].filter(
    (v) => v.trim().length > 0 && normalizeActionKey(v) === key
  );
  return list.length > 0 ? list : [trimmed];
}

export const tenantAuditRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        searchTerm: z.string().nullish(),
        companyId: z.number().min(1).nullish(),
        user: z.string().min(1).nullish(),
        action: z.string().min(1).max(200).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

      const actionIn = input.action
        ? actionFilterCandidates(input.action)
        : null;

      const andFilters: Record<string, unknown>[] = [];

      if (input.searchTerm) {
        andFilters.push({
          OR: [
            { ID: Number(input.searchTerm) || -1 },
            { RESUMO: { contains: input.searchTerm } },
            { ACAO: { contains: input.searchTerm } },
            { JANELA_CONTROLLER: { contains: input.searchTerm } },
            { NOME_USU_AUTO: { contains: input.searchTerm } },
            { usuario: { is: { LOGIN: { contains: input.searchTerm } } } },
          ],
        });
      }

      if (input.companyId) {
        andFilters.push({ ID_EMPRESA: input.companyId });
      }
      if (input.user) {
        andFilters.push({
          OR: [
            { NOME_USU_AUTO: { equals: input.user } },
            { usuario: { is: { LOGIN: { equals: input.user } } } },
          ],
        });
      }
      if (actionIn?.length) {
        andFilters.push({ ACAO: { in: actionIn } });
      }

      const where = andFilters.length > 0 ? { AND: andFilters } : {};

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
          NOME_USU_AUTO: true,
          usuario: {
            select: { LOGIN: true },
          },
        },
        orderBy: [{ ID: "desc" }],
      });

      let nextCursor: string | undefined;
      if (audit.length > limit) {
        const nextItem = audit.pop();
        nextCursor = String(nextItem?.ID);
      }

      return { audit, nextCursor };
    }),

  filterOptions: tenantProcedure.query(async ({ ctx }) => {
    const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

    const [usersAutoRaw, usersRaw, systemUser] = await Promise.all([
      gestorPrisma.auditoria.findMany({
        where: { NOME_USU_AUTO: { not: null } },
        select: { NOME_USU_AUTO: true },
        distinct: ["NOME_USU_AUTO"],
        orderBy: [{ NOME_USU_AUTO: "asc" }],
        take: 500,
      }),
      gestorPrisma.usuario.findMany({
        where: { LOGIN: { not: null }, ID: { not: 1 } },
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

    return { users };
  }),

  byId: tenantProcedure
    .input(z.object({ id: z.number().min(1) }))
    .query(async ({ ctx, input }) => {
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
          usuario: { select: { LOGIN: true } },
        },
      });

      return { audit };
    }),
});
