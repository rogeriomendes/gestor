import { z } from "zod";

/**
 * Schema Zod para inputs de paginação
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Tipo de retorno de paginação
 */
export interface PaginationResult {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

/**
 * Helper para calcular skip e take do Prisma
 */
export function getPaginationParams(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Helper para criar resposta de paginação
 */
export function createPaginationResponse(
  page: number,
  limit: number,
  total: number
): PaginationResult {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
