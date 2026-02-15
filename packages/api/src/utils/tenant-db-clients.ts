import { createDfePrismaClient } from "@gestor/db-dfe";
import { createGestorPrismaClient } from "@gestor/db-gestor";
import type { Tenant } from "@gestor/db/types";
import { LRUCache } from "lru-cache";
import { decryptPassword } from "./encryption";
import { hasCompleteDatabaseCredentials } from "./tenant-db-credentials";

// Tipo genérico para PrismaClient (pode ser de qualquer package: db, db-gestor, db-dfe)
interface PrismaClientLike {
  $disconnect: () => Promise<void>;
}
type PrismaClient = PrismaClientLike;

/** Tipo do cliente Prisma do banco gestor (com modelos conta_caixa, etc.) */
export type GestorPrismaClient = ReturnType<typeof createGestorPrismaClient>;

/** Tipo do cliente Prisma do banco DFE (com modelo dfe) */
export type DfePrismaClient = ReturnType<typeof createDfePrismaClient>;

export interface ConnectionMetadata {
  connectionId: string;
  tenantId: string;
  database: "gestor" | "dfe";
  createdAt: Date;
  lastUsedAt: Date;
  prismaClient: PrismaClient;
}

// Cache LRU para gerenciar conexões
// Tamanho máximo configurável via variável de ambiente (padrão: 100)
const MAX_CACHE_SIZE =
  Number.parseInt(process.env.MAX_DB_CONNECTIONS_CACHE_SIZE || "100", 10) ||
  100;

const connectionCache = new LRUCache<string, ConnectionMetadata>({
  max: MAX_CACHE_SIZE,
  ttl: 1000 * 60 * 30, // 30 minutos de TTL
  updateAgeOnGet: true, // Atualizar lastUsedAt ao acessar
  dispose: (value) => {
    // Fechar conexão quando removida do cache
    if (value?.prismaClient) {
      value.prismaClient.$disconnect().catch((error: unknown) => {
        console.error("Erro ao desconectar Prisma Client:", error);
      });
    }
  },
});

/**
 * Gera uma chave única para o cache baseada no tenant e banco
 */
function getCacheKey(tenantId: string, database: "gestor" | "dfe"): string {
  return `${tenantId}:${database}`;
}

/**
 * Obtém ou cria um Prisma Client para o banco gestor (bussolla_db)
 */
export function getGestorPrismaClient(tenant: Tenant): GestorPrismaClient {
  if (!hasCompleteDatabaseCredentials(tenant)) {
    throw new Error(
      "Tenant não possui credenciais completas de banco de dados"
    );
  }

  const cacheKey = getCacheKey(tenant.id, "gestor");
  const cached = connectionCache.get(cacheKey);

  if (cached) {
    // Atualizar lastUsedAt
    cached.lastUsedAt = new Date();
    return cached.prismaClient as GestorPrismaClient;
  }

  // Descriptografar senha
  if (!tenant.dbPassword) {
    throw new Error("Senha do banco de dados não encontrada");
  }
  const password = decryptPassword(tenant.dbPassword);

  // Criar novo cliente
  if (!(tenant.dbHost && tenant.dbPort && tenant.dbUsername)) {
    throw new Error("Credenciais do banco de dados incompletas");
  }
  const prismaClient = createGestorPrismaClient(
    tenant.dbHost,
    tenant.dbPort,
    tenant.dbUsername,
    password
  );

  // Armazenar no cache
  const metadata: ConnectionMetadata = {
    connectionId: cacheKey,
    tenantId: tenant.id,
    database: "gestor",
    createdAt: new Date(),
    lastUsedAt: new Date(),
    prismaClient,
  };

  connectionCache.set(cacheKey, metadata);

  return prismaClient;
}

/**
 * Obtém ou cria um Prisma Client para o banco DFE (opytex_db_dfe)
 */
export function getDfePrismaClient(tenant: Tenant): DfePrismaClient {
  if (!hasCompleteDatabaseCredentials(tenant)) {
    throw new Error(
      "Tenant não possui credenciais completas de banco de dados"
    );
  }

  const cacheKey = getCacheKey(tenant.id, "dfe");
  const cached = connectionCache.get(cacheKey);

  if (cached) {
    // Atualizar lastUsedAt
    cached.lastUsedAt = new Date();
    return cached.prismaClient as DfePrismaClient;
  }

  // Descriptografar senha
  if (!tenant.dbPassword) {
    throw new Error("Senha do banco de dados não encontrada");
  }
  const password = decryptPassword(tenant.dbPassword);

  // Criar novo cliente
  if (!(tenant.dbHost && tenant.dbPort && tenant.dbUsername)) {
    throw new Error("Credenciais do banco de dados incompletas");
  }
  const prismaClient = createDfePrismaClient(
    tenant.dbHost,
    tenant.dbPort,
    tenant.dbUsername,
    password
  );

  // Armazenar no cache
  const metadata: ConnectionMetadata = {
    connectionId: cacheKey,
    tenantId: tenant.id,
    database: "dfe",
    createdAt: new Date(),
    lastUsedAt: new Date(),
    prismaClient,
  };

  connectionCache.set(cacheKey, metadata);

  return prismaClient;
}

/**
 * Lista todas as conexões ativas no cache
 */
export function listConnections(): ConnectionMetadata[] {
  const connections: ConnectionMetadata[] = [];
  for (const [, value] of connectionCache.entries()) {
    connections.push(value);
  }
  return connections;
}

/**
 * Obtém detalhes de uma conexão específica
 */
export function getConnectionDetails(
  connectionId: string
): ConnectionMetadata | null {
  return connectionCache.get(connectionId) || null;
}

/**
 * Fecha uma conexão específica e remove do cache
 */
export function closeConnection(connectionId: string): boolean {
  const connection = connectionCache.get(connectionId);
  if (!connection) {
    return false;
  }

  // Desconectar Prisma Client
  connection.prismaClient.$disconnect().catch((error: unknown) => {
    console.error("Erro ao desconectar Prisma Client:", error);
  });

  // Remover do cache
  connectionCache.delete(connectionId);
  return true;
}

/**
 * Fecha todas as conexões e limpa o cache
 */
export function closeAllConnections(): number {
  const count = connectionCache.size;
  for (const [, value] of connectionCache.entries()) {
    value.prismaClient.$disconnect().catch((error: unknown) => {
      console.error("Erro ao desconectar Prisma Client:", error);
    });
  }
  connectionCache.clear();
  return count;
}

/**
 * Fecha todas as conexões de um tenant específico
 * Útil quando as credenciais são atualizadas ou o tenant é deletado
 */
export function closeTenantConnections(tenantId: string): number {
  const connections = listConnections();
  const tenantConnections = connections.filter(
    (conn) => conn.tenantId === tenantId
  );

  for (const conn of tenantConnections) {
    conn.prismaClient.$disconnect().catch((error: unknown) => {
      console.error("Erro ao desconectar Prisma Client:", error);
    });
    connectionCache.delete(conn.connectionId);
  }

  return tenantConnections.length;
}

/**
 * Obtém estatísticas do cache de conexões
 */
export function getConnectionStats() {
  const connections = listConnections();
  const byTenant = new Map<string, number>();
  const byDatabase = { gestor: 0, dfe: 0 };

  for (const conn of connections) {
    byTenant.set(conn.tenantId, (byTenant.get(conn.tenantId) || 0) + 1);
    byDatabase[conn.database]++;
  }

  return {
    total: connections.length,
    maxSize: MAX_CACHE_SIZE,
    byTenant: Object.fromEntries(byTenant),
    byDatabase,
  };
}
