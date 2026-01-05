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
      const allPermissions = [
        // Tenant
        { resource: "TENANT", action: "CREATE", name: "Criar Clientes" },
        { resource: "TENANT", action: "READ", name: "Visualizar Clientes" },
        { resource: "TENANT", action: "UPDATE", name: "Editar Clientes" },
        { resource: "TENANT", action: "DELETE", name: "Deletar Clientes" },
        { resource: "TENANT", action: "MANAGE", name: "Gerenciar Clientes" },

        // User
        { resource: "USER", action: "CREATE", name: "Criar Usuários" },
        { resource: "USER", action: "READ", name: "Visualizar Usuários" },
        { resource: "USER", action: "UPDATE", name: "Editar Usuários" },
        { resource: "USER", action: "DELETE", name: "Deletar Usuários" },
        { resource: "USER", action: "MANAGE", name: "Gerenciar Usuários" },

        // Branch
        { resource: "BRANCH", action: "CREATE", name: "Criar Filiais" },
        { resource: "BRANCH", action: "READ", name: "Visualizar Filiais" },
        { resource: "BRANCH", action: "UPDATE", name: "Editar Filiais" },
        { resource: "BRANCH", action: "DELETE", name: "Deletar Filiais" },
        { resource: "BRANCH", action: "MANAGE", name: "Gerenciar Filiais" },

        // Settings
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

        // Audit Log
        {
          resource: "AUDIT_LOG",
          action: "READ",
          name: "Visualizar Logs de Auditoria",
        },
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
      const defaultPermissions: Record<Role, string[]> = {
        SUPER_ADMIN: [], // SUPER_ADMIN tem todas as permissões (verificado no middleware)
        TENANT_ADMIN: [
          "TENANT:MANAGE",
          "USER:MANAGE",
          "BRANCH:MANAGE",
          "SETTINGS:MANAGE",
          "DASHBOARD:READ",
          "AUDIT_LOG:READ",
        ],
        TENANT_OWNER: [
          "USER:MANAGE",
          "BRANCH:MANAGE",
          "SETTINGS:MANAGE",
          "DASHBOARD:READ",
        ],
        TENANT_USER_MANAGER: [
          "USER:CREATE",
          "USER:READ",
          "USER:UPDATE",
          "USER:DELETE",
          "DASHBOARD:READ",
        ],
        TENANT_USER: ["DASHBOARD:READ", "SETTINGS:READ"],
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
            (p): p is { name: string; resource: string; action: string } =>
              p !== null
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
