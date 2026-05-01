"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  ClockIcon,
  FileDiffIcon,
  FileTextIcon,
  UserIcon,
  XIcon,
} from "lucide-react";

function formatJsonIfPossible(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const startsLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (!startsLikeJson) {
    return value;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

export function DetailAudit({
  auditId,
  open,
  onOpenChange,
}: {
  auditId: number | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { tenant } = useTenant();
  const isMobile = useIsMobile();

  const auditQuery = useQuery({
    ...trpc.tenant.audit.byId.queryOptions({
      id: auditId ?? 0,
    }),
    enabled: !!tenant && !!auditId && (open ?? true),
  });

  const audit = auditQuery.data?.audit;
  const formattedContent = audit?.CONTEUDO
    ? formatJsonIfPossible(audit.CONTEUDO)
    : null;
  const formattedBefore = audit?.TEXTO_ANTES
    ? formatJsonIfPossible(audit.TEXTO_ANTES)
    : null;
  const formattedAfter = audit?.TEXTO_DEPOIS
    ? formatJsonIfPossible(audit.TEXTO_DEPOIS)
    : null;

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-left">
            {auditQuery.isPending ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              `Registro #${audit?.ID}`
            )}
          </CredenzaTitle>
          <CredenzaDescription>
            {auditQuery.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : audit ? (
              <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                <span className="flex items-center">
                  <UserIcon className="mr-2 size-4" />
                  Usuário: {audit.usuario?.LOGIN || audit.NOME_USU_AUTO}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="mr-2 size-4" />
                  Data:{" "}
                  {audit.DATA_REGISTRO
                    ? `${formatDate(audit.DATA_REGISTRO)} ${audit.HORA_REGISTRO || ""}`.trim()
                    : "—"}
                </span>
              </div>
            ) : (
              "Registro não encontrado."
            )}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {auditQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : auditQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar o registro</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span className="text-sm">{auditQuery.error.message}</span>
                <Button
                  onClick={() => void auditQuery.refetch()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : audit ? (
            <div className="space-y-3">
              <Card className="rounded-md py-2 md:py-3" size="sm">
                <CardContent className="space-y-2 px-2 md:px-3">
                  <div className="flex items-center text-muted-foreground text-xs">
                    <FileTextIcon className="mr-1 size-3.5" />
                    Ação
                  </div>
                  <p className="font-medium text-sm">{audit.ACAO || "—"}</p>
                  <p className="text-muted-foreground text-xs">
                    Tela: {audit.JANELA_CONTROLLER || "—"}
                  </p>
                </CardContent>
              </Card>

              {formattedContent && (
                <Card className="rounded-md py-2 md:py-3" size="sm">
                  <CardContent className="space-y-2 px-2 md:px-3">
                    <div className="flex items-center text-muted-foreground text-xs">
                      <FileTextIcon className="mr-1 size-3.5" />
                      Conteúdo
                    </div>
                    <pre className="wrap-break-word whitespace-pre-wrap rounded bg-muted/40 p-2 text-xs">
                      {formattedContent}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {(formattedBefore || formattedAfter) && (
                <Card className="rounded-md py-2" size="sm">
                  <CardContent className="space-y-3 px-3">
                    <div className="flex items-center text-muted-foreground text-xs">
                      <FileDiffIcon className="mr-1 size-3.5" />
                      Comparação (Antes / Depois)
                    </div>
                    {formattedBefore && (
                      <div className="space-y-1">
                        <p className="font-medium text-xs">Antes</p>
                        <pre className="wrap-break-word whitespace-pre-wrap rounded bg-muted/40 p-2 text-xs">
                          {formattedBefore}
                        </pre>
                      </div>
                    )}
                    {formattedAfter && (
                      <div className="space-y-1">
                        <p className="font-medium text-xs">Depois</p>
                        <pre className="wrap-break-word whitespace-pre-wrap rounded bg-muted/40 p-2 text-xs">
                          {formattedAfter}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Registro não encontrado.
            </p>
          )}
        </CredenzaBody>
        {isMobile && (
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant="outline">
                <XIcon className="mr-2 size-5" />
                Fechar
              </Button>
            </CredenzaClose>
          </CredenzaFooter>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
