import prisma from "@gestor/db";
import { Role } from "@gestor/db/types";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import { clearPermissionCache } from "../middleware/permissions";

export const permissionRouter = router({
  /**
   * Listar todas as permissões disponíveis
   */
  listPermissions: adminProcedure.query(async () => {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return permissions;
  }),

  /**
   * Obter permissões de uma role específica
   */
  getRolePermissions: adminProcedure
    .input(z.object({ role: z.nativeEnum(Role) }))
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
   */
  updateRolePermissions: adminProcedure
    .input(
      z.object({
        role: z.nativeEnum(Role),
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
            grantedPermissions: input.permissions.filter((p) => p.granted)
              .length,
          },
        },
        ctx
      );

      return { success: true };
    }),

  /**
   * Inicializar permissões padrão (criar todas as permissões e atribuir às roles)
   */
  initializePermissions: adminProcedure.mutation(async ({ ctx }) => {
    // Limpar cache
    clearPermissionCache();

    // Definir todas as permissões possíveis
    const allPermissions = [
      // Tenant
      { resource: "TENANT", action: "CREATE", name: "Criar Tenants" },
      { resource: "TENANT", action: "READ", name: "Visualizar Tenants" },
      { resource: "TENANT", action: "UPDATE", name: "Editar Tenants" },
      { resource: "TENANT", action: "DELETE", name: "Deletar Tenants" },
      { resource: "TENANT", action: "MANAGE", name: "Gerenciar Tenants" },

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
      { resource: "SETTINGS", action: "UPDATE", name: "Editar Configurações" },
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

    // Registrar inicialização de permissões no audit log
    await createAuditLogFromContext(
      {
        action: AuditAction.INITIALIZE_PERMISSIONS,
        resourceType: AuditResourceType.PERMISSION,
        resourceId: "system",
        metadata: {
          totalPermissions: allPermissions.length,
          rolesConfigured: Object.keys(defaultPermissions).length,
        },
      },
      ctx
    );

    return { success: true, message: "Permissões inicializadas com sucesso" };
  }),
});
