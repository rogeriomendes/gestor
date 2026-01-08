import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/client";

/**
 * Cria um Prisma Client dinâmico para o banco gestor (bussolla_db)
 * usando as credenciais fornecidas
 */
export function createGestorPrismaClient(
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
    database: "bussolla_db",
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
    console.error("Prisma Client Error (Gestor):", e);
  });

  return prisma;
}
