import os from "node:os";
import process from "node:process";
import prisma from "@gestor/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../../index";
import { requirePermission } from "../../middleware/permissions";
import {
  closeAllConnections,
  closeConnection,
  getConnectionDetails,
  getConnectionStats,
  listConnections,
} from "../../utils/tenant-db-clients";

export const statusRouter = router({
  /**
   * Obter status do servidor
   * Requer permissão STATUS:READ
   */
  getServerStatus: adminProcedure
    .use(requirePermission("STATUS", "READ"))
    .query(() => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Calcular porcentagem de uso de memória
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
      const heapFreeMB =
        (memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024;
      const rssMB = memoryUsage.rss / 1024 / 1024;
      const heapUsedPercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // Calcular uso de CPU (aproximado)
      const cpuPercent = 0; // Seria necessário calcular com base em intervalos

      // Obter estatísticas de conexões
      const connectionStats = getConnectionStats();

      return {
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          heapFree: memoryUsage.heapTotal - memoryUsage.heapUsed,
          rss: memoryUsage.rss,
          external: memoryUsage.external,
          heapUsedMB: Math.round(heapUsedMB * 100) / 100,
          heapTotalMB: Math.round(heapTotalMB * 100) / 100,
          heapFreeMB: Math.round(heapFreeMB * 100) / 100,
          rssMB: Math.round(rssMB * 100) / 100,
          heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          percent: cpuPercent,
        },
        pools: {
          gestor: {
            active: connectionStats.byDatabase.gestor,
            available: connectionStats.maxSize - connectionStats.total,
            total: connectionStats.total,
          },
          dfe: {
            active: connectionStats.byDatabase.dfe,
            available: connectionStats.maxSize - connectionStats.total,
            total: connectionStats.total,
          },
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        loadAverage: os.loadavg(),
      };
    }),

  /**
   * Listar todas as conexões ativas
   * Requer permissão STATUS:READ
   */
  listConnections: adminProcedure
    .use(requirePermission("STATUS", "READ"))
    .query(async () => {
      const connections = listConnections();

      // Buscar informações dos tenants (nome) em batch
      const tenantIds = [...new Set(connections.map((conn) => conn.tenantId))];
      const tenants = await prisma.tenant.findMany({
        where: {
          id: { in: tenantIds },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

      return connections.map((conn) => ({
        connectionId: conn.connectionId,
        tenantId: conn.tenantId,
        tenantName: tenantMap.get(conn.tenantId) || "Cliente não encontrado",
        database: conn.database,
        createdAt: conn.createdAt.toISOString(),
        lastUsedAt: conn.lastUsedAt.toISOString(),
        timeActive: Math.floor((Date.now() - conn.createdAt.getTime()) / 1000), // segundos
      }));
    }),

  /**
   * Obter detalhes de uma conexão específica
   * Requer permissão STATUS:READ
   */
  getConnectionDetails: adminProcedure
    .use(requirePermission("STATUS", "READ"))
    .input(z.object({ connectionId: z.string() }))
    .query(({ input }) => {
      const connection = getConnectionDetails(input.connectionId);
      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conexão não encontrada",
        });
      }

      return {
        connectionId: connection.connectionId,
        tenantId: connection.tenantId,
        database: connection.database,
        createdAt: connection.createdAt.toISOString(),
        lastUsedAt: connection.lastUsedAt.toISOString(),
        timeActive: Math.floor(
          (Date.now() - connection.createdAt.getTime()) / 1000
        ),
      };
    }),

  /**
   * Fechar uma conexão específica
   * Requer permissão STATUS:MANAGE
   */
  closeConnection: adminProcedure
    .use(requirePermission("STATUS", "MANAGE"))
    .input(z.object({ connectionId: z.string() }))
    .mutation(({ input }) => {
      const closed = closeConnection(input.connectionId);
      if (!closed) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conexão não encontrada",
        });
      }
      return { success: true };
    }),

  /**
   * Fechar todas as conexões
   * Requer permissão STATUS:MANAGE
   */
  closeAllConnections: adminProcedure
    .use(requirePermission("STATUS", "MANAGE"))
    .mutation(() => {
      const count = closeAllConnections();
      return { success: true, closedCount: count };
    }),

  /**
   * Obter estatísticas de conexões
   * Requer permissão STATUS:READ
   */
  getConnectionStats: adminProcedure
    .use(requirePermission("STATUS", "READ"))
    .query(() => {
      return getConnectionStats();
    }),

  /**
   * Limpar cache (fecha todas as conexões)
   * Requer permissão STATUS:MANAGE
   */
  clearCache: adminProcedure
    .use(requirePermission("STATUS", "MANAGE"))
    .mutation(() => {
      const count = closeAllConnections();
      return { success: true, clearedCount: count };
    }),
});
