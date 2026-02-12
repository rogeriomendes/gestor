"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Laptop,
  Loader2,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) {
    return Monitor;
  }

  const ua = userAgent.toLowerCase();
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return Smartphone;
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return Tablet;
  }
  if (ua.includes("mac") || ua.includes("windows") || ua.includes("linux")) {
    return Laptop;
  }

  return Monitor;
}

function getDeviceName(userAgent: string | null): string {
  if (!userAgent) {
    return "Dispositivo desconhecido";
  }

  const ua = userAgent.toLowerCase();

  // Sistema operacional
  let os = "Desconhecido";
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  }

  // Navegador
  let browser = "";
  if (ua.includes("chrome") && !ua.includes("edg")) {
    browser = "Chrome";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("edg")) {
    browser = "Edge";
  } else if (ua.includes("opera")) {
    browser = "Opera";
  }

  return browser ? `${browser} em ${os}` : os;
}

function getBrowserInfo(userAgent: string | null): string {
  if (!userAgent) {
    return "";
  }

  const ua = userAgent.toLowerCase();

  // Extrair versão do navegador (simplificado)
  const chromeMatch = ua.match(/chrome\/(\d+)/);
  const firefoxMatch = ua.match(/firefox\/(\d+)/);
  const safariMatch = ua.match(/version\/(\d+)/);
  const edgeMatch = ua.match(/edg\/(\d+)/);

  if (edgeMatch) {
    return `Edge ${edgeMatch[1]}`;
  }
  if (chromeMatch) {
    return `Chrome ${chromeMatch[1]}`;
  }
  if (firefoxMatch) {
    return `Firefox ${firefoxMatch[1]}`;
  }
  if (safariMatch) {
    return `Safari ${safariMatch[1]}`;
  }

  return "";
}

export function ActiveSessionsSection() {
  const { data: currentSession } = authClient.useSession();
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const {
    data: sessions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: async () => {
      const result = await authClient.listSessions();
      return result.data || [];
    },
  });

  const handleRevokeSession = async (token: string) => {
    setIsRevoking(token);
    try {
      const result = await authClient.revokeSession({ token });

      if (result.error) {
        throw new Error(result.error.message || "Erro ao encerrar sessão");
      }

      toast.success("Sessão encerrada com sucesso!");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao encerrar sessão"
      );
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setIsRevokingAll(true);
    try {
      const result = await authClient.revokeOtherSessions();

      if (result.error) {
        throw new Error(
          result.error.message || "Erro ao encerrar outras sessões"
        );
      }

      toast.success("Todas as outras sessões foram encerradas!");
      setShowRevokeAllDialog(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao encerrar outras sessões"
      );
    } finally {
      setIsRevokingAll(false);
    }
  };

  const currentSessionToken = currentSession?.session?.token;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sessões Ativas
          </CardTitle>
          <CardDescription>
            Gerencie os dispositivos conectados à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : sessions && sessions.length > 0 ? (
              <>
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.userAgent ?? null);
                    const isCurrentSession =
                      session.token === currentSessionToken;

                    return (
                      <div
                        className={`flex items-center justify-between rounded-lg border p-4 ${isCurrentSession ? "border-primary bg-primary/5" : ""}`}
                        key={session.id}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${isCurrentSession ? "bg-primary/10" : "bg-muted"}`}
                          >
                            <DeviceIcon
                              className={`h-5 w-5 ${isCurrentSession ? "text-primary" : ""}`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {getDeviceName(session.userAgent ?? null)}
                              </p>
                              {isCurrentSession && (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                                  Este dispositivo
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-3 text-muted-foreground text-xs">
                              {getBrowserInfo(session.userAgent ?? null) && (
                                <span>
                                  {getBrowserInfo(session.userAgent ?? null)}
                                </span>
                              )}
                              {session.ipAddress && (
                                <span>IP: {session.ipAddress}</span>
                              )}
                              <span>
                                Ativo{" "}
                                {formatDistanceToNow(
                                  new Date(session.createdAt),
                                  {
                                    addSuffix: true,
                                    locale: ptBR,
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!isCurrentSession && (
                          <Button
                            disabled={isRevoking === session.token}
                            onClick={() => handleRevokeSession(session.token)}
                            size="sm"
                            variant="ghost"
                          >
                            {isRevoking === session.token ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogOut className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {sessions.length > 1 && (
                  <Button
                    className="w-full"
                    onClick={() => setShowRevokeAllDialog(true)}
                    variant="outline"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Encerrar todas as outras sessões
                  </Button>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Monitor className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground text-sm">
                  Nenhuma sessão ativa encontrada
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação para encerrar todas as sessões */}
      <Credenza
        onOpenChange={setShowRevokeAllDialog}
        open={showRevokeAllDialog}
      >
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Encerrar outras sessões</CredenzaTitle>
            <CredenzaDescription>
              Isso irá desconectar todos os outros dispositivos da sua conta.
              Você precisará fazer login novamente nesses dispositivos.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <p className="text-muted-foreground text-sm">
              Esta ação não pode ser desfeita. Todos os dispositivos, exceto
              este, serão desconectados imediatamente.
            </p>
          </CredenzaBody>
          <CredenzaFooter>
            <Button
              onClick={() => setShowRevokeAllDialog(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isRevokingAll}
              onClick={handleRevokeOtherSessions}
              variant="destructive"
            >
              {isRevokingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Encerrando...
                </>
              ) : (
                "Encerrar sessões"
              )}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
