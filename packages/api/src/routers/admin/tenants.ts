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
import { requirePermission } from "../../middleware/permissions";
import { createAuditLogFromContext } from "../../utils/audit-log";
import {
  testDatabaseConnection,
  validateConnectionParams,
} from "../../utils/db-connection-validator";
import { decryptPassword, encryptPassword } from "../../utils/encryption";
import { closeTenantConnections } from "../../utils/tenant-db-clients";

export const tenantsRouter = router({
  /**
   * Listar todos os tenants (com paginação)
   * Requer permissão TENANT:READ
   */
  list: adminProcedure
    .use(requirePermission("TENANT", "READ"))
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
   * Requer permissão TENANT:READ
   */
  get: adminProcedure
    .use(requirePermission("TENANT", "READ"))
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
          message: "Cliente não encontrado",
        });
      }

      return tenant;
    }),

  /**
   * Criar novo tenant
   * Requer permissão TENANT:CREATE
   */
  create: adminProcedure
    .use(requirePermission("TENANT", "CREATE"))
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
        // Credenciais de banco de dados
        dbHost: z.string().optional().or(z.literal("")),
        dbPort: z.string().optional().or(z.literal("")),
        dbUsername: z.string().optional().or(z.literal("")),
        dbPassword: z.string().optional().or(z.literal("")),
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
          message: "Já existe um cliente com este slug",
        });
      }

      // Validar credenciais se fornecidas
      if (
        input.dbHost ||
        input.dbPort ||
        input.dbUsername ||
        input.dbPassword
      ) {
        const validation = validateConnectionParams(
          input.dbHost,
          input.dbPort,
          input.dbUsername,
          input.dbPassword
        );
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Credenciais inválidas: ${validation.errors.join(", ")}`,
          });
        }
      }

      // Criptografar senha se fornecida
      const encryptedPassword =
        input.dbPassword && input.dbPassword.trim() !== ""
          ? encryptPassword(input.dbPassword)
          : null;

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
          dbHost:
            input.dbHost && input.dbHost.trim() !== ""
              ? input.dbHost.trim()
              : null,
          dbPort:
            input.dbPort && input.dbPort.trim() !== ""
              ? input.dbPort.trim()
              : null,
          dbUsername:
            input.dbUsername && input.dbUsername.trim() !== ""
              ? input.dbUsername.trim()
              : null,
          dbPassword: encryptedPassword,
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
   * Requer permissão TENANT:UPDATE
   */
  update: adminProcedure
    .use(requirePermission("TENANT", "UPDATE"))
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
        // Credenciais de banco de dados
        dbHost: z.string().optional().or(z.literal("")),
        dbPort: z.string().optional().or(z.literal("")),
        dbUsername: z.string().optional().or(z.literal("")),
        dbPassword: z.string().optional().or(z.literal("")),
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
          message: "Cliente não encontrado",
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
            message: "Já existe um cliente com este slug",
          });
        }
      }

      // Validar credenciais se fornecidas
      if (
        updateData.dbHost !== undefined ||
        updateData.dbPort !== undefined ||
        updateData.dbUsername !== undefined ||
        updateData.dbPassword !== undefined
      ) {
        const validation = validateConnectionParams(
          updateData.dbHost,
          updateData.dbPort,
          updateData.dbUsername,
          updateData.dbPassword
        );
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Credenciais inválidas: ${validation.errors.join(", ")}`,
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

      // Campos de credenciais
      if (updateData.dbHost !== undefined)
        updateFields.dbHost =
          updateData.dbHost && updateData.dbHost.trim() !== ""
            ? updateData.dbHost.trim()
            : null;
      if (updateData.dbPort !== undefined)
        updateFields.dbPort =
          updateData.dbPort && updateData.dbPort.trim() !== ""
            ? updateData.dbPort.trim()
            : null;
      if (updateData.dbUsername !== undefined)
        updateFields.dbUsername =
          updateData.dbUsername && updateData.dbUsername.trim() !== ""
            ? updateData.dbUsername.trim()
            : null;
      if (updateData.dbPassword !== undefined) {
        // Criptografar senha apenas se fornecida e não vazia
        updateFields.dbPassword =
          updateData.dbPassword && updateData.dbPassword.trim() !== ""
            ? encryptPassword(updateData.dbPassword)
            : null;
      }

      // Verificar se credenciais de banco foram alteradas
      const credentialsChanged =
        updateFields.dbHost !== undefined ||
        updateFields.dbPort !== undefined ||
        updateFields.dbUsername !== undefined ||
        updateFields.dbPassword !== undefined;

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateFields,
      });

      // Se as credenciais foram alteradas, fechar conexões antigas do cache
      if (credentialsChanged) {
        const closedCount = closeTenantConnections(tenantId);
        if (closedCount > 0) {
          console.log(
            `Fechadas ${closedCount} conexão(ões) do tenant ${tenantId} devido à atualização de credenciais`
          );
        }
      }

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
            credentialsChanged,
          },
        },
        ctx
      );

      return tenant;
    }),

  /**
   * Deletar tenant (soft delete) - requer permissão TENANT:DELETE
   */
  delete: adminProcedure
    .use(requirePermission("TENANT", "DELETE"))
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
          message: "Cliente não encontrado",
        });
      }

      if (tenant.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cliente já está deletado",
        });
      }

      // Soft delete
      const deletedTenant = await prisma.tenant.update({
        where: { id: input.tenantId },
        data: {
          deletedAt: new Date(),
          deletedBy: ctx.session?.user?.id || null,
          active: false,
        },
      });

      // Fechar todas as conexões do tenant deletado
      const closedCount = closeTenantConnections(input.tenantId);
      if (closedCount > 0) {
        console.log(
          `Fechadas ${closedCount} conexão(ões) do tenant ${input.tenantId} devido à exclusão`
        );
      }

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
    .use(requirePermission("TENANT", "READ"))
    .query(async ({ input }) => {
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
          let deletedByUser: {
            id: string;
            name: string;
            email: string;
          } | null = null;
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
   * Restaurar tenant deletado
   * Requer permissão TENANT:UPDATE
   */
  restore: adminProcedure
    .use(requirePermission("TENANT", "UPDATE"))
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      if (!tenant.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cliente não está deletado",
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
   * Excluir permanentemente um tenant - requer permissão TENANT:DELETE
   */
  permanentlyDelete: adminProcedure
    .use(requirePermission("TENANT", "DELETE"))
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ input }) => {
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
          message: "Cliente não encontrado",
        });
      }

      if (!tenant.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cliente deve ser deletado (soft delete) antes da exclusão permanente",
        });
      }

      // Verificar se tem muitos dados (opcional: adicionar validação)
      // Por enquanto, apenas deletar

      // Fechar todas as conexões do tenant antes da exclusão permanente
      const closedCount = closeTenantConnections(input.tenantId);
      if (closedCount > 0) {
        console.log(
          `Fechadas ${closedCount} conexão(ões) do tenant ${input.tenantId} devido à exclusão permanente`
        );
      }

      // Exclusão permanente (cascade vai deletar relacionamentos)
      await prisma.tenant.delete({
        where: { id: input.tenantId },
      });

      return { success: true };
    }),

  /**
   * Testar conexão de banco de dados
   * Requer permissão TENANT:UPDATE
   */
  testDatabaseConnection: adminProcedure
    .use(requirePermission("TENANT", "UPDATE"))
    .input(
      z.object({
        tenantId: z.string().optional(),
        dbHost: z.string().optional(),
        dbPort: z.string().optional(),
        dbUsername: z.string().optional(),
        dbPassword: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let host: string | undefined;
      let port: string | undefined;
      let username: string | undefined;
      let password: string | undefined;

      // Se algum valor de credencial foi fornecido no input (mesmo que vazio),
      // usar os valores do input para testar antes de salvar
      // Caso contrário, se tenantId estiver presente, buscar do banco
      const hasAnyInputValue =
        input.dbHost !== undefined ||
        input.dbPort !== undefined ||
        input.dbUsername !== undefined ||
        input.dbPassword !== undefined;

      if (hasAnyInputValue) {
        // Usar credenciais fornecidas diretamente (mesmo que vazias)
        host = input.dbHost?.trim() || undefined;
        port = input.dbPort?.trim() || undefined;
        username = input.dbUsername?.trim() || undefined;
        password = input.dbPassword?.trim() || undefined;
      } else if (input.tenantId) {
        // Se não há credenciais no input, buscar do tenant
        const tenant = await prisma.tenant.findUnique({
          where: { id: input.tenantId },
          select: {
            dbHost: true,
            dbPort: true,
            dbUsername: true,
            dbPassword: true,
          },
        });

        if (!tenant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cliente não encontrado",
          });
        }

        host = tenant.dbHost || undefined;
        port = tenant.dbPort || undefined;
        username = tenant.dbUsername || undefined;
        password = tenant.dbPassword
          ? decryptPassword(tenant.dbPassword)
          : undefined;
      }

      // Validar formato
      const validation = validateConnectionParams(
        host,
        port,
        username,
        password
      );
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(", "),
          gestor: { success: false },
          dfe: { success: false },
        };
      }

      // Testar conexões reais
      const gestorResult = await testDatabaseConnection(
        host!,
        port!,
        username!,
        password!,
        "bussolla_db"
      );
      const dfeResult = await testDatabaseConnection(
        host!,
        port!,
        username!,
        password!,
        "opytex_db_dfe"
      );

      const allSuccess = gestorResult.success && dfeResult.success;

      // Construir mensagem de erro amigável (consolidada para evitar duplicação)
      let errorMessage: string | undefined;
      if (!allSuccess) {
        // Se ambos falharam com o mesmo erro, mostrar apenas uma mensagem
        if (
          !(gestorResult.success || dfeResult.success) &&
          gestorResult.error === dfeResult.error
        ) {
          errorMessage = gestorResult.error || "Erro desconhecido";
        } else {
          // Se os erros são diferentes ou apenas um falhou, consolidar removendo duplicatas
          const errors: string[] = [];
          if (!gestorResult.success) {
            errors.push(gestorResult.error || "Erro desconhecido");
          }
          if (!dfeResult.success) {
            errors.push(dfeResult.error || "Erro desconhecido");
          }
          // Remover duplicatas mantendo a ordem
          errorMessage = [...new Set(errors)].join(". ");
        }
      }

      return {
        success: allSuccess,
        error: errorMessage,
        gestor: gestorResult,
        dfe: dfeResult,
      };
    }),
});
