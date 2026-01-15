import prisma from "@gestor/db";
import { TicketCategory, TicketPriority, TicketStatus } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router, tenantProcedure } from "../../index";
import {
  createPaginationResponse,
  getPaginationParams,
  paginationSchema,
} from "../../lib/pagination";

const createTicketInputSchema = z.object({
  category: z.enum(TicketCategory),
  subject: z.string().min(3, "Assunto deve ter pelo menos 3 caracteres"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
  // Prioridade não é enviada pelo cliente, sempre usa MEDIUM como padrão
  // O admin pode alterar a prioridade depois
});

const listTicketsInputSchema = paginationSchema.extend({
  status: z.enum(TicketStatus).optional(),
  category: z.enum(TicketCategory).optional(),
  search: z.string().optional(),
});

const getTicketInputSchema = z.object({
  ticketId: z.cuid(),
});

export const tenantSupportRouter = router({
  createTicket: tenantProcedure
    .input(createTicketInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!(ctx.session?.user?.id && ctx.tenant)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou tenant não encontrado",
        });
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.session.user.id,
          category: input.category,
          subject: input.subject,
          message: input.message,
          priority: TicketPriority.MEDIUM, // Prioridade padrão, admin pode alterar depois
        },
      });

      return ticket;
    }),

  listMyTickets: tenantProcedure
    .input(listTicketsInputSchema)
    .query(async ({ ctx, input }) => {
      if (!(ctx.session?.user?.id && ctx.tenant)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou tenant não encontrado",
        });
      }

      const { skip, take } = getPaginationParams(input.page, input.limit);

      const where = {
        tenantId: ctx.tenant.id,
        ...(input.status && { status: input.status }),
        ...(input.category && { category: input.category }),
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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

  getMyTicket: tenantProcedure
    .input(getTicketInputSchema)
    .query(async ({ ctx, input }) => {
      if (!(ctx.session?.user?.id && ctx.tenant)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou tenant não encontrado",
        });
      }

      const ticket = await prisma.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          tenantId: ctx.tenant.id,
        },
        include: {
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

  addReply: tenantProcedure
    .input(
      z.object({
        ticketId: z.string().cuid(),
        message: z.string().min(3, "Mensagem deve ter pelo menos 3 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!(ctx.session?.user?.id && ctx.tenant)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou tenant não encontrado",
        });
      }

      const ticket = await prisma.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          tenantId: ctx.tenant.id,
        },
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
          isAdmin: false,
        },
      });

      return reply;
    }),

  // Listagem simples de tickets do tenant (para dashboards, etc)
  listMyTicketsSummary: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Tenant não encontrado",
        });
      }

      const tickets = await prisma.supportTicket.findMany({
        where: {
          tenantId: ctx.tenant.id,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      });

      return tickets;
    }),
});
