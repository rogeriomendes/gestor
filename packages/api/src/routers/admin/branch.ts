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

export const branchRouter = router({
  /**
   * Listar todas as filiais de um tenant
   * Requer permissão BRANCH:READ
   */
  listBranches: adminProcedure
    .use(requirePermission("BRANCH", "READ"))
    .input(
      paginationSchema.extend({
        tenantId: z.string(),
        active: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        tenantId: input.tenantId,
        deletedAt: null,
        ...(input.active !== undefined && { active: input.active }),
      };

      const [branches, total] = await Promise.all([
        prisma.tenantBranch.findMany({
          where,
          skip,
          take,
          orderBy: [
            { isMain: "desc" }, // Filial principal primeiro
            { createdAt: "desc" },
          ],
        }),
        prisma.tenantBranch.count({ where }),
      ]);

      return {
        data: branches,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  /**
   * Obter detalhes de uma filial específica
   * Requer permissão BRANCH:READ
   */
  getBranch: adminProcedure
    .use(requirePermission("BRANCH", "READ"))
    .input(z.object({ branchId: z.string() }))
    .query(async ({ input }) => {
      const branch = await prisma.tenantBranch.findUnique({
        where: { id: input.branchId },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!branch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filial não encontrada",
        });
      }

      return branch;
    }),

  /**
   * Criar nova filial
   * Requer permissão BRANCH:CREATE
   */
  createBranch: adminProcedure
    .use(requirePermission("BRANCH", "CREATE"))
    .input(
      z.object({
        tenantId: z.string(),
        name: z.string().min(1, "Name is required"),
        isMain: z.boolean().default(false),
        legalName: z.string().optional(),
        cnpj: z
          .string()
          .regex(/^\d{14}$/, "CNPJ must contain exactly 14 digits")
          .optional()
          .or(z.literal("")),
        email: z.string().email("Invalid email").optional().or(z.literal("")),
        phone: z.string().optional(),
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
        active: z.boolean().default(true),
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
          message: "Cliente não encontrado",
        });
      }

      // Se está marcando como principal, desmarcar outras
      if (input.isMain) {
        await prisma.tenantBranch.updateMany({
          where: {
            tenantId: input.tenantId,
            isMain: true,
            deletedAt: null,
          },
          data: {
            isMain: false,
          },
        });
      }

      // Verificar se CNPJ já existe para este tenant (se fornecido)
      if (input.cnpj && input.cnpj.trim() !== "") {
        const existingBranch = await prisma.tenantBranch.findFirst({
          where: {
            tenantId: input.tenantId,
            cnpj: input.cnpj,
            deletedAt: null,
          },
        });

        if (existingBranch) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma filial com este CNPJ para este cliente",
          });
        }
      }

      const branch = await prisma.tenantBranch.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          isMain: input.isMain,
          legalName: input.legalName || null,
          cnpj: input.cnpj && input.cnpj.trim() !== "" ? input.cnpj : null,
          email: input.email && input.email.trim() !== "" ? input.email : null,
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

      return branch;
    }),

  /**
   * Atualizar filial
   * Requer permissão BRANCH:UPDATE
   */
  updateBranch: adminProcedure
    .use(requirePermission("BRANCH", "UPDATE"))
    .input(
      z.object({
        branchId: z.string(),
        name: z.string().min(1).optional(),
        isMain: z.boolean().optional(),
        legalName: z.string().optional(),
        cnpj: z
          .string()
          .regex(/^\d{14}$/, "CNPJ must contain exactly 14 digits")
          .optional()
          .or(z.literal("")),
        email: z.email("Invalid email").optional().or(z.literal("")),
        phone: z.string().optional(),
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
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { branchId, isMain, cnpj, ...updateData } = input;

      // Buscar filial atual
      const currentBranch = await prisma.tenantBranch.findUnique({
        where: { id: branchId },
      });

      if (!currentBranch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filial não encontrada",
        });
      }

      // Se está marcando como principal, desmarcar outras
      if (isMain === true) {
        await prisma.tenantBranch.updateMany({
          where: {
            tenantId: currentBranch.tenantId,
            isMain: true,
            deletedAt: null,
            id: { not: branchId },
          },
          data: {
            isMain: false,
          },
        });
      }

      // Verificar se CNPJ já existe para este tenant (se foi alterado)
      if (
        cnpj !== undefined &&
        cnpj.trim() !== "" &&
        cnpj !== currentBranch.cnpj
      ) {
        const existingBranch = await prisma.tenantBranch.findFirst({
          where: {
            tenantId: currentBranch.tenantId,
            cnpj,
            deletedAt: null,
            id: { not: branchId },
          },
        });

        if (existingBranch) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma filial com este CNPJ para este cliente",
          });
        }
      }

      // Preparar dados para atualização
      const data: any = {};
      if (updateData.name !== undefined) {
        data.name = updateData.name;
      }
      if (updateData.legalName !== undefined) {
        data.legalName = updateData.legalName || null;
      }
      if (cnpj !== undefined) {
        data.cnpj = cnpj && cnpj.trim() !== "" ? cnpj : null;
      }
      if (updateData.email !== undefined) {
        data.email =
          updateData.email && updateData.email.trim() !== ""
            ? updateData.email
            : null;
      }
      if (updateData.phone !== undefined) {
        data.phone = updateData.phone || null;
      }
      if (updateData.addressStreet !== undefined) {
        data.addressStreet = updateData.addressStreet || null;
      }
      if (updateData.addressNumber !== undefined) {
        data.addressNumber = updateData.addressNumber || null;
      }
      if (updateData.addressComplement !== undefined) {
        data.addressComplement = updateData.addressComplement || null;
      }
      if (updateData.addressDistrict !== undefined) {
        data.addressDistrict = updateData.addressDistrict || null;
      }
      if (updateData.addressCity !== undefined) {
        data.addressCity = updateData.addressCity || null;
      }
      if (updateData.addressState !== undefined) {
        data.addressState = updateData.addressState || null;
      }
      if (updateData.addressZipCode !== undefined) {
        data.addressZipCode =
          updateData.addressZipCode && updateData.addressZipCode.trim() !== ""
            ? updateData.addressZipCode
            : null;
      }
      if (updateData.notes !== undefined) {
        data.notes = updateData.notes || null;
      }
      if (updateData.active !== undefined) {
        data.active = updateData.active;
      }
      if (isMain !== undefined) {
        data.isMain = isMain;
      }

      const branch = await prisma.tenantBranch.update({
        where: { id: branchId },
        data,
      });

      // Registrar atualização da filial no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_BRANCH,
          resourceType: AuditResourceType.BRANCH,
          resourceId: branch.id,
          metadata: {
            name: branch.name,
            isMain: branch.isMain,
            active: branch.active,
            tenantId: branch.tenantId,
            changes: data,
            previousValues: {
              name: currentBranch.name,
              isMain: currentBranch.isMain,
              active: currentBranch.active,
            },
          },
        },
        ctx
      );

      return branch;
    }),

  /**
   * Deletar filial (soft delete)
   * Requer permissão BRANCH:DELETE
   */
  deleteBranch: adminProcedure
    .use(requirePermission("BRANCH", "DELETE"))
    .input(z.object({ branchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const branch = await prisma.tenantBranch.findUnique({
        where: { id: input.branchId },
      });

      if (!branch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filial não encontrada",
        });
      }

      // Não permitir deletar a filial principal se for a única
      if (branch.isMain) {
        const otherBranches = await prisma.tenantBranch.count({
          where: {
            tenantId: branch.tenantId,
            deletedAt: null,
            id: { not: input.branchId },
          },
        });

        if (otherBranches === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível deletar a filial principal se for a única",
          });
        }
      }

      // Soft delete
      await prisma.tenantBranch.update({
        where: { id: input.branchId },
        data: {
          deletedAt: new Date(),
          deletedBy: ctx.session?.user?.id || null,
          active: false,
        },
      });

      // Registrar deleção da filial no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.DELETE_BRANCH,
          resourceType: AuditResourceType.BRANCH,
          resourceId: branch.id,
          metadata: {
            name: branch.name,
            isMain: branch.isMain,
            tenantId: branch.tenantId,
          },
        },
        ctx
      );

      // Se era a principal, tornar a primeira disponível como principal
      if (branch.isMain) {
        const firstBranch = await prisma.tenantBranch.findFirst({
          where: {
            tenantId: branch.tenantId,
            deletedAt: null,
            id: { not: input.branchId },
          },
          orderBy: { createdAt: "asc" },
        });

        if (firstBranch) {
          const updatedMainBranch = await prisma.tenantBranch.update({
            where: { id: firstBranch.id },
            data: { isMain: true },
          });

          // Registrar atualização da nova filial principal no audit log
          await createAuditLogFromContext(
            {
              action: AuditAction.UPDATE_BRANCH,
              resourceType: AuditResourceType.BRANCH,
              resourceId: updatedMainBranch.id,
              metadata: {
                name: updatedMainBranch.name,
                isMain: true,
                tenantId: updatedMainBranch.tenantId,
                reason: "Definida como principal após deleção da anterior",
              },
            },
            ctx
          );
        }
      }

      return { success: true };
    }),

  /**
   * Definir filial como principal
   * Requer permissão BRANCH:UPDATE
   */
  setMainBranch: adminProcedure
    .use(requirePermission("BRANCH", "UPDATE"))
    .input(z.object({ branchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const branch = await prisma.tenantBranch.findUnique({
        where: { id: input.branchId },
      });

      if (!branch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filial não encontrada",
        });
      }

      // Desmarcar outras filiais principais
      await prisma.tenantBranch.updateMany({
        where: {
          tenantId: branch.tenantId,
          isMain: true,
          deletedAt: null,
          id: { not: input.branchId },
        },
        data: {
          isMain: false,
        },
      });

      // Marcar esta como principal
      const updatedBranch = await prisma.tenantBranch.update({
        where: { id: input.branchId },
        data: { isMain: true },
      });

      // Registrar atualização da filial principal no audit log
      await createAuditLogFromContext(
        {
          action: AuditAction.UPDATE_BRANCH,
          resourceType: AuditResourceType.BRANCH,
          resourceId: updatedBranch.id,
          metadata: {
            name: updatedBranch.name,
            isMain: true,
            tenantId: updatedBranch.tenantId,
            reason: "Definida como filial principal",
          },
        },
        ctx
      );

      return updatedBranch;
    }),
});
