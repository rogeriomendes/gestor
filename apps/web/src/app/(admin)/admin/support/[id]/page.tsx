"use client";

import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc, trpcClient } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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

function TicketDetailsPageContent() {
  const params = useParams();
  const ticketId = params.id as string;

  const [replyMessage, setReplyMessage] = useState("");
  const [status, setStatus] = useState<TicketStatus | null>(null);
  const [priority, setPriority] = useState<TicketPriority | null>(null);

  const {
    data: ticket,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.admin.support.get.queryOptions({ ticketId }),
  });

  const addReplyMutation = useMutation({
    mutationFn: (input: { ticketId: string; message: string }) =>
      trpcClient.admin.support.addReply.mutate(input),
    onSuccess: () => {
      toast.success("Resposta enviada com sucesso");
      setReplyMessage("");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar resposta"
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (input: {
      ticketId: string;
      status?: TicketStatus;
      priority?: TicketPriority;
    }) => trpcClient.admin.support.updateStatusAndPriority.mutate(input),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar status"
      );
    },
  });

  if (isLoading) {
    return (
      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" as Route },
          { label: "Suporte", href: "/admin/support" as Route },
          { label: "Detalhes" },
        ]}
        showBackButton
        title="Carregando..."
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!ticket) {
    return (
      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" as Route },
          { label: "Suporte", href: "/admin/support" as Route },
          { label: "Detalhes" },
        ]}
        showBackButton
        title="Ticket não encontrado"
      >
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              O ticket solicitado não foi encontrado.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const currentStatus = status ?? (ticket.status as TicketStatus);
  const currentPriority = priority ?? (ticket.priority as TicketPriority);

  const handleStatusChange = (newStatus: TicketStatus) => {
    setStatus(newStatus);
    updateStatusMutation.mutate({
      ticketId: ticket.id,
      status: newStatus,
    });
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    setPriority(newPriority);
    updateStatusMutation.mutate({
      ticketId: ticket.id,
      priority: newPriority,
    });
  };

  const handleReply = () => {
    if (!replyMessage.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    addReplyMutation.mutate({
      ticketId: ticket.id,
      message: replyMessage.trim(),
    });
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Suporte", href: "/admin/support" as Route },
    { label: ticket.subject },
  ];

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      showBackButton
      subtitle={`Cliente: ${ticket.tenant?.name || "N/A"} • Criado em ${new Date(ticket.createdAt).toLocaleString()}`}
      title={ticket.subject}
    >
      <div className="space-y-6">
        {/* Informações do Ticket */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle>{ticket.subject}</CardTitle>
                <CardDescription className="whitespace-pre-wrap">
                  {ticket.message}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {categoryLabels[ticket.category as TicketCategory]}
                  </Badge>
                  <Badge
                    variant={
                      currentStatus === "OPEN" ||
                      currentStatus === "IN_PROGRESS"
                        ? "default"
                        : "outline"
                    }
                  >
                    {statusLabels[currentStatus]}
                  </Badge>
                  <Badge variant="secondary">
                    {priorityLabels[currentPriority]}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  onValueChange={(value) =>
                    handleStatusChange(value as TicketStatus)
                  }
                  value={currentStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Aberto</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                    <SelectItem value="RESOLVED">Resolvido</SelectItem>
                    <SelectItem value="CLOSED">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  onValueChange={(value) =>
                    handlePriorityChange(value as TicketPriority)
                  }
                  value={currentPriority}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Criado por:</span>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {ticket.user?.image && (
                      <AvatarImage src={ticket.user.image} />
                    )}
                    <AvatarFallback>
                      {ticket.user?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{ticket.user?.name || "N/A"}</span>
                  <span className="text-muted-foreground">
                    ({ticket.user?.email || "N/A"})
                  </span>
                </div>
              </div>
              {ticket.resolver && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Resolvido por:</span>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {ticket.resolver.image && (
                        <AvatarImage src={ticket.resolver.image} />
                      )}
                      <AvatarFallback>
                        {ticket.resolver.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{ticket.resolver.name || "N/A"}</span>
                  </div>
                  {ticket.resolvedAt && (
                    <span className="text-muted-foreground">
                      em {new Date(ticket.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Respostas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Respostas ({ticket.replies?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticket.replies && ticket.replies.length > 0 ? (
                ticket.replies.map((reply) => (
                  <div className="space-y-2" key={reply.id}>
                    <div className="flex items-start gap-3">
                      <Avatar size="sm">
                        {reply.user?.image && (
                          <AvatarImage src={reply.user.image} />
                        )}
                        <AvatarFallback>
                          {reply.user?.name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {reply.user?.name || "N/A"}
                          </span>
                          {reply.isAdmin && (
                            <Badge className="text-xs" variant="default">
                              Admin
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">
                          {reply.message}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm">
                  Nenhuma resposta ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Resposta */}
        <Card>
          <CardHeader>
            <CardTitle>Responder ao ticket</CardTitle>
            <CardDescription>
              Envie uma resposta ao cliente sobre este ticket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Digite sua resposta..."
                  rows={5}
                  value={replyMessage}
                />
              </div>
              <Button
                disabled={addReplyMutation.isPending || !replyMessage.trim()}
                onClick={handleReply}
              >
                <Send className="mr-2 h-4 w-4" />
                {addReplyMutation.isPending ? "Enviando..." : "Enviar Resposta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export default function TicketDetailsPage() {
  return (
    <AdminGuard>
      <TicketDetailsPageContent />
    </AdminGuard>
  );
}
