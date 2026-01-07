/**
 * Re-exporta o PrismaClient gerado para uso externo.
 * Este arquivo é necessário para expor o cliente Prisma gerado pelo pacote.
 */
// biome-ignore lint/performance/noBarrelFile: necessário para expor o PrismaClient gerado
export { Prisma, PrismaClient as DfeClient } from "../prisma/generated/client";
