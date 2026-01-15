"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageLayout } from "@/components/layouts/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc, trpcClient } from "@/utils/trpc";

type TicketStatus = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TicketCategory =
  | "BUG"
  | "FEATURE_REQUEST"
  | "QUESTION"
  | "TECHNICAL_ISSUE"
  | "BILLING"
  | "OTHER";

const statusLabels: Record<TicketStatus, string> = {
  ALL: "Todos os status",
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

export default function TenantSupportPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [category, setCategory] = useState<TicketCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [categoryCreate, setCategoryCreate] = useState<TicketCategory>("BUG");

  const { data, isLoading, refetch } = useQuery({
    ...trpc.tenant.support.listMyTickets.queryOptions({
      page,
      limit: 10,
      ...(status !== "ALL" && { status }),
      ...(category !== "ALL" && { category }),
      ...(search && { search }),
    }),
  });

  const tickets = data?.data ?? [];

  const handleCreate = async () => {
    if (!(subject.trim() && message.trim())) {
      toast.error("Preencha assunto e mensagem");
      return;
    }

    try {
      await trpcClient.tenant.support.createTicket.mutate({
        subject: subject.trim(),
        message: message.trim(),
        category: categoryCreate,
      });
      toast.success("Ticket criado com sucesso");
      setIsCreating(false);
      setSubject("");
      setMessage("");
      setCategoryCreate("BUG");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao criar ticket de suporte"
      );
    }
  };

  return (
    <PageLayout
      breadcrumbs={[{ label: "Suporte" }]}
      subtitle="Envie solicitações de suporte, reporte bugs ou tire dúvidas com nossa equipe."
      title="Suporte"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-row gap-3">
            <Input
              className="w-full max-w-xs"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por assunto ou descrição..."
              value={search}
            />
            <Select
              onValueChange={(value) => {
                setStatus(value as TicketStatus);
                setPage(1);
              }}
              value={status}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue>Status</SelectValue>
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
              <SelectTrigger className="w-[220px]">
                <SelectValue>Categoria</SelectValue>
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
          </div>

          <Button onClick={() => setIsCreating(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo ticket
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meus tickets</CardTitle>
            <CardDescription>
              Acompanhe o andamento das suas solicitações de suporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <ListSkeleton count={5} itemHeight="h-16" />}
            {!isLoading && tickets.length === 0 && (
              <Empty className="border-none p-6">
                <EmptyHeader>
                  <EmptyTitle>Nenhum ticket encontrado</EmptyTitle>
                  <EmptyDescription>
                    Você ainda não abriu nenhuma solicitação de suporte.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setIsCreating(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Abrir primeiro ticket
                  </Button>
                </EmptyContent>
              </Empty>
            )}
            {!isLoading && tickets.length > 0 && (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Link href={`/support/${ticket.id}` as Route} key={ticket.id}>
                    <Card
                      className="cursor-pointer rounded border border-border/60 hover:border-primary/70"
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

      <Dialog onOpenChange={setIsCreating} open={isCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo ticket de suporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                onValueChange={(value) =>
                  setCategoryCreate(value as TicketCategory)
                }
                value={categoryCreate}
              >
                <SelectTrigger>
                  <SelectValue>Selecione uma categoria</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUG">Bug</SelectItem>
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
            </div>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex.: Erro ao clicar no botão..."
                value={subject}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva o problema, o que esperava que acontecesse e, se possível, os passos para reproduzir."
                rows={5}
                value={message}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCreating(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Enviar ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
