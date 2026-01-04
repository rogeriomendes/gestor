import { auth } from "@gestor/auth";
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

export const usersRouter = router({
  /**
   * Listar todos os usuários de todos os tenants (com paginação)
   * Requer permissão USER:READ
   */
  listAll: adminProcedure
    .use(requirePermission("USER", "READ"))
    .input(
      paginationSchema.extend({
        tenantId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
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
   * Listar usuários de um tenant específico
   * Requer permissão USER:READ
   */
  listByTenant: adminProcedure
    .use(requirePermission("USER", "READ"))
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
   * Requer permissão USER:CREATE
   */
  create: adminProcedure
    .use(requirePermission("USER", "CREATE"))
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
            message: "Cliente não encontrado",
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
   * Atualizar informações do usuário
   * Requer permissão USER:UPDATE
   */
  update: adminProcedure
    .use(requirePermission("USER", "UPDATE"))
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        email: z.email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Normalizar email se fornecido
      const updateData: any = {};
      if (input.name) {
        updateData.name = input.name;
      }
      if (input.email) {
        const normalizedEmail = input.email.toLowerCase().trim();
        // Verificar se email já existe (exceto para o próprio usuário)
        const existingUser = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: input.userId },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email já está em uso",
          });
        }
        updateData.email = normalizedEmail;
      }

      // Atualizar usuário
      const updatedUser = await prisma.user.update({
        where: { id: input.userId },
        data: updateData,
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
          action: AuditAction.UPDATE_USER,
          resourceType: AuditResourceType.USER,
          resourceId: user.id,
          metadata: {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            changes: updateData,
          },
        },
        ctx
      );

      return updatedUser;
    }),

  /**
   * Resetar senha do usuário
   * Requer permissão USER:UPDATE
   */
  resetPassword: adminProcedure
    .use(requirePermission("USER", "UPDATE"))
    .input(
      z.object({
        userId: z.string(),
        newPassword: z
          .string()
          .min(8, "Senha deve ter pelo menos 8 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Usar a API do Better Auth Admin plugin para definir a nova senha
      // Isso garante que a senha seja hasheada corretamente usando o mesmo algoritmo
      try {
        await auth.api.setUserPassword({
          body: {
            userId: input.userId,
            newPassword: input.newPassword,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Erro ao resetar senha",
        });
      }

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_USER,
          resourceType: AuditResourceType.USER,
          resourceId: user.id,
          metadata: {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            action: "password_reset",
          },
        },
        ctx
      );

      return { success: true };
    }),

  /**
   * Adicionar usuário a um tenant
   * Requer permissão USER:CREATE
   */
  addToTenant: adminProcedure
    .use(requirePermission("USER", "CREATE"))
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
   * Requer permissão USER:DELETE
   */
  removeFromTenant: adminProcedure
    .use(requirePermission("USER", "DELETE"))
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
   * Requer permissão USER:UPDATE
   */
  updateRoleInTenant: adminProcedure
    .use(requirePermission("USER", "UPDATE"))
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
});
