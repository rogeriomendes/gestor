import {
  closeDfeClient,
  type DfePrismaClient,
  getDfeClient,
} from "@gestor/db-dfe";
import {
  closeGestorClient,
  type GestorPrismaClient,
  getGestorClient,
} from "@gestor/db-gestor";

import { decryptCredential } from "./encryption";
import prisma from "./index";

/**
 * Busca as credenciais do tenant e retorna o cliente Prisma para o db-gestor
 */
export async function getGestorClientForTenant(
  tenantId: string
): Promise<GestorPrismaClient> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      dbMysqlHost: true,
      dbMysqlPort: true,
      dbMysqlUsername: true,
      dbMysqlPassword: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  if (
    !(tenant.dbMysqlHost && tenant.dbMysqlUsername && tenant.dbMysqlPassword)
  ) {
    throw new Error(
      `db-gestor credentials not configured for tenant ${tenantId}`
    );
  }

  const decryptedPassword = decryptCredential(tenant.dbMysqlPassword);

  return getGestorClient(tenantId, {
    host: tenant.dbMysqlHost,
    port: tenant.dbMysqlPort ?? 3306,
    user: tenant.dbMysqlUsername,
    password: decryptedPassword,
  });
}

/**
 * Busca as credenciais do tenant e retorna o cliente Prisma para o db-dfe
 */
export async function getDfeClientForTenant(
  tenantId: string
): Promise<DfePrismaClient> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      dbMysqlHost: true,
      dbMysqlPort: true,
      dbMysqlUsername: true,
      dbMysqlPassword: true,
      dbDfeEnabled: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  if (!tenant.dbDfeEnabled) {
    throw new Error(`db-dfe is not enabled for tenant ${tenantId}`);
  }

  if (
    !(tenant.dbMysqlHost && tenant.dbMysqlUsername && tenant.dbMysqlPassword)
  ) {
    throw new Error(`db-dfe credentials not configured for tenant ${tenantId}`);
  }

  const decryptedPassword = decryptCredential(tenant.dbMysqlPassword);

  return getDfeClient(tenantId, {
    host: tenant.dbMysqlHost,
    port: tenant.dbMysqlPort ?? 3306,
    user: tenant.dbMysqlUsername,
    password: decryptedPassword,
  });
}

/**
 * Verifica se o tenant tem credenciais do db-gestor configuradas
 */
export async function hasGestorCredentials(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      dbMysqlHost: true,
      dbMysqlUsername: true,
      dbMysqlPassword: true,
    },
  });

  return !!(
    tenant?.dbMysqlHost &&
    tenant?.dbMysqlUsername &&
    tenant?.dbMysqlPassword
  );
}

/**
 * Verifica se o tenant tem db-dfe habilitado e configurado
 */
export async function hasDfeCredentials(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      dbMysqlHost: true,
      dbMysqlUsername: true,
      dbMysqlPassword: true,
      dbDfeEnabled: true,
    },
  });

  return !!(
    tenant?.dbDfeEnabled &&
    tenant?.dbMysqlHost &&
    tenant?.dbMysqlUsername &&
    tenant?.dbMysqlPassword
  );
}

/**
 * Fecha todas as conexões MySQL de um tenant (gestor e dfe)
 */
export async function closeAllTenantConnections(
  tenantId: string
): Promise<void> {
  await Promise.all([closeGestorClient(tenantId), closeDfeClient(tenantId)]);
}

// Re-exporta funções de limpeza, estatísticas e tipos
export {
  closeDfeClient,
  type DfePrismaClient,
  type getDfeClientStats,
} from "@gestor/db-dfe";

export {
  closeGestorClient,
  type GestorPrismaClient,
  type getGestorClientStats,
} from "@gestor/db-gestor";
