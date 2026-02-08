"use client";

import {
  ArrowRight,
  CheckCircle,
  Loader2,
  UserPlus,
  XCircle,
} from "lucide-react";
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

const activateAccountSchema = z
  .object({
    password: z
      .string()
      .min(1, "A senha é obrigatória")
      .min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Verificar se há erro no token
  useEffect(() => {
    if (errorParam === "INVALID_TOKEN") {
      toast.error("O link de ativação é inválido ou expirou.");
    }
  }, [errorParam]);

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      toast.error("Token de ativação não encontrado");
      return;
    }

    // Validação com Zod
    const result = activateAccountSchema.safeParse({
      password,
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
      // Usar a API de reset de senha para definir a senha
      const response = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (response.error) {
        const errorMessage = response.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid") ||
          errorMessage.includes("expired")
        ) {
          toast.error("O link de ativação é inválido ou expirou.");
        } else {
          toast.error(response.error.message || "Erro ao ativar conta");
        }
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Erro ao ativar conta:", err);
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Estado de erro (token inválido ou expirado)
  if (errorParam === "INVALID_TOKEN" || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>
              O link de ativação não é mais válido. Entre em contato com o
              administrador para receber um novo convite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" render={<Link href="/login" />}>
              Ir para o login
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
        <Card className="w-full max-w-md rounded-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Conta ativada!</CardTitle>
            <CardDescription>
              Sua conta foi ativada com sucesso. Agora você pode fazer login com
              seu email e a senha que acabou de criar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" render={<Link href="/login" />}>
              Fazer login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de ativação
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Ative sua conta</CardTitle>
          <CardDescription>
            Bem-vindo ao FBI Gestor! Crie uma senha para acessar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                aria-invalid={!!errors.password}
                autoFocus
                className={
                  errors.password
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                disabled={isLoading}
                id="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                placeholder="Crie uma senha"
                type="password"
                value={password}
              />
              {errors.password ? (
                <p className="text-destructive text-sm">{errors.password}</p>
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
                placeholder="Confirme sua senha"
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
                  Ativando...
                </>
              ) : (
                "Ativar conta"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}
