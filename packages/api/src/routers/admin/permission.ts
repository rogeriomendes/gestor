import prisma from "@gestor/db";
import { AuditAction, AuditResourceType, Role } from "@gestor/db/types";
import { z } from "zod";

import { adminProcedure, router } from "../../index";
import {
  clearPermissionCache,
  requirePermission,
} from "../../middleware/permissions";
import { createAuditLogFromContext } from "../../utils/audit-log";

export const permissionRouter = router({
  /**
   * Listar todas as permissões disponíveis
   * Requer permissão SETTINGS:READ
   */
  listPermissions: adminProcedure
    .use(requirePermission("SETTINGS", "READ"))
    .query(async () => {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      return permissions;
    }),

  /**
   * Verificar se as permissões precisam ser inicializadas/atualizadas
   * Retorna true se faltam as novas permissões (PLAN, SUBSCRIPTION, STATUS)
   */
  checkPermissionsStatus: adminProcedure
    .use(requirePermission("SETTINGS", "READ"))
    .query(async () => {
      const permissions = await prisma.permission.findMany({
        select: { resource: true },
      });

      const uniqueResources = new Set(permissions.map((p) => p.resource));

      // Verificar se existem as novas permissões (PLAN, SUBSCRIPTION, STATUS)
      const hasPlan = uniqueResources.has("PLAN");
      const hasSubscription = uniqueResources.has("SUBSCRIPTION");
      const hasStatus = uniqueResources.has("STATUS");

      const needsInitialization =
        permissions.length > 0 && !(hasPlan && hasSubscription && hasStatus);

      return {
        needsInitialization,
        missingResources: [
          !hasPlan && "PLAN",
          !hasSubscription && "SUBSCRIPTION",
          !hasStatus && "STATUS",
        ].filter(Boolean) as string[],
      };
    }),

  /**
   * Obter permissões de uma role específica
   * Requer permissão SETTINGS:READ
   */
  getRolePermissions: adminProcedure
    .use(requirePermission("SETTINGS", "READ"))
    .input(z.object({ role: z.enum(Role) }))
    .query(async ({ input }) => {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: input.role,
        },
        include: {
          permission: true,
        },
        orderBy: {
          permission: {
            resource: "asc",
          },
        },
      });

      return rolePermissions;
    }),

  /**
   * Atualizar permissões de uma role
   * Requer permissão SETTINGS:MANAGE
   */
  updateRolePermissions: adminProcedure
    .use(requirePermission("SETTINGS", "MANAGE"))
    .input(
      z.object({
        role: z.enum(Role),
        permissions: z.array(
          z.object({
            permissionId: z.string(),
            granted: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Limpar cache
      clearPermissionCache();

      // Buscar informações das permissões para o log
      const permissionIds = input.permissions.map((p) => p.permissionId);
      const permissionsDetails = await prisma.permission.findMany({
        where: {
          id: {
            in: permissionIds,
          },
        },
      });

      const permissionsMap = new Map(permissionsDetails.map((p) => [p.id, p]));

      // Separar permissões concedidas e negadas
      const grantedPermissions = input.permissions
        .filter((p) => p.granted)
        .map((p) => {
          const perm = permissionsMap.get(p.permissionId);
          return {
            id: p.permissionId,
            name: perm?.name || "Desconhecida",
            resource: perm?.resource || "UNKNOWN",
            action: perm?.action || "UNKNOWN",
          };
        });

      const deniedPermissions = input.permissions
        .filter((p) => !p.granted)
        .map((p) => {
          const perm = permissionsMap.get(p.permissionId);
          return {
            id: p.permissionId,
            name: perm?.name || "Desconhecida",
            resource: perm?.resource || "UNKNOWN",
            action: perm?.action || "UNKNOWN",
          };
        });

      // Deletar todas as permissões existentes da role
      await prisma.rolePermission.deleteMany({
        where: {
          role: input.role,
        },
      });

      // Criar novas permissões
      if (input.permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: input.permissions.map((p) => ({
            role: input.role,
            permissionId: p.permissionId,
            granted: p.granted,
          })),
        });
      }

      // Registrar atualização de permissões no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_PERMISSIONS,
          resourceType: AuditResourceType.PERMISSION,
          resourceId: input.role,
          metadata: {
            role: input.role,
            permissionsCount: input.permissions.length,
            grantedCount: grantedPermissions.length,
            deniedCount: deniedPermissions.length,
            grantedPermissions,
            deniedPermissions,
          },
        },
        ctx
      );

      return { success: true };
    }),

  /**
   * Inicializar permissões padrão (criar todas as permissões e atribuir às roles)
   * Requer permissão SETTINGS:MANAGE
   */
  initializePermissions: adminProcedure
    .use(requirePermission("SETTINGS", "MANAGE"))
    .mutation(async ({ ctx }) => {
      // Limpar cache
      clearPermissionCache();

      // Definir todas as permissões possíveis
      // Separadas por área: Admin e Tenant
      const allPermissions = [
        // ========== PERMISSÕES DA ÁREA ADMIN ==========
        // Tenant (Clientes)
        { resource: "TENANT", action: "CREATE", name: "Criar Clientes" },
        { resource: "TENANT", action: "READ", name: "Visualizar Clientes" },
        { resource: "TENANT", action: "UPDATE", name: "Editar Clientes" },
        { resource: "TENANT", action: "DELETE", name: "Deletar Clientes" },
        { resource: "TENANT", action: "MANAGE", name: "Gerenciar Clientes" },

        // User (Usuários)
        { resource: "USER", action: "CREATE", name: "Criar Usuários" },
        { resource: "USER", action: "READ", name: "Visualizar Usuários" },
        { resource: "USER", action: "UPDATE", name: "Editar Usuários" },
        { resource: "USER", action: "DELETE", name: "Deletar Usuários" },
        { resource: "USER", action: "MANAGE", name: "Gerenciar Usuários" },

        // Plan (Planos)
        { resource: "PLAN", action: "CREATE", name: "Criar Planos" },
        { resource: "PLAN", action: "READ", name: "Visualizar Planos" },
        { resource: "PLAN", action: "UPDATE", name: "Editar Planos" },
        { resource: "PLAN", action: "DELETE", name: "Deletar Planos" },
        { resource: "PLAN", action: "MANAGE", name: "Gerenciar Planos" },

        // Subscription (Assinaturas)
        {
          resource: "SUBSCRIPTION",
          action: "CREATE",
          name: "Criar Assinaturas",
        },
        {
          resource: "SUBSCRIPTION",
          action: "READ",
          name: "Visualizar Assinaturas",
        },
        {
          resource: "SUBSCRIPTION",
          action: "UPDATE",
          name: "Editar Assinaturas",
        },
        {
          resource: "SUBSCRIPTION",
          action: "DELETE",
          name: "Deletar Assinaturas",
        },
        {
          resource: "SUBSCRIPTION",
          action: "MANAGE",
          name: "Gerenciar Assinaturas",
        },

        // Status (Status do Sistema)
        { resource: "STATUS", action: "READ", name: "Visualizar Status" },
        { resource: "STATUS", action: "MANAGE", name: "Gerenciar Status" },

        // Audit Log (Logs de Auditoria)
        {
          resource: "AUDIT_LOG",
          action: "READ",
          name: "Visualizar Logs de Auditoria",
        },

        // ========== PERMISSÕES DA ÁREA TENANT ==========
        // Branch (Filiais)
        { resource: "BRANCH", action: "CREATE", name: "Criar Filiais" },
        { resource: "BRANCH", action: "READ", name: "Visualizar Filiais" },
        { resource: "BRANCH", action: "UPDATE", name: "Editar Filiais" },
        { resource: "BRANCH", action: "DELETE", name: "Deletar Filiais" },
        { resource: "BRANCH", action: "MANAGE", name: "Gerenciar Filiais" },

        // Settings (Configurações)
        {
          resource: "SETTINGS",
          action: "READ",
          name: "Visualizar Configurações",
        },
        {
          resource: "SETTINGS",
          action: "UPDATE",
          name: "Editar Configurações",
        },
        {
          resource: "SETTINGS",
          action: "MANAGE",
          name: "Gerenciar Configurações",
        },

        // Dashboard
        { resource: "DASHBOARD", action: "READ", name: "Visualizar Dashboard" },
      ];

      // Criar ou atualizar permissões
      for (const perm of allPermissions) {
        await prisma.permission.upsert({
          where: {
            resource_action: {
              resource: perm.resource as any,
              action: perm.action as any,
            },
          },
          update: {
            name: perm.name,
          },
          create: {
            resource: perm.resource as any,
            action: perm.action as any,
            name: perm.name,
          },
        });
      }

      // Definir permissões padrão por role
      // Separadas por área: Admin e Tenant
      const defaultPermissions: Record<Role, string[]> = {
        SUPER_ADMIN: [], // SUPER_ADMIN tem todas as permissões (verificado no middleware)

        // TENANT_ADMIN: Acesso completo à área admin
        TENANT_ADMIN: [
          // Admin
          "TENANT:MANAGE",
          "USER:MANAGE",
          "PLAN:MANAGE",
          "SUBSCRIPTION:MANAGE",
          "STATUS:READ",
          "AUDIT_LOG:READ",
          // Tenant
          "BRANCH:MANAGE",
          "SETTINGS:MANAGE",
          "DASHBOARD:READ",
        ],

        // TENANT_OWNER: Acesso à área tenant (gerenciamento do próprio tenant)
        TENANT_OWNER: [
          // Tenant
          "USER:MANAGE",
          "BRANCH:MANAGE",
          "SETTINGS:MANAGE",
          "DASHBOARD:READ",
        ],

        // TENANT_USER_MANAGER: Pode gerenciar usuários do tenant
        TENANT_USER_MANAGER: [
          // Tenant
          "USER:CREATE",
          "USER:READ",
          "USER:UPDATE",
          "USER:DELETE",
          "DASHBOARD:READ",
        ],

        // TENANT_USER: Acesso básico (apenas visualização)
        TENANT_USER: [
          // Tenant
          "DASHBOARD:READ",
          "SETTINGS:READ",
        ],
      };

      // Aplicar permissões padrão
      for (const [role, permissionKeys] of Object.entries(defaultPermissions)) {
        if (role === "SUPER_ADMIN") continue; // SUPER_ADMIN não precisa de permissões explícitas

        // Buscar IDs das permissões
        const permissions = await Promise.all(
          permissionKeys.map(async (key) => {
            const [resource, action] = key.split(":");
            const permission = await prisma.permission.findUnique({
              where: {
                resource_action: {
                  resource: resource as any,
                  action: action as any,
                },
              },
            });
            return permission?.id;
          })
        );

        // Remover permissões antigas da role
        await prisma.rolePermission.deleteMany({
          where: {
            role: role as Role,
          },
        });

        // Criar novas permissões
        const validPermissionIds = permissions.filter(
          (id): id is string => id !== undefined
        );

        if (validPermissionIds.length > 0) {
          await prisma.rolePermission.createMany({
            data: validPermissionIds.map((permissionId) => ({
              role: role as Role,
              permissionId,
              granted: true,
            })),
          });
        }
      }

      // Buscar informações das permissões criadas para o log
      const createdPermissions = await prisma.permission.findMany({
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      // Preparar detalhes das permissões por role
      const rolePermissionsDetails: Record<
        string,
        Array<{ name: string; resource: string; action: string }>
      > = {};

      for (const [role, permissionKeys] of Object.entries(defaultPermissions)) {
        if (role === "SUPER_ADMIN") continue;

        const rolePerms = permissionKeys
          .map((key) => {
            const [resource, action] = key.split(":");
            const perm = createdPermissions.find(
              (p) => p.resource === resource && p.action === action
            );
            return perm
              ? {
                  name: perm.name,
                  resource: perm.resource,
                  action: perm.action,
                }
              : null;
          })
          .filter(
            (p): p is { name: string; resource: any; action: any } => p !== null
          );

        rolePermissionsDetails[role] = rolePerms;
      }

      // Registrar inicialização de permissões no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.INITIALIZE_PERMISSIONS,
          resourceType: AuditResourceType.PERMISSION,
          resourceId: "system",
          metadata: {
            totalPermissions: allPermissions.length,
            rolesConfigured: Object.keys(defaultPermissions).length,
            permissionsByRole: rolePermissionsDetails,
            allPermissions: createdPermissions.map((p) => ({
              name: p.name,
              resource: p.resource,
              action: p.action,
            })),
          },
        },
        ctx
      );

      return { success: true, message: "Permissões inicializadas com sucesso" };
    }),
});
