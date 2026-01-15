"use client";

import { useQuery } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

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

function AdminSupportPageContent() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [category, setCategory] = useState<TicketCategory | "ALL">("ALL");
  const [priority, setPriority] = useState<TicketPriority | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    ...trpc.admin.support.list.queryOptions({
      page,
      limit: 10,
      ...(status !== "ALL" && { status }),
      ...(category !== "ALL" && { category }),
      ...(priority !== "ALL" && { priority }),
      ...(search && { search }),
    }),
  });

  const tickets = data?.data ?? [];

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" as Route },
        { label: "Suporte" },
      ]}
      subtitle="Visualize e gerencie todos os tickets de suporte enviados pelos clientes."
      title="Suporte"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex flex-row gap-3">
            <Input
              className="w-full max-w-xs"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por assunto, descrição ou cliente..."
              value={search}
            />
            <Select
              onValueChange={(value) => {
                setStatus(value as TicketStatus | "ALL");
                setPage(1);
              }}
              value={status}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="OPEN">Aberto</SelectItem>
                <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                <SelectItem value="RESOLVED">Resolvido</SelectItem>
                <SelectItem value="CLOSED">Fechado</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => {
                setCategory(value as TicketCategory | "ALL");
                setPage(1);
              }}
              value={category}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as categorias</SelectItem>
                <SelectItem value="BUG">Erro</SelectItem>
                <SelectItem value="FEATURE_REQUEST">
                  Sugestão de funcionalidade
                </SelectItem>
                <SelectItem value="QUESTION">Dúvida</SelectItem>
                <SelectItem value="TECHNICAL_ISSUE">
                  Problema técnico
                </SelectItem>
                <SelectItem value="BILLING">Faturamento</SelectItem>
                <SelectItem value="OTHER">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => {
                setPriority(value as TicketPriority | "ALL");
                setPage(1);
              }}
              value={priority}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="LOW">Baixa</SelectItem>
                <SelectItem value="MEDIUM">Média</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets de suporte</CardTitle>
            <CardDescription>
              Lista completa de tickets abertos pelos tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <ListSkeleton count={8} itemHeight="h-16" />}
            {!isLoading && tickets.length === 0 && (
              <Empty className="border-none p-6">
                <EmptyMedia variant="icon">
                  <LifeBuoy className="h-6 w-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Nenhum ticket encontrado</EmptyTitle>
                  <EmptyDescription>
                    Ainda não há solicitações de suporte registradas.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {!isLoading && tickets.length > 0 && (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Link
                    href={`/admin/support/${ticket.id}` as Route}
                    key={ticket.id}
                  >
                    <Card
                      className="rounded border border-border/60 hover:border-primary/70"
                      size="sm"
                    >
                      <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="font-semibold text-sm">
                            {ticket.subject}
                          </CardTitle>
                          <CardDescription className="line-clamp-1 text-xs">
                            {ticket.message}
                          </CardDescription>
                          <p className="text-[11px] text-muted-foreground">
                            Cliente:{" "}
                            {ticket.tenant
                              ? `${ticket.tenant.name} (${ticket.tenant.slug})`
                              : "N/A"}
                            {" • "}Aberto por: {ticket.user?.name ?? "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Badge variant="outline">
                              {
                                categoryLabels[
                                  ticket.category as TicketCategory
                                ]
                              }
                            </Badge>
                            <Badge
                              variant={
                                ticket.status === "OPEN" ||
                                ticket.status === "IN_PROGRESS"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {statusLabels[ticket.status as TicketStatus]}
                            </Badge>
                            <Badge variant="secondary">
                              {
                                priorityLabels[
                                  ticket.priority as TicketPriority
                                ]
                              }
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export default function AdminSupportPage() {
  return (
    <AdminGuard>
      <AdminSupportPageContent />
    </AdminGuard>
  );
}
