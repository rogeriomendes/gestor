"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";

import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/tenant-context";
import { authClient } from "@/lib/auth-client";
import { getRedirectPath } from "@/lib/auth-redirect";

export default function TwoFactorPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { role, isLoading: tenantLoading } = useTenant();

  const [otpCode, setOtpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [backupError, setBackupError] = useState("");

  // Redirecionar se já estiver autenticado completamente
  useEffect(() => {
    if (session?.user && role && !tenantLoading) {
      const redirectPath = getRedirectPath(role);
      router.push(redirectPath as never);
    }
  }, [session, role, tenantLoading, router]);

  // Verificar código TOTP
  const handleVerifyTotp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Digite o código de 6 dígitos");
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: otpCode,
      });

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid") ||
          errorMessage.includes("incorrect")
        ) {
          setOtpError("Código inválido. Verifique e tente novamente.");
        } else {
          setOtpError(result.error.message || "Erro ao verificar código");
        }
        return;
      }

      toast.success("Login realizado com sucesso!");
      // O redirecionamento será feito pelo useEffect quando a sessão for atualizada
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : "Erro ao verificar código. Tente novamente."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Tratar erro de verificação de backup code
  const handleBackupCodeError = (errorMessage: string) => {
    const lowerMessage = errorMessage.toLowerCase();

    if (
      lowerMessage.includes("invalid two factor cookie") ||
      lowerMessage.includes("two factor cookie")
    ) {
      setBackupError(
        "Sessão de 2FA expirada. Por favor, faça login novamente."
      );
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    const isInvalidCode =
      lowerMessage.includes("invalid") ||
      lowerMessage.includes("incorrect") ||
      lowerMessage.includes("not found");

    setBackupError(
      isInvalidCode
        ? "Código de backup inválido ou já usado."
        : errorMessage || "Erro ao verificar código"
    );
  };

  // Verificar código de backup
  const handleVerifyBackupCode = async () => {
    const cleanCode = `${backupCode.substring(0, 5)}-${backupCode.substring(5)}`;

    if (cleanCode.length !== 11) {
      setBackupError("Digite o código completo de 10 caracteres");
      return;
    }

    setIsVerifying(true);
    setBackupError("");

    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code: cleanCode,
      });

      if (result.error) {
        handleBackupCodeError(result.error.message || "");
        return;
      }

      toast.success("Login realizado com sucesso!");
    } catch (error) {
      setBackupError(
        error instanceof Error
          ? error.message
          : "Erro ao verificar código. Tente novamente."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Voltar para o login
  const handleBack = () => {
    router.push("/login");
  };

  if (sessionPending) {
    return <Loader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md p-6">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-center font-bold text-2xl">
            Verificação em duas etapas
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            Use o código do seu aplicativo autenticador ou um código de backup
          </p>
        </div>

        <Tabs
          className="w-full"
          defaultValue="totp"
          onValueChange={() => {
            setOtpError("");
            setBackupError("");
            setOtpCode("");
            setBackupCode("");
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Código do App
            </TabsTrigger>
            <TabsTrigger value="backup">
              <KeyRound className="mr-2 h-4 w-4" />
              Código de Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6 space-y-6" value="totp">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                autoFocus
                maxLength={6}
                onChange={(value) => {
                  setOtpCode(value);
                  setOtpError("");
                }}
                onComplete={(value) => {
                  setOtpCode(value);
                  // Auto-submit quando completar 6 dígitos
                  setTimeout(() => {
                    handleVerifyTotp();
                  }, 100);
                }}
                pattern={REGEXP_ONLY_DIGITS}
                value={otpCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              {otpError && (
                <p className="text-center text-destructive text-sm">
                  {otpError}
                </p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={isVerifying || otpCode.length !== 6}
              onClick={handleVerifyTotp}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </TabsContent>

          <TabsContent className="mt-6 space-y-6" value="backup">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                autoFocus
                maxLength={10}
                onChange={(value) => {
                  setBackupCode(value);
                  setBackupError("");
                }}
                onComplete={(value) => {
                  setBackupCode(value);
                  // Auto-submit quando completar 10 caracteres
                  setTimeout(() => {
                    handleVerifyBackupCode();
                  }, 100);
                }}
                pasteTransformer={(pasted) => {
                  return pasted.replaceAll("-", "");
                }}
                value={backupCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                </InputOTPGroup>
                <div className="flex h-10 w-6 items-center justify-center text-muted-foreground">
                  -
                </div>
                <InputOTPGroup>
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                  <InputOTPSlot index={8} />
                  <InputOTPSlot index={9} />
                </InputOTPGroup>
              </InputOTP>

              {backupError && (
                <p className="text-center text-destructive text-sm">
                  {backupError}
                </p>
              )}

              <p className="text-muted-foreground text-xs">
                Use um dos códigos de backup que você salvou quando configurou o
                2FA
              </p>
            </div>

            <Button
              className="w-full"
              disabled={
                isVerifying || backupCode.replace(/-/g, "").length !== 10
              }
              onClick={handleVerifyBackupCode}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Código de Backup"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <Button className="mt-6 w-full" onClick={handleBack} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao login
        </Button>
      </div>
    </div>
  );
}
