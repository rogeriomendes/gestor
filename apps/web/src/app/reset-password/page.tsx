"use client";

import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "A senha é obrigatória")
      .min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Verificar se há erro no token
  useEffect(() => {
    if (errorParam === "INVALID_TOKEN") {
      toast.error("O link de redefinição é inválido ou expirou.");
    }
  }, [errorParam]);

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      toast.error("Token de redefinição não encontrado");
      return;
    }

    // Validação com Zod
    const result = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof typeof errors] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (response.error) {
        const errorMessage = response.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid") ||
          errorMessage.includes("expired")
        ) {
          toast.error("O link de redefinição é inválido ou expirou.");
        } else {
          toast.error(response.error.message || "Erro ao redefinir senha");
        }
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Estado de erro (token inválido ou expirado)
  if (errorParam === "INVALID_TOKEN" || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>
              O link de redefinição de senha não é mais válido. Por favor,
              solicite um novo link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              render={<Link href="/forgot-password" />}
            >
              Solicitar novo link
            </Button>
            <Button
              className="w-full"
              // onClick={() => router.push("/")}
              render={<Link href="/" />}
              variant="ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de sucesso
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Senha redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso. Agora você pode fazer login
              com sua nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" render={<Link href="/" />}>
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de redefinição
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>Digite sua nova senha abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                aria-invalid={!!errors.newPassword}
                autoFocus
                className={
                  errors.newPassword
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                disabled={isLoading}
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
                <p className="text-destructive text-sm">{errors.newPassword}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Mínimo de 8 caracteres
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                aria-invalid={!!errors.confirmPassword}
                className={
                  errors.confirmPassword
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                disabled={isLoading}
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
            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir senha"
              )}
            </Button>
            <Button
              className="w-full"
              render={<Link href="/" />}
              variant="ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
