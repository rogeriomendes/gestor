import { format } from "date-fns";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const productsRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish().optional(),
        cursor: z.string().nullish().optional(),
        searchTerm: z.string().nullish().optional(),
        group: z.number().nullish().optional(),
        scale: z.string().nullish().optional(),
        promotion: z.string().nullish().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;
        const { cursor, searchTerm, group, scale, promotion } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const whereSearch = searchTerm && {
          OR: [
            { CODIGO_INTERNO: { contains: searchTerm } },
            { GTIN: { contains: searchTerm } },
            { NOME: { contains: searchTerm } },
          ],
        };

        const whereGroup = group &&
          group !== 0 && {
            ID_SUB_GRUPO: Number(group),
          };

        const whereScale = scale &&
          scale !== "T" && {
            PRODUTO_PESADO: scale,
          };

        // Filtro por promoção - buscar IDs dos produtos com promoção ativa
        let wherePromotion = {};
        if (promotion && promotion !== "T") {
          // Primeiro buscar cabeçalhos de promoção ativos
          const activePromotionHeaders =
            await gestorPrisma.preco_reajuste_cabecalho.findMany({
              where: {
                STATUS: "E", // Status ativo
                INATIVO: "N", // Não inativo
                DATA_INICIO: {
                  lte: new Date(format(new Date(), "yyyy-MM-dd")),
                },
                HORA_INICIO: { lte: format(new Date(), "HH:mm:ss") },
                DATA_FIM: { gte: new Date(format(new Date(), "yyyy-MM-dd")) },
                HORA_FIM: { gte: format(new Date(), "HH:mm:ss") },
              },
              select: {
                ID: true,
              },
            });

          type PromotionHeaderRow = (typeof activePromotionHeaders)[number];
          const activeHeaderIds = activePromotionHeaders.map(
            (h: PromotionHeaderRow) => h.ID
          );

          if (activeHeaderIds.length > 0) {
            // Buscar detalhes de promoção ativos
            const activePromotionDetails =
              await gestorPrisma.preco_reajuste_detalhe.findMany({
                where: {
                  ID_REAJUSTE_CABECALHO: { in: activeHeaderIds },
                },
                select: {
                  ID: true,
                  ID_PRODUTO: true,
                },
              });

            // Buscar produtos com preço promocional ativo
            const productsWithPromoPrice =
              await gestorPrisma.produto_preco_promocao.findMany({
                where: {
                  ID_REAJUSTE_DETALHE: {
                    in: activePromotionDetails.map(
                      (d: (typeof activePromotionDetails)[number]) => d.ID
                    ),
                  },
                },
                select: {
                  ID_PRODUTO: true,
                },
              });

            const productIdsWithPromotion = productsWithPromoPrice.map(
              (p: (typeof productsWithPromoPrice)[number]) => p.ID_PRODUTO
            );

            if (promotion === "S") {
              // Produtos COM promoção ativa
              wherePromotion =
                productIdsWithPromotion.length > 0
                  ? { ID: { in: productIdsWithPromotion } }
                  : { ID: { in: [-1] } }; // Força resultado vazio se não há promoções
            } else if (promotion === "N") {
              // Produtos SEM promoção ativa
              wherePromotion =
                productIdsWithPromotion.length > 0
                  ? { ID: { notIn: productIdsWithPromotion } }
                  : {}; // Se não há promoções, todos os produtos estão sem promoção
            }
          } else {
            // Se não há cabeçalhos ativos, não há promoções
            if (promotion === "S") {
              wherePromotion = { ID: { in: [-1] } }; // Força resultado vazio
            } else if (promotion === "N") {
              wherePromotion = {}; // Todos os produtos estão sem promoção
            }
          }
        }

        const where = {
          INATIVO: "N",
          ...whereGroup,
          ...whereSearch,
          ...whereScale,
          ...wherePromotion,
        };

        const products = await gestorPrisma.produto.findMany({
          take: limit + 1,
          cursor: cursor ? { ID: Number(cursor) } : undefined,
          where,
          select: {
            ID: true,
            CODIGO_INTERNO: true,
            GTIN: true,
            NOME: true,
            unidade_produto: {
              select: {
                SIGLA: true,
                DESCRICAO: true,
              },
            },
            produto_sub_grupo: {
              select: {
                NOME: true,
                DESCRICAO: true,
              },
            },
            produto_familia: {
              select: {
                NOME: true,
                DESCRICAO: true,
              },
            },
            DESCRICAO: true,
            VALOR_COMPRA: true,
            MARKUP: true,
            VALOR_VENDA: true,
            DATA_CADASTRO: true,
            DATA_ALTERACAO: true,
            PRODUTO_PESADO: true,
            DIA_VALIDADE: true,
            ESTOQUE_MINIMO: true,
            ESTOQUE_MAXIMO: true,
            QUANTIDADE_ESTOQUE: true,
            FRETE: true,
            ICMS_ST: true,
            IPI: true,
            OUTROSIMPOSTOS: true,
            OUTROSVALORES: true,
            INATIVO: true,
            COMPOSTO: true,
            NCM: true,
            CEST: true,
          },
          orderBy: {
            NOME: "asc",
          },
        });

        // Buscar promoções ativas para os produtos
        type ProductRow = (typeof products)[number];
        const productIds = products.map((p: ProductRow) => p.ID);
        const activePromotions =
          await gestorPrisma.preco_reajuste_detalhe.findMany({
            where: {
              ID_PRODUTO: { in: productIds },
            },
            select: {
              ID_PRODUTO: true,
              PRECO_PROMOCAO: true,
              PRECO_ORIGINAL: true,
              TIPO_PROMOCAO: true,
              ID_REAJUSTE_CABECALHO: true,
              QTD_PROMOCAO: true,
              QTD_PAGAR: true,
            },
          });

        // Buscar informações dos cabeçalhos de promoção ativos
        type ActivePromotionRow = (typeof activePromotions)[number];
        const promotionHeaderIds = [
          ...new Set(
            activePromotions.map(
              (p: ActivePromotionRow) => p.ID_REAJUSTE_CABECALHO
            )
          ),
        ];
        const activePromotionHeaders =
          await gestorPrisma.preco_reajuste_cabecalho.findMany({
            where: {
              ID: { in: promotionHeaderIds },
              STATUS: "E", // Status "E" = EXECUÇÃO (ativo)
              INATIVO: "N", // Não inativo
              DATA_INICIO: { lte: new Date(format(new Date(), "yyyy-MM-dd")) }, // Data de início já passou
              HORA_INICIO: { lte: format(new Date(), "HH:mm:ss") }, // Hora de início já passou
              DATA_FIM: { gte: new Date(format(new Date(), "yyyy-MM-dd")) }, // Data de fim ainda não chegou
              HORA_FIM: { gte: format(new Date(), "HH:mm:ss") }, // Hora de fim ainda não chegou
            },
            select: {
              ID: true,
              NOME_REAJUSTE: true,
              DATA_FIM: true,
              HORA_FIM: true,
              HORA_INICIO: true,
              DATA_INICIO: true,
            },
          });

        // Mapear cabeçalhos por ID
        type PromotionHeaderRow2 = (typeof activePromotionHeaders)[number];
        const headersById = new Map(
          activePromotionHeaders.map((h: PromotionHeaderRow2) => [h.ID, h])
        );

        // Mapear promoções por produto (apenas as que têm cabeçalho ativo)
        const promotionsByProduct = new Map<
          number,
          ActivePromotionRow & { header: PromotionHeaderRow2 }
        >();
        activePromotions.forEach((promotion: ActivePromotionRow) => {
          const header = headersById.get(promotion.ID_REAJUSTE_CABECALHO);
          if (header) {
            promotionsByProduct.set(promotion.ID_PRODUTO, {
              ...promotion,
              header,
            });
          }
        });

        // Adicionar informações de promoção aos produtos
        const productsWithPromotions = products.map((product: ProductRow) => ({
          ...product,
          activePromotion: promotionsByProduct.get(product.ID) ?? null,
        }));

        const totalProducts = await gestorPrisma.produto.count();

        let nextCursor: typeof cursor | undefined;
        if (productsWithPromotions.length > limit) {
          const nextSale = productsWithPromotions.pop();
          nextCursor = String(nextSale!.ID);
        }

        return { products: productsWithPromotions, nextCursor, totalProducts };
      } catch (error) {
        console.error("An error occurred when returning products:", error);
        throw error;
      }
    }),

  byId: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const product = await gestorPrisma.produto.findUnique({
          where: {
            ID: Number(id),
          },
          select: {
            ID: true,
            CODIGO_INTERNO: true,
            GTIN: true,
            NOME: true,
            unidade_produto: {
              select: {
                SIGLA: true,
                DESCRICAO: true,
              },
            },
            produto_sub_grupo: {
              select: {
                NOME: true,
                DESCRICAO: true,
              },
            },
            produto_familia: {
              select: {
                NOME: true,
                DESCRICAO: true,
              },
            },
            DESCRICAO: true,
            VALOR_COMPRA: true,
            MARKUP: true,
            VALOR_VENDA: true,
            DATA_ALTERACAO: true,
            PRODUTO_PESADO: true,
            QUANTIDADE_ESTOQUE: true,
            FRETE: true,
            ICMS_ST: true,
            IPI: true,
            OUTROSIMPOSTOS: true,
            OUTROSVALORES: true,
            INATIVO: true,

            COMPOSTO: true,
            NCM: true,
            CEST: true,
            DATA_CADASTRO: true,
            DIA_VALIDADE: true,
            ESTOQUE_MINIMO: true,
            ESTOQUE_MAXIMO: true,
          },
        });

        if (!product) {
          return { product: null };
        }

        // Buscar todas as promoções do produto
        const allPromotions =
          await gestorPrisma.preco_reajuste_detalhe.findMany({
            where: {
              ID_PRODUTO: product.ID,
            },
            select: {
              ID_PRODUTO: true,
              PRECO_PROMOCAO: true,
              PRECO_ORIGINAL: true,
              TIPO_PROMOCAO: true,
              ID_REAJUSTE_CABECALHO: true,
            },
          });

        let promotionWithHeader = null;

        // Buscar cabeçalhos ativos para todas as promoções
        if (allPromotions.length > 0) {
          type AllPromotionRow = (typeof allPromotions)[number];
          const headerIds = allPromotions.map(
            (p: AllPromotionRow) => p.ID_REAJUSTE_CABECALHO
          );
          const activeHeaders =
            await gestorPrisma.preco_reajuste_cabecalho.findMany({
              where: {
                ID: { in: headerIds },
                STATUS: "E", // Status "E" = EXECUÇÃO (ativo)
                INATIVO: "N", // Não inativo
                DATA_INICIO: {
                  lte: new Date(format(new Date(), "yyyy-MM-dd")),
                }, // Data de início já passou
                HORA_INICIO: { lte: format(new Date(), "HH:mm:ss") }, // Hora de início já passou
                DATA_FIM: { gte: new Date(format(new Date(), "yyyy-MM-dd")) }, // Data de fim ainda não chegou
                HORA_FIM: { gte: format(new Date(), "HH:mm:ss") }, // Hora de fim ainda não chegou
              },
              select: {
                ID: true,
                NOME_REAJUSTE: true,
                DATA_FIM: true,
                HORA_FIM: true,
                HORA_INICIO: true,
                DATA_INICIO: true,
              },
            });

          // Encontrar a primeira promoção com cabeçalho ativo
          type ActiveHeaderRow = (typeof activeHeaders)[number];
          const activePromotion = allPromotions.find((p: AllPromotionRow) =>
            activeHeaders.some(
              (h: ActiveHeaderRow) => h.ID === p.ID_REAJUSTE_CABECALHO
            )
          );

          if (activePromotion) {
            const header = activeHeaders.find(
              (h: ActiveHeaderRow) =>
                h.ID === activePromotion.ID_REAJUSTE_CABECALHO
            );
            if (header) {
              promotionWithHeader = {
                ...activePromotion,
                header,
              };
            }
          }
        }

        const result = {
          product: {
            ...product,
            activePromotion: promotionWithHeader,
          },
        };

        return result;
      } catch (error) {
        console.error("An error occurred when returning product:", error);
        throw error;
      }
    }),

  stock: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const stock = await gestorPrisma.estoque_rede.findFirst({
          where: {
            ID_PRODUTO: Number(id),
          },
          select: {
            ID: true,
            ID_PRODUTO: true,
            QUANTIDADE: true,
          },
        });

        return { stock };
      } catch (error) {
        console.error("An error occurred when returning product stock:", error);
        throw error;
      }
    }),

  sales: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;
        const limit = 30;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const sales = await gestorPrisma.venda_detalhe.findMany({
          take: limit + 1,
          where: {
            ID_PRODUTO: Number(id),
            venda_cabecalho: {
              DEVOLUCAO: "N",
              SITUACAO: "F",
            },
          },
          select: {
            ID: true,
            QUANTIDADE: true,
            produto: {
              select: {
                unidade_produto: {
                  select: {
                    SIGLA: true,
                    DESCRICAO: true,
                  },
                },
              },
            },
            venda_cabecalho: {
              select: {
                DATA_VENDA: true,
                ID: true,
                NUMERO_NFE: true,
              },
            },
          },
          orderBy: {
            ID: "desc",
          },
        });

        return { sales };
      } catch (error) {
        console.error("An error occurred when returning product sales:", error);
        throw error;
      }
    }),

  purchase: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;
        const limit = 30;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const purchase = await gestorPrisma.nfe_detalhe.findMany({
          take: limit + 1,
          where: {
            ID_PRODUTO: Number(id),
            nfe_cabecalho: {
              NATUREZA_OPERACAO: "COMPRA",
            },
          },
          select: {
            ID: true,
            UNIDADE_COMERCIAL: true,
            QUANTIDADE_COMERCIAL: true,
            VALOR_TOTAL: true,
            nfe_cabecalho: {
              select: {
                ID: true,
                ID_EMPRESA: true,
                ID_FORNECEDOR: true,
                DATA_ENTRADA_SAIDA: true,
                NUMERO: true,
              },
            },
          },
          orderBy: {
            ID: "desc",
          },
        });

        // Buscar dados dos fornecedores
        const fornecedorIds = purchase
          .map((item: any) => item.nfe_cabecalho.ID_FORNECEDOR)
          .filter((id: any): id is number => id !== null && id !== 0);

        const fornecedores =
          fornecedorIds.length > 0
            ? await gestorPrisma.fornecedor.findMany({
                where: {
                  ID: {
                    in: fornecedorIds,
                  },
                },
                select: {
                  ID: true,
                  pessoa: {
                    select: {
                      NOME: true,
                    },
                  },
                },
              })
            : [];

        const fornecedorMap = new Map(
          fornecedores.map((fornecedor: any) => [fornecedor.ID, fornecedor])
        );

        // Combinar dados das compras com dados dos fornecedores
        const purchaseWithFornecedor = purchase.map((item: any) => ({
          ...item,
          nfe_cabecalho: {
            ...item.nfe_cabecalho,
            fornecedor: item.nfe_cabecalho.ID_FORNECEDOR
              ? fornecedorMap.get(item.nfe_cabecalho.ID_FORNECEDOR) || null
              : null,
          },
        }));

        return { purchase: purchaseWithFornecedor };
      } catch (error) {
        console.error(
          "An error occurred when returning product purchase:",
          error
        );
        throw error;
      }
    }),

  ncm: tenantProcedure
    .input(
      z.object({
        cod: z.string().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { cod } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const ncm = await gestorPrisma.ncm.findFirst({
          where: {
            CODIGO: cod,
          },
          select: {
            ID: true,
            CODIGO: true,
            DESCRICAO: true,
          },
        });

        return { ncm };
      } catch (error) {
        console.error("An error occurred when returning product ncm:", error);
        throw error;
      }
    }),
  cest: tenantProcedure
    .input(
      z.object({
        cod: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { cod } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const cest = await gestorPrisma.ncm_cest.findFirst({
          where: {
            CEST: cod,
          },
          select: {
            ID: true,
            CEST: true,
            DESCRICAO: true,
          },
        });

        return { cest };
      } catch (error) {
        console.error("An error occurred when returning product cest:", error);
        throw error;
      }
    }),

  compound: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const compound = await gestorPrisma.produto_composto.findMany({
          where: {
            ID_PRODUTO_COMPOSTO: Number(id),
          },
          select: {
            ID: true,
            ID_PRODUTO: true,
            ID_PRODUTO_COMPOSTO: true,
            DESCRICAO: true,
            POSICAO: true,
            QUANTIDADE: true,
            TOTAL_CUSTO_PRODUTO: true,
            VALOR_CUSTO_UNITARIO: true,
          },
          orderBy: {
            ID: "desc",
          },
        });

        return { compound };
      } catch (error) {
        console.error(
          "An error occurred when returning product compound:",
          error
        );
        throw error;
      }
    }),

  allMobile: tenantProcedure.query(async ({ ctx }) => {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
      const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
      const products = await gestorPrisma.produto.findMany({
        select: {
          ID: true,
          CODIGO_INTERNO: true,
          GTIN: true,
          NOME: true,
          unidade_produto: { select: { SIGLA: true, DESCRICAO: true } },
          produto_sub_grupo: { select: { NOME: true, DESCRICAO: true } },
          produto_familia: { select: { NOME: true, DESCRICAO: true } },
          DESCRICAO: true,
          VALOR_COMPRA: true,
          MARKUP: true,
          VALOR_VENDA: true,
          DATA_CADASTRO: true,
          DATA_ALTERACAO: true,
          PRODUTO_PESADO: true,
          DIA_VALIDADE: true,
          ESTOQUE_MINIMO: true,
          ESTOQUE_MAXIMO: true,
          QUANTIDADE_ESTOQUE: true,
          FRETE: true,
          ICMS_ST: true,
          IPI: true,
          OUTROSIMPOSTOS: true,
          OUTROSVALORES: true,
          INATIVO: true,
          COMPOSTO: true,
          NCM: true,
          CEST: true,
        },
        orderBy: { NOME: "asc" },
      });
      return products;
    } catch (error) {
      console.error("An error occurred when returning products:", error);
      throw error;
    }
  }),
});
