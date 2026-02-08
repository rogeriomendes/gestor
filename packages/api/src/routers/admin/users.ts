import { auth, registerInvite } from "@gestor/auth";
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

// Mapeamento de roles para nomes amigáveis
const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Administrador",
  TENANT_ADMIN: "Administrador",
  TENANT_OWNER: "Proprietário",
  TENANT_USER_MANAGER: "Gerente de Usuários",
  TENANT_USER: "Usuário",
};

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
        deletedAt: null, // Apenas usuários não deletados
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
            emailVerified: true,
            createdAt: true,
            accounts: {
              where: {
                providerId: "credential",
              },
              select: {
                password: true,
              },
            },
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
        data: users.map((user: any) => {
          // Verificar se o usuário está pendente (não tem senha ou email não verificado)
          const hasPassword = user.accounts.some(
            (account: any) => account.password !== null
          );
          const isPending = !(hasPassword && user.emailVerified);

          return {
            id: user.id,
            userId: user.id,
            role: user.role,
            isPending,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              emailVerified: user.emailVerified,
              createdAt: user.createdAt,
            },
            tenant: user.tenant,
          };
        }),
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
    .query(async ({ input }) => {
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
            emailVerified: true,
            createdAt: true,
            accounts: {
              where: {
                providerId: "credential",
              },
              select: {
                password: true,
              },
            },
          },
        }),
        prisma.user.count({ where: where as any }),
      ]);

      return {
        data: users.map((user: any) => {
          // Verificar se o usuário está pendente (não tem senha ou email não verificado)
          const hasPassword = user.accounts.some(
            (account: any) => account.password !== null
          );
          const isPending = !(hasPassword && user.emailVerified);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            isPending,
          };
        }),
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Criar novo usuário (sem senha)
   * O usuário receberá um email para ativar a conta e criar sua senha
   * Requer permissão USER:CREATE
   */
  create: adminProcedure
    .use(requirePermission("USER", "CREATE"))
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Invalid email"),
        tenantId: z.string().optional(),
        role: z
          .enum([
            "SUPER_ADMIN",
            "TENANT_ADMIN",
            "TENANT_OWNER",
            "TENANT_USER_MANAGER",
            "TENANT_USER",
          ])
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

      // Validar que SUPER_ADMIN não pode ter tenantId
      if (input.role === "SUPER_ADMIN" && input.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "SUPER_ADMIN não pode estar associado a um cliente",
        });
      }

      // Buscar informações do tenant (se fornecido)
      let tenantName: string | undefined;
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
        tenantName = tenant.name;
      }

      // Gerar uma senha temporária aleatória (o usuário nunca vai usar)
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();

      try {
        // Criar usuário usando o Admin plugin do Better Auth
        const createUserResult = await auth.api.createUser({
          body: {
            name: input.name,
            email: normalizedEmail,
            password: tempPassword, // Senha temporária que será substituída
            role: input.role,
            data: input.tenantId
              ? {
                  tenantId: input.tenantId,
                }
              : undefined,
          },
          headers: ctx.req.headers,
        });

        if (!createUserResult.user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criar usuário",
          });
        }

        // Atualizar o usuário com tenantId e role
        let finalUser: any = createUserResult.user;
        if (input.tenantId || input.role) {
          finalUser = await prisma.user.update({
            where: { id: createUserResult.user.id },
            data: {
              ...(input.tenantId && { tenantId: input.tenantId }),
              ...(input.role && { role: input.role }),
            },
          });
        }

        // Usar a API do Better Auth para gerar o token e enviar email de boas-vindas
        try {
          // Primeiro, deletar qualquer token existente para este email
          await prisma.verification.deleteMany({
            where: {
              identifier: normalizedEmail,
            },
          });

          // Buscar informações do admin que está criando o usuário
          let adminName: string | undefined;
          if (ctx.session?.user.id) {
            const adminUser = await prisma.user.findUnique({
              where: { id: ctx.session.user.id },
              select: { name: true, email: true },
            });
            adminName = adminUser?.name || adminUser?.email;
          }

          const roleName = input.role ? roleLabels[input.role] : undefined;

          // Registrar o convite ANTES de chamar requestPasswordReset
          // Isso permite que sendResetPassword detecte que é um convite
          registerInvite(normalizedEmail, {
            userName: finalUser.name,
            invitedBy: adminName,
            tenantName,
            roleName,
          });

          // Usar requestPasswordReset para gerar o token no formato correto do Better Auth
          // O sendResetPassword vai detectar que é um convite e enviar o email de boas-vindas
          await auth.api.requestPasswordReset({
            body: {
              email: normalizedEmail,
              redirectTo: "/activate-account",
            },
            headers: ctx.req.headers,
          });
        } catch (emailError) {
          console.error(
            "[User Create] Erro ao enviar email de ativação:",
            emailError
          );
          // Não falha a criação do usuário se o email falhar
          // O admin pode reenviar depois
        }

        // Buscar informações do admin para o audit log (se ainda não foi buscado)
        let adminNameForAudit: string | null = null;
        if (ctx.session?.user.id) {
          const adminUser = await prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { name: true, email: true },
          });
          adminNameForAudit = adminUser?.name || adminUser?.email || null;
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
              invitedBy: adminNameForAudit,
            },
          },
          ctx
        );

        return {
          id: finalUser.id,
          name: finalUser.name,
          email: finalUser.email,
          image: finalUser.image || null,
          role: (finalUser.role as any) || undefined,
          tenantId: (finalUser as any).tenantId || null,
          createdAt: finalUser.createdAt,
        };
      } catch (error: any) {
        // Verificar se é erro de email duplicado
        const isDuplicateEmail =
          error.code === "P2002" ||
          error.status === 409 ||
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

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Falha ao criar usuário",
        });
      }
    }),

  /**
   * Reenviar convite para usuário pendente
   * Requer permissão USER:UPDATE
   */
  resendInvite: adminProcedure
    .use(requirePermission("USER", "UPDATE"))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se usuário existe
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          tenant: true,
          accounts: {
            where: {
              providerId: "credential",
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      const normalizedEmail = user.email.toLowerCase().trim();

      try {
        // Primeiro, deletar qualquer token existente para este email
        await prisma.verification.deleteMany({
          where: {
            identifier: normalizedEmail,
          },
        });

        // Buscar informações do admin que está reenviando o convite
        let adminName: string | undefined;
        if (ctx.session?.user.id) {
          const adminUser = await prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { name: true, email: true },
          });
          adminName = adminUser?.name || adminUser?.email;
        }

        const roleName = user.role ? roleLabels[user.role] : undefined;
        const tenantName = user.tenant?.name;

        // Registrar o convite ANTES de chamar requestPasswordReset
        registerInvite(normalizedEmail, {
          userName: user.name,
          invitedBy: adminName,
          tenantName,
          roleName,
        });

        // Usar requestPasswordReset para gerar o token no formato correto do Better Auth
        // O sendResetPassword vai detectar que é um convite e enviar o email de boas-vindas
        await auth.api.requestPasswordReset({
          body: {
            email: normalizedEmail,
            redirectTo: "/activate-account",
          },
          headers: ctx.req.headers,
        });

        // Registrar no audit log
        await createAuditLogFromContext(
          {
            action: AuditAction.UPDATE_USER,
            resourceType: user.tenantId
              ? AuditResourceType.TENANT_USER
              : AuditResourceType.USER,
            resourceId: user.id,
            metadata: {
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              action: "resend_invite",
            },
          },
          ctx
        );

        return { success: true };
      } catch (emailError) {
        console.error(
          "[User Resend Invite] Erro ao reenviar convite:",
          emailError
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            emailError instanceof Error
              ? emailError.message
              : "Erro ao reenviar convite",
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

      // Usar exclusivamente a API do Better Auth Admin plugin,
      // conforme documentação do Admin plugin
      try {
        await auth.api.setUserPassword({
          body: {
            userId: input.userId,
            newPassword: input.newPassword,
          },
          headers: ctx.req.headers,
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

  /**
   * Deletar usuário (soft delete)
   * Requer permissão USER:DELETE
   */
  delete: adminProcedure
    .use(requirePermission("USER", "DELETE"))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      if (user.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário já está deletado",
        });
      }

      // Não permitir deletar a si mesmo
      if (ctx.session && user.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível deletar seu próprio usuário",
        });
      }

      // Soft delete
      const deletedUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          deletedAt: new Date(),
          deletedBy: ctx.session?.user.id || null,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.DELETE_USER,
          resourceType: user.tenantId
            ? AuditResourceType.TENANT_USER
            : AuditResourceType.USER,
          resourceId: user.id,
          metadata: {
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId || null,
          },
        },
        ctx
      );

      return deletedUser;
    }),

  /**
   * Restaurar usuário deletado
   * Requer permissão USER:DELETE
   */
  restore: adminProcedure
    .use(requirePermission("USER", "DELETE"))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      if (!user.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não está deletado",
        });
      }

      // Restaurar usuário
      const restoredUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          deletedAt: null,
          deletedBy: null,
        },
      });

      // Registrar no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.RESTORE_USER,
          resourceType: user.tenantId
            ? AuditResourceType.TENANT_USER
            : AuditResourceType.USER,
          resourceId: user.id,
          metadata: {
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId || null,
          },
        },
        ctx
      );

      return restoredUser;
    }),

  /**
   * Listar usuários deletados (lixeira)
   * Requer permissão USER:READ
   */
  listDeleted: adminProcedure
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
        deletedAt: { not: null }, // Apenas usuários deletados
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
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            tenantId: true,
            deletedAt: true,
            deletedBy: true,
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
          deletedAt: user.deletedAt,
          deletedBy: user.deletedBy,
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
});
