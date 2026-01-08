import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
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
  console.error("Prisma Client Error:", e);
});

export default prisma;
