import { createDfePrismaClient } from "@gestor/db-dfe";
import { createGestorPrismaClient } from "@gestor/db-gestor";
import { z } from "zod";

export interface ValidationResult {
  errors: string[];
  valid: boolean;
}

const hostSchema = z
  .string()
  .min(1, "Host é obrigatório")
  .refine(
    (val) => {
      // Validar se é IP válido ou domínio válido
      const ipRegex =
        /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      const domainRegex =
        /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^localhost$/;
      return ipRegex.test(val) || domainRegex.test(val);
    },
    {
      message: "Host deve ser um IP válido ou domínio válido",
    }
  );

const portSchema = z
  .string()
  .min(1, "Porta é obrigatória")
  .refine(
    (val) => {
      const port = Number.parseInt(val, 10);
      return !Number.isNaN(port) && port >= 1 && port <= 65_535;
    },
    {
      message: "Porta deve ser um número entre 1 e 65535",
    }
  );

const usernameSchema = z.string().min(1, "Username é obrigatório");

const passwordSchema = z.string().min(1, "Password é obrigatório");

/**
 * Valida os parâmetros de conexão (formato)
 *
 * biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validação detalhada em um único ponto de entrada
 */
export function validateConnectionParams(
  host: string | null | undefined,
  port: string | null | undefined,
  username: string | null | undefined,
  password: string | null | undefined
): ValidationResult {
  const errors: string[] = [];

  // Normalizar valores: converter null/undefined para string vazia
  const normalizedHost = host ?? "";
  const normalizedPort = port ?? "";
  const normalizedUsername = username ?? "";
  const normalizedPassword = password ?? "";

  try {
    hostSchema.parse(normalizedHost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e) => e.message));
    }
  }

  try {
    portSchema.parse(normalizedPort);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e) => e.message));
    }
  }

  try {
    usernameSchema.parse(normalizedUsername);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e) => e.message));
    }
  }

  try {
    passwordSchema.parse(normalizedPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e) => e.message));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Testa conexão real com os bancos MySQL
 *
 * biome-ignore lint/complexity/noExcessiveCognitiveComplexity: mantém toda a lógica de tratamento de erros de conexão em uma única função
 */
export async function testDatabaseConnection(
  host: string,
  port: string,
  username: string,
  password: string,
  database: "bussolla_db" | "opytex_db_dfe"
): Promise<{ success: boolean; error?: string }> {
  // Validar formato primeiro
  const validation = validateConnectionParams(host, port, username, password);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(", "),
    };
  }

  // Testar conexão real usando Prisma (mesmo usado nas conexões reais)
  // Usamos as funções de criação de client que já existem
  let prisma:
    | ReturnType<typeof createGestorPrismaClient>
    | ReturnType<typeof createDfePrismaClient>
    | null = null;
  try {
    // Criar PrismaClient temporário usando as mesmas funções usadas nas conexões reais
    if (database === "bussolla_db") {
      prisma = createGestorPrismaClient(host, port, username, password);
    } else {
      prisma = createDfePrismaClient(host, port, username, password);
    }

    // Testar query simples
    await prisma.$queryRaw`SELECT 1`;

    return {
      success: true,
    };
  } catch (error) {
    // Traduzir erros técnicos em mensagens amigáveis
    let friendlyMessage =
      "Não foi possível estabelecer conexão com o banco de dados";

    if (error instanceof Error) {
      const errorCode = (error as { code?: string }).code;
      const errorMessage = error.message.toLowerCase();

      if (errorCode === "ETIMEDOUT" || errorMessage.includes("timeout")) {
        friendlyMessage =
          "Tempo de conexão esgotado. Verifique se o servidor está acessível e se o host/porta estão corretos";
      } else if (
        errorCode === "ECONNREFUSED" ||
        errorMessage.includes("refused")
      ) {
        friendlyMessage =
          "Conexão recusada. Verifique se o servidor MySQL está em execução e se a porta está correta";
      } else if (
        errorCode === "ENOTFOUND" ||
        errorMessage.includes("getaddrinfo")
      ) {
        friendlyMessage =
          "Host não encontrado. Verifique se o endereço do servidor está correto";
      } else if (
        errorCode === "ER_ACCESS_DENIED_ERROR" ||
        errorMessage.includes("access denied")
      ) {
        friendlyMessage =
          "Acesso negado. Verifique se o usuário e senha estão corretos";
      } else if (
        errorCode === "ER_BAD_DB_ERROR" ||
        errorMessage.includes("unknown database")
      ) {
        friendlyMessage = `Banco de dados '${database}' não encontrado. Verifique se o banco existe no servidor`;
      } else if (errorMessage.includes("connection")) {
        friendlyMessage =
          "Erro ao conectar com o servidor. Verifique as credenciais e a conectividade de rede";
      }
    }

    return {
      success: false,
      error: friendlyMessage,
    };
  } finally {
    // Sempre fechar a conexão de teste
    if (prisma) {
      await prisma.$disconnect().catch(() => {
        // Ignorar erros ao desconectar
      });
    }
  }
}
