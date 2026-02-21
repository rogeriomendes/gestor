"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { LifeBuoy } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TicketCategory =
  | "BUG"
  | "FEATURE_REQUEST"
  | "QUESTION"
  | "TECHNICAL_ISSUE"
  | "BILLING"
  | "OTHER";

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const categoryLabels: Record<TicketCategory, string> = {
  BUG: "Erro",
  FEATURE_REQUEST: "Sugestão de funcionalidade",
  QUESTION: "Dúvida",
  TECHNICAL_ISSUE: "Problema técnico",
  BILLING: "Faturamento",
  OTHER: "Outro",
};

interface SupportTicket {
  category: TicketCategory;
  createdAt: Date | string;
  id: string;
  message: string;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface SupportTicketsListProps {
  isLoading?: boolean;
  tickets: SupportTicket[];
}

export function SupportTicketsList({
  tickets,
  isLoading = false,
}: SupportTicketsListProps) {
  const router = useRouter();

  const columns: ColumnDef<SupportTicket>[] = [
    {
      accessorKey: "subject",
      header: "Assunto",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{ticket.subject}</div>
            <p className="line-clamp-1 text-muted-foreground text-xs">
              {ticket.message}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "tenant",
      header: "Cliente",
      cell: ({ row }) => {
        const tenant = row.original.tenant;
        return (
          <div className="text-sm">
            {tenant ? (
              <div className="font-medium">{tenant.name}</div>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: "Criado por",
      cell: ({ row }) => {
        const user = row.original.user;
        return <span className="text-sm">{user?.name ?? "N/A"}</span>;
      },
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => {
        const category = row.original.category as TicketCategory;
        return <Badge variant="outline">{categoryLabels[category]}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as TicketStatus;
        return (
          <Badge
            variant={
              status === "OPEN" || status === "IN_PROGRESS"
                ? "default"
                : "outline"
            }
          >
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }) => {
        const priority = row.original.priority as TicketPriority;
        return <Badge variant="secondary">{priorityLabels[priority]}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-muted-foreground text-sm">
            {date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        );
      },
    },
  ];

  const renderTable = (data: SupportTicket[]) => (
    <DataTable<SupportTicket>
      columns={columns}
      data={data}
      emptyMessage="Nenhum ticket encontrado."
      onRowClick={(ticket: SupportTicket) => {
        router.push(`/admin/support/${ticket.id}`);
      }}
    />
  );

  const renderCards = (data: SupportTicket[]) => (
    <DataCards<SupportTicket>
      data={data}
      emptyMessage="Nenhum ticket encontrado."
      getHref={(ticket: SupportTicket) =>
        `/admin/support/${ticket.id}` as Route
      }
      renderCard={(ticket: SupportTicket) => (
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-semibold text-sm leading-tight">
              {ticket.subject}
            </CardTitle>
            <Badge
              className="shrink-0 text-xs"
              variant={
                ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
                  ? "default"
                  : "outline"
              }
            >
              {statusLabels[ticket.status as TicketStatus]}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2 text-xs">
            {ticket.message}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Badge className="text-xs" variant="outline">
              {categoryLabels[ticket.category as TicketCategory]}
            </Badge>
            <Badge className="text-xs" variant="secondary">
              {priorityLabels[ticket.priority as TicketPriority]}
            </Badge>
            <span className="text-muted-foreground">
              {ticket.tenant?.name || "N/A"}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {new Date(ticket.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}
    />
  );

  return (
    <ResponsiveList
      data={tickets}
      emptyDescription="Ainda não há solicitações de suporte registradas para os filtros selecionados."
      emptyIcon={LifeBuoy}
      emptyTitle="Nenhum ticket encontrado"
      isLoading={isLoading}
      renderCards={renderCards}
      renderTable={renderTable}
      skeletonColumnCount={columns.length}
    />
  );
}
