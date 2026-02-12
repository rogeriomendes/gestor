"use client";

import { KeyRound, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordSection() {
  const [showDialog, setShowDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleChangePassword = async () => {
    setErrors({});

    // Validação de campo obrigatório - senha atual primeiro
    if (!currentPassword) {
      setErrors({ currentPassword: "Digite sua senha atual" });
      return;
    }

    // Validações locais da nova senha
    const validationErrors: typeof errors = {};

    if (!newPassword) {
      validationErrors.newPassword = "Digite a nova senha";
    } else if (newPassword.length < 8) {
      validationErrors.newPassword = "A senha deve ter pelo menos 8 caracteres";
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = "Confirme a nova senha";
    } else if (newPassword && newPassword !== confirmPassword) {
      validationErrors.confirmPassword = "As senhas não coincidem";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsChanging(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid password") ||
          errorMessage.includes("incorrect password") ||
          errorMessage.includes("wrong password")
        ) {
          setErrors({ currentPassword: "Senha atual incorreta" });
          return;
        }
        toast.error(result.error.message || "Erro ao alterar senha");
        return;
      }

      toast.success("Senha alterada com sucesso!");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar senha"
      );
    } finally {
      setIsChanging(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Senha
          </CardTitle>
          <CardDescription>Gerencie sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Alterar Senha</p>
              <p className="text-muted-foreground text-sm">
                Altere sua senha de acesso
              </p>
            </div>
            <Button onClick={() => setShowDialog(true)} variant="outline">
              Alterar senha
            </Button>
          </div>
        </CardContent>
      </Card>

      <Credenza
        onOpenChange={(open) => {
          if (open) {
            setShowDialog(true);
          } else {
            handleCloseDialog();
          }
        }}
        open={showDialog}
      >
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Alterar Senha</CredenzaTitle>
            <CredenzaDescription>
              Digite sua senha atual e a nova senha desejada
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  aria-invalid={!!errors.currentPassword}
                  autoFocus
                  className={
                    errors.currentPassword
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  id="currentPassword"
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    clearError("currentPassword");
                  }}
                  placeholder="Digite sua senha atual"
                  type="password"
                  value={currentPassword}
                />
                {errors.currentPassword && (
                  <p className="text-destructive text-sm">
                    {errors.currentPassword}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  aria-invalid={!!errors.newPassword}
                  className={
                    errors.newPassword
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  id="newPassword"
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearError("newPassword");
                  }}
                  placeholder="Digite a nova senha"
                  type="password"
                  value={newPassword}
                />
                {errors.newPassword ? (
                  <p className="text-destructive text-sm">
                    {errors.newPassword}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Mínimo de 8 caracteres
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  aria-invalid={!!errors.confirmPassword}
                  className={
                    errors.confirmPassword
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  id="confirmPassword"
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError("confirmPassword");
                  }}
                  placeholder="Confirme a nova senha"
                  type="password"
                  value={confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button onClick={handleCloseDialog} variant="outline">
              Cancelar
            </Button>
            <Button disabled={isChanging} onClick={handleChangePassword}>
              {isChanging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
