import { auth } from "@gestor/auth";
import prisma from "@gestor/db";
import { AuditAction, AuditResourceType } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../lib/pagination";
import { createAuditLogFromContext } from "../utils/audit-log";
import { auditRouter } from "./audit";
import { branchRouter } from "./branch";
import { permissionRouter } from "./permission";

export const adminRouter = router({
  /**
   * Listar todos os tenants (com paginação)
   */
  listTenants: adminProcedure
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        deletedAt: null, // Apenas tenants não deletados
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { slug: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
        ...(input.active !== undefined && { active: input.active }),
      };

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { users: true },
            },
          },
        }),
        prisma.tenant.count({ where }),
      ]);

      return {
        data: tenants,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Obter detalhes de um tenant específico
   */
  getTenant: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          branches: {
            where: { deletedAt: null },
            orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
          },
        },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      return tenant;
    }),

  /**
   * Criar novo tenant
   */
  createTenant: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z
          .string()
          .min(1, "Slug is required")
          .regex(
            /^[a-z0-9-]+$/,
            "Slug must contain only lowercase letters, numbers, and hyphens"
          ),
        active: z.boolean().default(true),
        legalName: z.string().optional(),
        cnpj: z
          .string()
          .regex(/^\d{14}$/, "CNPJ must contain exactly 14 digits")
          .optional()
          .or(z.literal("")),
        email: z.string().email("Invalid email").optional().or(z.literal("")),
        phone: z.string().optional(),
        website: z.url("Invalid URL").optional().or(z.literal("")),
        addressStreet: z.string().optional(),
        addressNumber: z.string().optional(),
        addressComplement: z.string().optional(),
        addressDistrict: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z
          .string()
          .max(2, "State must be 2 characters (UF)")
          .optional(),
        addressZipCode: z
          .string()
          .regex(/^\d{8}$/, "CEP must contain exactly 8 digits")
          .optional()
          .or(z.literal("")),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se slug já existe
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: input.slug },
      });

      if (existingTenant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um tenant com este slug",
        });
      }

      // Criar tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          active: input.active,
          email: input.email && input.email.trim() !== "" ? input.email : null,
          phone: input.phone || null,
          website: input.website || null,
          notes: input.notes || null,
        },
      });

      // Registrar criação do tenant no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.CREATE_TENANT,
          resourceType: AuditResourceType.TENANT,
          resourceId: tenant.id,
          metadata: {
            name: tenant.name,
            slug: tenant.slug,
            active: tenant.active,
          },
        },
        ctx
      );

      // Criar primeira filial (matriz) automaticamente com os dados fornecidos
      // Se houver dados de endereço/CNPJ, criar a filial principal
      if (
        input.legalName ||
        input.cnpj ||
        input.addressStreet ||
        input.addressCity
      ) {
        const branch = await prisma.tenantBranch.create({
          data: {
            tenantId: tenant.id,
            name: input.name, // Nome da matriz
            isMain: true,
            legalName: input.legalName || null,
            cnpj: input.cnpj && input.cnpj.trim() !== "" ? input.cnpj : null,
            email:
              input.email && input.email.trim() !== "" ? input.email : null,
            phone: input.phone || null,
            addressStreet: input.addressStreet || null,
            addressNumber: input.addressNumber || null,
            addressComplement: input.addressComplement || null,
            addressDistrict: input.addressDistrict || null,
            addressCity: input.addressCity || null,
            addressState: input.addressState || null,
            addressZipCode:
              input.addressZipCode && input.addressZipCode.trim() !== ""
                ? input.addressZipCode
                : null,
            notes: input.notes || null,
            active: input.active,
          },
        });

        // Registrar criação da filial no audit log
        await createAuditLogFromContext(
          {
            action: AuditAction.CREATE_BRANCH,
            resourceType: AuditResourceType.BRANCH,
            resourceId: branch.id,
            metadata: {
              name: branch.name,
              isMain: branch.isMain,
              tenantId: tenant.id,
              tenantName: tenant.name,
            },
          },
          ctx
        );
      }

      // Retornar tenant com branches
      return await prisma.tenant.findUnique({
        where: { id: tenant.id },
        include: {
          branches: {
            where: { deletedAt: null },
            orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
          },
        },
      });
    }),

  /**
   * Atualizar tenant
   */
  updateTenant: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        name: z.string().min(1).optional(),
        slug: z
          .string()
          .min(1)
          .regex(
            /^[a-z0-9-]+$/,
            "Slug must contain only lowercase letters, numbers, and hyphens"
          )
          .optional(),
        active: z.boolean().optional(),
        email: z.email("Invalid email").optional().or(z.literal("")),
        phone: z.string().optional(),
        website: z.url("Invalid URL").optional().or(z.literal("")),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, ...updateData } = input;

      // Verificar se tenant existe
      const existingTenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!existingTenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      // Se está atualizando o slug, verificar se não existe outro tenant com esse slug
      if (updateData.slug && updateData.slug !== existingTenant.slug) {
        const slugExists = await prisma.tenant.findUnique({
          where: { slug: updateData.slug },
        });

        if (slugExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um tenant com este slug",
          });
        }
      }

      // Preparar dados para atualização (apenas campos que existem no Tenant)
      const updateFields: any = {};
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.slug !== undefined) updateFields.slug = updateData.slug;
      if (updateData.active !== undefined)
        updateFields.active = updateData.active;
      if (updateData.email !== undefined)
        updateFields.email =
          updateData.email && updateData.email.trim() !== ""
            ? updateData.email
            : null;
      if (updateData.phone !== undefined)
        updateFields.phone = updateData.phone || null;
      if (updateData.website !== undefined)
        updateFields.website =
          updateData.website && updateData.website.trim() !== ""
            ? updateData.website
            : null;
      if (updateData.notes !== undefined)
        updateFields.notes = updateData.notes || null;

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateFields,
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_TENANT,
          resourceType: AuditResourceType.TENANT,
          resourceId: tenant.id,
          metadata: {
            changes: updateFields,
            previousValues: {
              name: existingTenant.name,
              slug: existingTenant.slug,
              active: existingTenant.active,
            },
          },
        },
        ctx
      );

      return tenant;
    }),

  /**
   * Deletar tenant (soft delete - apenas super admin)
   */
  deleteTenant: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Apenas super admin pode deletar
      if (!ctx.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas SUPER_ADMIN pode deletar tenants",
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      if (tenant.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant já está deletado",
        });
      }

      // Soft delete
      const deletedTenant = await prisma.tenant.update({
        where: { id: input.tenantId },
        data: {
          deletedAt: new Date(),
          deletedBy: ctx.session.user.id,
          active: false,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.DELETE_TENANT,
          resourceType: AuditResourceType.TENANT,
          resourceId: tenant.id,
          metadata: {
            name: tenant.name,
            slug: tenant.slug,
            userCount: tenant._count.users,
          },
        },
        ctx
      );

      return deletedTenant;
    }),

  /**
   * Listar tenants deletados (lixeira)
   */
  listDeletedTenants: adminProcedure
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Apenas super admin pode ver lixeira
      if (!ctx.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas SUPER_ADMIN pode visualizar tenants deletados",
        });
      }

      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        deletedAt: { not: null }, // Apenas tenants deletados
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { slug: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take,
          orderBy: { deletedAt: "desc" },
          include: {
            _count: {
              select: { users: true },
            },
          },
        }),
        prisma.tenant.count({ where }),
      ]);

      // Buscar informações do usuário que deletou para cada tenant
      const tenantsWithDeletedBy = await Promise.all(
        tenants.map(async (tenant) => {
          let deletedByUser = null;
          if (tenant.deletedBy) {
            deletedByUser = await prisma.user.findUnique({
              where: { id: tenant.deletedBy },
              select: {
                id: true,
                name: true,
                email: true,
              },
            });
          }
          return {
            ...tenant,
            deletedByUser,
          };
        })
      );

      return {
        data: tenantsWithDeletedBy,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Restaurar tenant deletado (apenas super admin)
   */
  restoreTenant: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Apenas super admin pode restaurar
      if (!ctx.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas SUPER_ADMIN pode restaurar tenants",
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      if (!tenant.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não está deletado",
        });
      }

      // Restaurar tenant
      const restoredTenant = await prisma.tenant.update({
        where: { id: input.tenantId },
        data: {
          deletedAt: null,
          deletedBy: null,
          active: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.RESTORE_TENANT,
          resourceType: AuditResourceType.TENANT,
          resourceId: restoredTenant.id,
          metadata: {
            name: restoredTenant.name,
            slug: restoredTenant.slug,
          },
        },
        ctx
      );

      return restoredTenant;
    }),

  /**
   * Excluir permanentemente um tenant (apenas super admin)
   */
  permanentlyDeleteTenant: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Apenas super admin pode excluir permanentemente
      if (!ctx.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas SUPER_ADMIN pode deletar tenants permanentemente",
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
        include: {
          _count: {
            select: { users: true, branches: true },
          },
        },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      if (!tenant.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Tenant deve ser deletado (soft delete) antes da exclusão permanente",
        });
      }

      // Verificar se tem muitos dados (opcional: adicionar validação)
      // Por enquanto, apenas deletar

      // Exclusão permanente (cascade vai deletar relacionamentos)
      await prisma.tenant.delete({
        where: { id: input.tenantId },
      });

      return { success: true };
    }),

  /**
   * Listar todos os usuários de todos os tenants (com paginação)
   */
  listAllUsers: adminProcedure
    .input(
      paginationSchema.extend({
        tenantId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where: any = {
        ...(input.tenantId && { tenantId: input.tenantId }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { email: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: where as any,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            tenantId: true,
            createdAt: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.user.count({ where: where as any }),
      ]);

      return {
        data: users.map((user: any) => ({
          id: user.id,
          userId: user.id,
          role: user.role,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: user.createdAt,
          },
          tenant: user.tenant,
        })),
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Adicionar usuário a um tenant
   */
  addUserToTenant: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        userId: z.string(),
        role: z.enum(["TENANT_OWNER", "TENANT_USER_MANAGER", "TENANT_USER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se tenant existe
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant não encontrado",
        });
      }

      // Verificar se usuário existe
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      // Verificar se usuário já está em outro tenant
      if (user.tenantId && user.tenantId !== input.tenantId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Usuário já está associado a outro tenant",
        });
      }

      // Atualizar usuário
      const updatedUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          tenantId: input.tenantId,
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.CREATE_USER,
          resourceType: AuditResourceType.TENANT_USER,
          resourceId: updatedUser.id,
          metadata: {
            userId: updatedUser.id,
            userName: updatedUser.name,
            userEmail: updatedUser.email,
            tenantId: input.tenantId,
            tenantName: tenant.name,
            role: input.role,
          },
        },
        ctx
      );

      return updatedUser;
    }),

  /**
   * Remover usuário de um tenant
   */
  removeUserFromTenant: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se usuário existe e está no tenant
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      if (user.tenantId !== input.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não está associado a este tenant",
        });
      }

      // Remover associação (limpar tenantId e role)
      const updatedUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          tenantId: null,
          role: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.REMOVE_USER,
          resourceType: AuditResourceType.TENANT_USER,
          resourceId: user.id,
          metadata: {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            previousRole: user.role,
            tenantId: input.tenantId,
          },
        },
        ctx
      );

      return updatedUser;
    }),

  /**
   * Atualizar role de usuário em um tenant
   */
  updateUserRoleInTenant: adminProcedure
    .input(
      z.object({
        tenantId: z.string(),
        userId: z.string(),
        role: z.enum(["TENANT_OWNER", "TENANT_USER_MANAGER", "TENANT_USER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se usuário existe e está no tenant
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      if (user.tenantId !== input.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não está associado a este tenant",
        });
      }

      // Atualizar role
      const updatedUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_USER_ROLE,
          resourceType: AuditResourceType.TENANT_USER,
          resourceId: user.id,
          metadata: {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            previousRole: user.role,
            newRole: input.role,
            tenantId: input.tenantId,
          },
        },
        ctx
      );

      return updatedUser;
    }),

  /**
   * Listar usuários de um tenant específico
   */
  listTenantUsers: adminProcedure
    .input(
      paginationSchema.extend({
        tenantId: z.string(),
        search: z.string().optional(),
        role: z
          .enum(["TENANT_OWNER", "TENANT_USER_MANAGER", "TENANT_USER"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where: any = {
        tenantId: input.tenantId,
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { email: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
        ...(input.role && { role: input.role }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: where as any,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where: where as any }),
      ]);

      return {
        data: users,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Criar novo usuário
   */
  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Invalid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        tenantId: z.string().optional(),
        role: z
          .enum(["TENANT_OWNER", "TENANT_USER_MANAGER", "TENANT_USER"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Normalizar email para lowercase para evitar duplicatas
      const normalizedEmail = input.email.toLowerCase().trim();

      // Verificar se email já existe (usando email normalizado)
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um usuário com este email",
        });
      }

      // Verificar se tenant existe (se fornecido)
      if (input.tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: input.tenantId },
        });

        if (!tenant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tenant não encontrado",
          });
        }
      }

      // Usar a API do Admin plugin do Better Auth para criar o usuário
      // Isso cria o usuário sem fazer login e com hash correto da senha
      try {
        // Criar usuário usando o Admin plugin do Better Auth
        const createUserResult = await auth.api.createUser({
          body: {
            name: input.name,
            email: normalizedEmail, // Usar email normalizado
            password: input.password,
            // Passar role como string ou array
            role: input.role || undefined,
            // Passar tenantId como metadata ou campo customizado
            data: input.tenantId
              ? {
                  tenantId: input.tenantId,
                }
              : undefined,
          },
        });

        if (!createUserResult.user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criar usuário",
          });
        }

        // Atualizar o usuário com tenantId se fornecido
        // O Admin plugin não suporta campos customizados diretamente,
        // então precisamos atualizar manualmente
        let finalUser = createUserResult.user;
        if (input.tenantId) {
          finalUser = await prisma.user.update({
            where: { id: createUserResult.user.id },
            data: {
              tenantId: input.tenantId,
            },
          });
        }

        // Se role foi fornecido e não foi aplicado pelo plugin, atualizar
        if (input.role && finalUser.role !== input.role) {
          finalUser = await prisma.user.update({
            where: { id: finalUser.id },
            data: {
              role: input.role,
            },
          });
        }

        // Registrar criação do usuário no audit log
        await createAuditLogFromContext(
          {
            action: AuditAction.CREATE_USER,
            resourceType: input.tenantId
              ? AuditResourceType.TENANT_USER
              : AuditResourceType.USER,
            resourceId: finalUser.id,
            metadata: {
              name: finalUser.name,
              email: finalUser.email,
              role: finalUser.role,
              tenantId: input.tenantId || null,
            },
          },
          ctx
        );

        return {
          id: finalUser.id,
          name: finalUser.name,
          email: finalUser.email,
          image: finalUser.image || null,
          role: finalUser.role || null,
          tenantId: (finalUser as any).tenantId || null,
          createdAt: finalUser.createdAt,
        };
      } catch (error: any) {
        // Verificar se é erro de email duplicado
        const isDuplicateEmail =
          error.code === "P2002" || // Prisma unique constraint violation
          error.status === 409 || // HTTP Conflict
          (error.message &&
            (error.message.includes("already exists") ||
              error.message.includes("Unique constraint") ||
              error.message.includes("duplicate key")));

        if (isDuplicateEmail) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um usuário com este email",
          });
        }

        // Retornar mensagem de erro mais específica
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Falha ao criar usuário",
        });
      }
    }),

  /**
   * Obter estatísticas gerais do sistema (para dashboard)
   */
  getStats: adminProcedure.query(async () => {
    const [
      totalTenants,
      activeTenants,
      inactiveTenants,
      totalUsers,
      recentTenants,
      recentUsers,
    ] = await Promise.all([
      // Tenants
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.tenant.count({
        where: { deletedAt: null, active: true },
      }),
      prisma.tenant.count({
        where: { deletedAt: null, active: false },
      }),
      // Users
      prisma.user.count(),
      // Recent tenants
      prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: {
            select: { users: true, branches: true },
          },
        },
      }),
      // Recent users
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    // Calcular crescimento de tenants (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newTenantsLast30Days = await prisma.tenant.count({
      where: {
        deletedAt: null,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Calcular crescimento de usuários (últimos 30 dias)
    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        inactive: inactiveTenants,
        newLast30Days: newTenantsLast30Days,
      },
      users: {
        total: totalUsers,
        newLast30Days: newUsersLast30Days,
      },
      recentTenants,
      recentUsers,
    };
  }),
  branch: branchRouter,
  permission: permissionRouter,
  audit: auditRouter,
});
