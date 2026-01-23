"use client";

import { BadgeCheck, Loader2, Mail, MailWarning } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const changeEmailSchema = z.object({
  newEmail: z
    .email("Digite um email válido")
});

export function EmailSection() {
  const { data: session } = authClient.useSession();
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const user = session?.user;
  const isEmailVerified = user?.emailVerified;

  const clearError = () => setError(undefined);

  const handleChangeEmail = async () => {
    setError(undefined);

    // Validação com Zod
    const result = changeEmailSchema.safeParse({ newEmail });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setError("O novo email deve ser diferente do atual");
      return;
    }

    setIsChanging(true);
    try {
      const response = await authClient.changeEmail({
        newEmail,
        callbackURL: window.location.href,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao alterar email");
      }

      toast.success(
        "Um email de verificação foi enviado para o novo endereço. Verifique sua caixa de entrada."
      );
      handleCloseDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar email");
    } finally {
      setIsChanging(false);
    }
  };

  const handleCloseDialog = () => {
    setShowChangeDialog(false);
    setNewEmail("");
    setError(undefined);
  };

  const handleSendVerification = async () => {
    if (!user?.email) return;

    setIsSendingVerification(true);
    try {
      const result = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: window.location.href,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Erro ao enviar email de verificação"
        );
      }

      toast.success(
        "Email de verificação enviado! Verifique sua caixa de entrada."
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao enviar email de verificação"
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email
          </CardTitle>
          <CardDescription>
            Gerencie seu endereço de email e verificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status do email atual */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${isEmailVerified ? "bg-green-100 dark:bg-green-900" : "bg-yellow-100 dark:bg-yellow-900"}`}
                >
                  {isEmailVerified ? (
                    <BadgeCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <MailWarning className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user?.email}</p>
                    {isEmailVerified ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        Verificado
                      </Badge>
                    ) : (
                      <Badge
                        className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        variant="secondary"
                      >
                        Não verificado
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {isEmailVerified
                      ? "Seu email está verificado"
                      : "Verifique seu email para maior segurança"}
                  </p>
                </div>
              </div>
            </div>

            {/* Botão para verificar email (se não verificado) */}
            {!isEmailVerified && (
              <Button
                className="w-full"
                disabled={isSendingVerification}
                onClick={handleSendVerification}
                variant="outline"
              >
                {isSendingVerification ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar email de verificação
                  </>
                )}
              </Button>
            )}

            {/* Alterar email */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Alterar Email</p>
                <p className="text-muted-foreground text-sm">
                  Altere o email associado à sua conta
                </p>
              </div>
              <Button
                onClick={() => setShowChangeDialog(true)}
                variant="outline"
              >
                Alterar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para alterar email */}
      <Credenza onOpenChange={handleCloseDialog} open={showChangeDialog}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Alterar Email</CredenzaTitle>
            <CredenzaDescription>
              Digite o novo endereço de email. Você receberá um link de
              verificação.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email atual</Label>
                <p className="rounded-lg bg-muted p-2 text-sm">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">Novo email</Label>
                <Input
                  aria-invalid={!!error}
                  autoFocus
                  className={
                    error
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  id="newEmail"
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    clearError();
                  }}
                  placeholder="novo@email.com"
                  type="email"
                  value={newEmail}
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
              </div>
              <p className="text-muted-foreground text-xs">
                Um email de verificação será enviado para o novo endereço. A
                alteração só será concluída após a verificação.
              </p>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button onClick={handleCloseDialog} variant="outline">
              Cancelar
            </Button>
            <Button disabled={isChanging} onClick={handleChangeEmail}>
              {isChanging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar verificação"
              )}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
