import prisma from "@gestor/db";
import type { AuditAction, AuditResourceType } from "@gestor/db/types";

export interface CreateAuditLogParams {
  action: AuditAction;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
  resourceId: string;
  resourceType: AuditResourceType;
  tenantId?: string | null;
  userAgent?: string | null;
  userId: string;
}

/**
 * Cria um registro de audit log
 * Esta função não deve lançar erros para não interromper o fluxo principal
 */
export async function createAuditLog(
  params: CreateAuditLogParams
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        userId: params.userId,
        tenantId: params.tenantId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Log do erro mas não interrompe o fluxo
    console.error("[Audit Log] Erro ao criar log:", error);
  }
}

/**
 * Helper para criar audit log a partir do contexto tRPC
 */
export async function createAuditLogFromContext(
  params: Omit<
    CreateAuditLogParams,
    "userId" | "tenantId" | "ipAddress" | "userAgent"
  >,
  context: {
    session: { user: { id: string } } | null;
    tenant: { id: string } | null;
  }
): Promise<void> {
  if (!context.session?.user?.id) {
    return; // Não criar log se não houver usuário autenticado
  }

  await createAuditLog({
    ...params,
    userId: context.session.user.id,
    tenantId: context.tenant?.id || null,
    ipAddress: null, // IP e User-Agent podem ser adicionados depois via middleware
    userAgent: null,
  });
}
