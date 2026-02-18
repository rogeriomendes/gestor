import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const productsSaleRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        company: z.number().nullish(),
        status: z.string().nullish(),
        inactive: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;
        const { cursor, company, status, inactive } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const whereCompany = company &&
          company !== 0 && {
            ID_EMPRESA: company,
          };

        const whereStatus = status &&
          status !== "T" && {
            STATUS: status,
          };

        const whereInactive = inactive &&
          inactive !== "T" && {
            INATIVO: inactive,
          };

        const where = {
          ...whereCompany,
          ...whereStatus,
          ...whereInactive,
        };

        const productsSale =
          await gestorPrisma.preco_reajuste_cabecalho.findMany({
            take: limit + 1,
            cursor: cursor ? { ID: Number(cursor) } : undefined,
            where,
            select: {
              ID: true,
              ID_EMPRESA: true,
              NOME_REAJUSTE: true,
              DATA_CADASTRO: true,
              DATA_INICIO: true,
              HORA_INICIO: true,
              DATA_FIM: true,
              HORA_FIM: true,
              OBSERVACAO: true,
              STATUS: true,
              INATIVO: true,
            },
            orderBy: [{ STATUS: "desc" }, { DATA_CADASTRO: "desc" }],
          });

        // Batch load empresas (optimized with Set deduplication)
        const empresaIds = [
          ...new Set(
            productsSale
              .map((product: any) => product.ID_EMPRESA)
              .filter((id: any): id is number => id !== null && id !== 0)
          ),
        ];

        const empresas =
          empresaIds.length > 0
            ? await gestorPrisma.empresa.findMany({
                where: { ID: { in: empresaIds } },
                select: {
                  ID: true,
                  RAZAO_SOCIAL: true,
                  NOME_FANTASIA: true,
                },
              })
            : [];

        const empresaMap = new Map(
          empresas.map((empresa: any) => [empresa.ID, empresa])
        );

        // Combinar dados dos produtos com dados das empresas
        const productsSaleWithEmpresa = productsSale.map((product: any) => ({
          ...product,
          empresa: product.ID_EMPRESA
            ? empresaMap.get(product.ID_EMPRESA) || null
            : null,
        }));

        let nextCursor: typeof cursor | undefined;
        if (productsSaleWithEmpresa.length > limit) {
          const nextSale = productsSaleWithEmpresa.pop();
          nextCursor = String(nextSale?.ID);
        }

        return { productsSale: productsSaleWithEmpresa, nextCursor };
      } catch (error) {
        console.error("An error occurred when returning products sale:", error);
        throw error;
      }
    }),

  idProduct: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const productsSale = await gestorPrisma.preco_reajuste_detalhe.findMany(
          {
            where: {
              ID_REAJUSTE_CABECALHO: id ? id : undefined,
            },
            select: {
              ID: true,
              ID_REAJUSTE_CABECALHO: true,
              ID_PRODUTO: true,
              PRECO_ORIGINAL: true,
              PRECO_PROMOCAO: true,
              QTD_PROMOCAO: true,
              QTD_PAGAR: true,
              TIPO_PROMOCAO: true,
            },
          }
        );

        // Batch load produtos (optimized with Set deduplication)
        const produtoIds = [
          ...new Set(
            productsSale
              .map((product: any) => product.ID_PRODUTO)
              .filter((id: any): id is number => id !== null && id !== 0)
          ),
        ];

        const produtos =
          produtoIds.length > 0
            ? await gestorPrisma.produto.findMany({
                where: { ID: { in: produtoIds } },
                select: {
                  ID: true,
                  NOME: true,
                },
              })
            : [];

        const produtoMap = new Map(
          produtos.map((produto: any) => [produto.ID, produto])
        );

        // Combinar dados dos detalhes com dados dos produtos
        const productsSaleWithProduto = productsSale.map((product: any) => ({
          ...product,
          produto: product.ID_PRODUTO
            ? produtoMap.get(product.ID_PRODUTO) || null
            : null,
        }));

        return { productsSale: productsSaleWithProduto };
      } catch (error) {
        console.error("An error occurred when returning products id:", error);
        throw error;
      }
    }),
});
