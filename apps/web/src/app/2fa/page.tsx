"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
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
import { useTenant } from "@/contexts/tenant-context";
import { authClient } from "@/lib/auth-client";
import { getRedirectPath } from "@/lib/auth-redirect";

export default function TwoFactorPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { role, isLoading: tenantLoading } = useTenant();

  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Redirecionar se já estiver autenticado completamente
  useEffect(() => {
    if (session?.user && role && !tenantLoading) {
      const redirectPath = getRedirectPath(role);
      router.push(redirectPath as never);
    }
  }, [session, role, tenantLoading, router]);

  // Verificar código 2FA
  const handleVerify = async () => {
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

  // Voltar para o login
  const handleBack = () => {
    router.push("/");
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
            Digite o código de 6 dígitos do seu aplicativo autenticador
          </p>
        </div>

        <div className="space-y-6">
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
                  handleVerify();
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
              <p className="text-center text-destructive text-sm">{otpError}</p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={isVerifying || otpCode.length !== 6}
            onClick={handleVerify}
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

          <Button className="w-full" onClick={handleBack} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao login
          </Button>
        </div>
      </div>
    </div>
  );
}
