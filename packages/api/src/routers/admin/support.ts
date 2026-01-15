import prisma from "@gestor/db";
import { TicketCategory, TicketPriority, TicketStatus } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";

const listTicketsInputSchema = paginationSchema.extend({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  tenantId: z.string().optional(),
  search: z.string().optional(),
});

const getTicketInputSchema = z.object({
  ticketId: z.string().cuid(),
});

export const supportRouter = router({
  list: adminProcedure
    .input(listTicketsInputSchema)
    .query(async ({ input }) => {
      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        ...(input.tenantId && { tenantId: input.tenantId }),
        ...(input.status && { status: input.status }),
        ...(input.category && { category: input.category }),
        ...(input.priority && { priority: input.priority }),
        ...(input.search && {
          OR: [
            {
              subject: { contains: input.search, mode: "insensitive" as const },
            },
            {
              message: { contains: input.search, mode: "insensitive" as const },
            },
          ],
        }),
      };

      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            resolver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.supportTicket.count({ where }),
      ]);

      return {
        data: tickets,
        pagination: createPaginationResponse(input.page, input.limit, total),
      };
    }),

  get: adminProcedure.input(getTicketInputSchema).query(async ({ input }) => {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: input.ticketId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ticket não encontrado",
      });
    }

    return ticket;
  }),

  addReply: adminProcedure
    .input(
      z.object({
        ticketId: z.string().cuid(),
        message: z.string().min(3, "Mensagem deve ter pelo menos 3 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não encontrado",
        });
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: input.ticketId },
        select: { id: true },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket não encontrado",
        });
      }

      const reply = await prisma.supportTicketReply.create({
        data: {
          ticketId: ticket.id,
          userId: ctx.session.user.id,
          message: input.message,
          isAdmin: true,
        },
      });

      return reply;
    }),

  updateStatusAndPriority: adminProcedure
    .input(
      z.object({
        ticketId: z.string().cuid(),
        status: z.nativeEnum(TicketStatus).optional(),
        priority: z.nativeEnum(TicketPriority).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não encontrado",
        });
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: input.ticketId },
        select: { id: true },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket não encontrado",
        });
      }

      const data: {
        status?: TicketStatus;
        priority?: TicketPriority;
        resolvedAt?: Date | null;
        resolvedBy?: string | null;
      } = {};

      if (input.status) {
        data.status = input.status;
        if (
          input.status === TicketStatus.RESOLVED ||
          input.status === TicketStatus.CLOSED
        ) {
          data.resolvedAt = new Date();
          data.resolvedBy = ctx.session.user.id;
        } else {
          data.resolvedAt = null;
          data.resolvedBy = null;
        }
      }

      if (input.priority) {
        data.priority = input.priority;
      }

      const updated = await prisma.supportTicket.update({
        where: { id: ticket.id },
        data,
      });

      return updated;
    }),
});
