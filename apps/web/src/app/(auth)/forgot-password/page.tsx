"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "O email é obrigatório")
    .email("Digite um email válido"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    // Validação com Zod
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (response.error) {
        // Não revelar se o email existe ou não por segurança
        console.error("Erro ao solicitar reset:", response.error);
      }

      // Sempre mostrar sucesso para não revelar se o email existe
      setIsSuccess(true);
    } catch (err) {
      console.error("Erro ao solicitar reset:", err);
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Verifique seu email</CardTitle>
            <CardDescription>
              Se existe uma conta com o email <strong>{email}</strong>, você
              receberá um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Não recebeu o email? Verifique sua pasta de spam ou tente
              novamente em alguns minutos.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setIsSuccess(false)} variant="outline">
                Tentar outro email
              </Button>
              <Button render={<Link href="/login" />} variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email e enviaremos um link para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                aria-invalid={!!error}
                autoFocus
                className={
                  error
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                disabled={isLoading}
                id="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(undefined);
                }}
                placeholder="seu@email.com"
                type="email"
                value={email}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
            <Button
              className="w-full"
              render={<Link href="/login" />}
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
