"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function TwoFactorSection() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr");

  const isTwoFactorEnabled = (
    session?.user as { twoFactorEnabled?: boolean } | undefined
  )?.twoFactorEnabled;

  const handleEnable2FA = async () => {
    setIsEnabling(true);
    try {
      const result = await authClient.twoFactor.enable({
        password,
      });

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid password") ||
          errorMessage.includes("incorrect password")
        ) {
          throw new Error("Senha incorreta");
        }
        throw new Error(result.error.message || "Erro ao habilitar 2FA");
      }

      if (result.data?.totpURI) {
        setTotpURI(result.data.totpURI);
        if (result.data.backupCodes) {
          setBackupCodes(result.data.backupCodes);
        }
        setStep("qr");
        setShowPasswordDialog(false);
        setShowSetupDialog(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao habilitar 2FA"
      );
    } finally {
      setIsEnabling(false);
      setPassword("");
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
      });

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid") ||
          errorMessage.includes("incorrect")
        ) {
          throw new Error("Código inválido. Verifique e tente novamente.");
        }
        throw new Error(result.error.message || "Erro ao verificar código");
      }

      toast.success("Autenticação de dois fatores ativada!");
      setStep("backup");
      refetchSession();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Código inválido. Verifique e tente novamente."
      );
    }
  };

  const handleDisable2FA = async () => {
    setIsDisabling(true);
    try {
      const result = await authClient.twoFactor.disable({
        password,
      });

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid password") ||
          errorMessage.includes("incorrect password")
        ) {
          throw new Error("Senha incorreta");
        }
        throw new Error(result.error.message || "Erro ao desativar 2FA");
      }

      toast.success("Autenticação de dois fatores desativada!");
      setShowDisableDialog(false);
      refetchSession();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao desativar 2FA"
      );
    } finally {
      setIsDisabling(false);
      setPassword("");
    }
  };

  const handleCloseSetupDialog = () => {
    setShowSetupDialog(false);
    setTotpURI("");
    setBackupCodes([]);
    setVerificationCode("");
    setStep("qr");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança com um aplicativo
            autenticador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${isTwoFactorEnabled ? "bg-green-100 dark:bg-green-900" : "bg-muted"}`}
              >
                <ShieldCheck
                  className={`h-5 w-5 ${isTwoFactorEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Aplicativo Autenticador</p>
                  {isTwoFactorEnabled && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Ativo
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {isTwoFactorEnabled
                    ? "Use seu aplicativo para gerar códigos"
                    : "Google Authenticator, Authy, etc."}
                </p>
              </div>
            </div>
            {isTwoFactorEnabled ? (
              <Button
                onClick={() => setShowDisableDialog(true)}
                variant="destructive"
              >
                Desativar
              </Button>
            ) : (
              <Button
                onClick={() => setShowPasswordDialog(true)}
                variant="outline"
              >
                Configurar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para inserir senha antes de configurar 2FA */}
      <Credenza
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) setPassword("");
        }}
        open={showPasswordDialog}
      >
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Configurar 2FA</CredenzaTitle>
            <CredenzaDescription>
              Digite sua senha para continuar
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password2fa">Senha</Label>
                <Input
                  autoFocus
                  id="password2fa"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  type="password"
                  value={password}
                />
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button
              onClick={() => setShowPasswordDialog(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isEnabling || !password}
              onClick={handleEnable2FA}
            >
              {isEnabling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Dialog de Setup do 2FA */}
      <Credenza onOpenChange={handleCloseSetupDialog} open={showSetupDialog}>
        <CredenzaContent className="max-w-md">
          <CredenzaHeader>
            <CredenzaTitle>
              {step === "qr" && "Escaneie o QR Code"}
              {step === "verify" && "Verificar Código"}
              {step === "backup" && "Códigos de Backup"}
            </CredenzaTitle>
            <CredenzaDescription>
              {step === "qr" &&
                "Use seu aplicativo autenticador para escanear o código"}
              {step === "verify" && "Digite o código gerado pelo aplicativo"}
              {step === "backup" && "Guarde esses códigos em um local seguro"}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            {step === "qr" && totpURI && (
              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="rounded-lg bg-white p-4">
                  <QRCode size={200} value={totpURI} />
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  Não consegue escanear? Copie o código manualmente no
                  aplicativo.
                </p>
              </div>
            )}
            {step === "verify" && (
              <div className="flex flex-col items-center space-y-4 py-4">
                <Label className="text-center">Código de Verificação</Label>
                <InputOTP
                  autoFocus
                  maxLength={6}
                  onChange={(value) => setVerificationCode(value)}
                  onComplete={(value) => {
                    setVerificationCode(value);
                    setTimeout(() => {
                      handleVerify2FA();
                    }, 100);
                  }}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={verificationCode}
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
              </div>
            )}
            {step === "backup" && backupCodes.length > 0 && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <code
                      className="rounded bg-muted p-2 text-center font-mono text-sm"
                      key={code}
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <p className="text-center text-muted-foreground text-xs">
                  Cada código só pode ser usado uma vez
                </p>
              </div>
            )}
          </CredenzaBody>
          <CredenzaFooter>
            {step === "qr" && (
              <Button onClick={() => setStep("verify")}>Próximo</Button>
            )}
            {step === "verify" && (
              <Button
                disabled={verificationCode.length !== 6}
                onClick={handleVerify2FA}
              >
                Verificar
              </Button>
            )}
            {step === "backup" && (
              <Button onClick={handleCloseSetupDialog}>Concluir</Button>
            )}
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Dialog para desabilitar 2FA */}
      <Credenza onOpenChange={setShowDisableDialog} open={showDisableDialog}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Desativar 2FA</CredenzaTitle>
            <CredenzaDescription>
              Digite sua senha para desativar a autenticação de dois fatores
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="disablePassword">Senha</Label>
                <Input
                  id="disablePassword"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  type="password"
                  value={password}
                />
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button
              onClick={() => setShowDisableDialog(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isDisabling || !password}
              onClick={handleDisable2FA}
              variant="destructive"
            >
              {isDisabling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar"
              )}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
