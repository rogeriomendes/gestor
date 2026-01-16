"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useState } from "react";

import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { SupportTicketsList } from "./_components/support-tickets-list";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TicketCategory =
  | "BUG"
  | "FEATURE_REQUEST"
  | "QUESTION"
  | "TECHNICAL_ISSUE"
  | "BILLING"
  | "OTHER";

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
              <SelectTrigger className="">
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
              <SelectTrigger className="">
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
              <SelectTrigger className="">
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

        <SupportTicketsList isLoading={isLoading} tickets={tickets} />
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
