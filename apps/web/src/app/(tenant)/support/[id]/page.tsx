"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/contexts/tenant-context";
import { trpc, trpcClient } from "@/utils/trpc";

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
  const { tenant } = useTenant();
  const [replyMessage, setReplyMessage] = useState("");

  const {
    data: ticket,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.tenant.support.getMyTicket.queryOptions({ ticketId }),
  });

  const addReplyMutation = useMutation({
    mutationFn: (input: { ticketId: string; message: string }) =>
      trpcClient.tenant.support.addReply.mutate(input),
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

  if (isLoading) {
    return (
      <PageLayout
        backHref="/support"
        breadcrumbs={[
          { label: tenant?.name || "Dashboard", href: "/dashboard" as Route },
          { label: "Suporte", href: "/support" as Route },
          { label: "Detalhes" },
        ]}
        showBackButton={true}
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
        backHref="/support"
        breadcrumbs={[
          { label: tenant?.name || "Dashboard", href: "/dashboard" as Route },
          { label: "Suporte", href: "/support" as Route },
          { label: "Detalhes" },
        ]}
        showBackButton={true}
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

  const breadcrumbs = [
    { label: tenant?.name || "Dashboard", href: "/dashboard" as Route },
    { label: "Suporte", href: "/support" as Route },
    { label: ticket.subject },
  ];

  return (
    <PageLayout
      backHref="/support"
      breadcrumbs={breadcrumbs}
      showBackButton={true}
      subtitle={`Criado em ${new Date(ticket.createdAt).toLocaleString()}`}
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
                      ticket.status === "OPEN" ||
                      ticket.status === "IN_PROGRESS"
                        ? "default"
                        : "outline"
                    }
                  >
                    {statusLabels[ticket.status as TicketStatus]}
                  </Badge>
                  <Badge variant="secondary">
                    {priorityLabels[ticket.priority as TicketPriority]}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
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
                  Nenhuma resposta ainda. Aguarde a resposta da equipe de
                  suporte.
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
              Adicione uma resposta ou comentário sobre este ticket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Digite sua resposta ou comentário..."
                  rows={5}
                  value={replyMessage}
                />
              </div>
              <Button
                disabled={addReplyMutation.isPending || !replyMessage.trim()}
                onClick={() => {
                  if (!replyMessage.trim()) {
                    toast.error("Digite uma mensagem");
                    return;
                  }
                  addReplyMutation.mutate({
                    ticketId: ticket.id,
                    message: replyMessage.trim(),
                  });
                }}
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
  return <TicketDetailsPageContent />;
}
