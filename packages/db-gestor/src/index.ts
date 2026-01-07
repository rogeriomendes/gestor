import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { LRUCache } from "lru-cache";

import { PrismaClient } from "../prisma/generated/client";

export type GestorPrismaClient = PrismaClient;

// Nome do banco de dados gestor
const DB_GESTOR_NAME = "bussolla_db";

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
const gestorClients = new LRUCache<string, PrismaClient>({
  max: CACHE_CONFIG.maxConnections,
  ttl: CACHE_CONFIG.ttlMs,
  updateAgeOnGet: true, // Renova TTL quando tenant faz request
  allowStale: false,

  // Chamado automaticamente quando item é removido do cache
  dispose: (client, tenantId, reason) => {
    console.log(
      `[db-gestor] Desconectando tenant ${tenantId} (razão: ${reason})`
    );
    client.$disconnect().catch((err) => {
      console.error(`[db-gestor] Erro ao desconectar tenant ${tenantId}:`, err);
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
 * Cria ou retorna um cliente Prisma para o db-gestor do tenant.
 * As credenciais devem ser passadas já descriptografadas.
 *
 * O cliente é armazenado em cache LRU com TTL de 30 minutos.
 * Conexões são fechadas automaticamente quando:
 * - O tenant fica inativo por mais de 30 minutos
 * - O número máximo de conexões é atingido (LRU eviction)
 */
export function getGestorClient(
  tenantId: string,
  config: MySQLConnectionConfig
): PrismaClient {
  const cached = gestorClients.get(tenantId);
  if (cached) {
    return cached;
  }

  const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port ?? 3306,
    user: config.user,
    password: config.password,
    database: DB_GESTOR_NAME,
  });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  gestorClients.set(tenantId, client);
  console.log(
    `[db-gestor] Nova conexão para tenant ${tenantId} (total: ${gestorClients.size}/${CACHE_CONFIG.maxConnections})`
  );

  return client;
}

/**
 * Fecha explicitamente a conexão de um tenant específico.
 */
export async function closeGestorClient(tenantId: string): Promise<void> {
  const client = gestorClients.get(tenantId);
  if (client) {
    await client.$disconnect();
    gestorClients.delete(tenantId);
  }
}

/**
 * Fecha todas as conexões ativas.
 * Útil para shutdown gracioso do servidor.
 */
export async function clearAllGestorClients(): Promise<void> {
  const disconnectPromises: Promise<void>[] = [];

  for (const [tenantId, client] of gestorClients.entries()) {
    disconnectPromises.push(
      client.$disconnect().catch((err) => {
        console.error(
          `[db-gestor] Erro ao desconectar tenant ${tenantId}:`,
          err
        );
      })
    );
  }

  await Promise.all(disconnectPromises);
  gestorClients.clear();
}

/**
 * Retorna estatísticas do cache de conexões.
 */
export function getGestorClientStats() {
  return {
    activeConnections: gestorClients.size,
    maxConnections: CACHE_CONFIG.maxConnections,
    ttlMinutes: CACHE_CONFIG.ttlMs / 1000 / 60,
  };
}
