import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { LRUCache } from "lru-cache";

import { PrismaClient } from "../prisma/generated/client";

export type DfePrismaClient = PrismaClient;

// Nome do banco de dados dfe
const DB_DFE_NAME = "opytex_db_dfe";

// Configuração do cache
const CACHE_CONFIG = {
  /** Número máximo de conexões simultâneas de tenants */
  maxConnections: 50,
  /** Tempo de inatividade antes de fechar conexão (30 minutos) */
  ttlMs: 1000 * 60 * 30,
};

/**
 * LRU Cache para gerenciar conexões de clientes Prisma por tenant.
 *
 * Benefícios:
 * - Limita número máximo de conexões ativas (evita esgotar recursos)
 * - Fecha automaticamente conexões de tenants inativos após TTL
 * - Renova TTL quando tenant faz nova requisição
 * - Graceful disconnect quando conexão é removida do cache
 */
const dfeClients = new LRUCache<string, PrismaClient>({
  max: CACHE_CONFIG.maxConnections,
  ttl: CACHE_CONFIG.ttlMs,
  updateAgeOnGet: true, // Renova TTL quando tenant faz request
  allowStale: false,

  // Chamado automaticamente quando item é removido do cache
  dispose: (client, tenantId, reason) => {
    console.log(`[db-dfe] Desconectando tenant ${tenantId} (razão: ${reason})`);
    client.$disconnect().catch((err) => {
      console.error(`[db-dfe] Erro ao desconectar tenant ${tenantId}:`, err);
    });
  },
});

interface MySQLConnectionConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
}

/**
 * Cria ou retorna um cliente Prisma para o db-dfe do tenant.
 * As credenciais devem ser passadas já descriptografadas.
 *
 * O cliente é armazenado em cache LRU com TTL de 30 minutos.
 * Conexões são fechadas automaticamente quando:
 * - O tenant fica inativo por mais de 30 minutos
 * - O número máximo de conexões é atingido (LRU eviction)
 */
export function getDfeClient(
  tenantId: string,
  config: MySQLConnectionConfig
): PrismaClient {
  const cached = dfeClients.get(tenantId);
  if (cached) {
    return cached;
  }

  const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port ?? 3306,
    user: config.user,
    password: config.password,
    database: DB_DFE_NAME,
  });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  dfeClients.set(tenantId, client);
  console.log(
    `[db-dfe] Nova conexão para tenant ${tenantId} (total: ${dfeClients.size}/${CACHE_CONFIG.maxConnections})`
  );

  return client;
}

/**
 * Fecha explicitamente a conexão de um tenant específico.
 */
export async function closeDfeClient(tenantId: string): Promise<void> {
  const client = dfeClients.get(tenantId);
  if (client) {
    await client.$disconnect();
    dfeClients.delete(tenantId);
  }
}

/**
 * Fecha todas as conexões ativas.
 * Útil para shutdown gracioso do servidor.
 */
export async function clearAllDfeClients(): Promise<void> {
  const disconnectPromises: Promise<void>[] = [];

  for (const [tenantId, client] of dfeClients.entries()) {
    disconnectPromises.push(
      client.$disconnect().catch((err) => {
        console.error(`[db-dfe] Erro ao desconectar tenant ${tenantId}:`, err);
      })
    );
  }

  await Promise.all(disconnectPromises);
  dfeClients.clear();
}

/**
 * Retorna estatísticas do cache de conexões.
 */
export function getDfeClientStats() {
  return {
    activeConnections: dfeClients.size,
    maxConnections: CACHE_CONFIG.maxConnections,
    ttlMinutes: CACHE_CONFIG.ttlMs / 1000 / 60,
  };
}
