import prisma from "@gestor/db";
import { AuditAction, AuditResourceType } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";
import { createAuditLogFromContext } from "../../utils/audit-log";

export const tenantsRouter = router({
  /**
   * Listar todos os tenants (com paginação)
   */
  list: adminProcedure
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
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
  get: adminProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input }) => {
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
  create: adminProcedure
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
        email: z.email("Invalid email").optional().or(z.literal("")),
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
  update: adminProcedure
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
  delete: adminProcedure
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
  listDeleted: adminProcedure
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
  restore: adminProcedure
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
  permanentlyDelete: adminProcedure
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
});
