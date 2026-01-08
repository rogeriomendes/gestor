import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/client";

/**
 * Cria um Prisma Client dinâmico para o banco DFE (opytex_db_dfe)
 * usando as credenciais fornecidas
 */
export function createDfePrismaClient(
  host: string,
  port: string,
  username: string,
  password: string
): PrismaClient {
  const adapter = new PrismaMariaDb({
    host,
    port: Number.parseInt(port, 10),
    user: username,
    password,
    database: "opytex_db_dfe",
    connectionLimit: 10,
  });

  const prisma = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? [
            // "query",
            "error",
            "warn",
          ]
        : ["error"],
    errorFormat: "pretty",
  });

  // Tratamento de erros de conexão
  prisma.$on("error" as never, (e: unknown) => {
    console.error("Prisma Client Error (DFE):", e);
  });

  return prisma;
}
