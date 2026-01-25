"use client";

import { useQuery } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export function TwoFactorSection() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegeneratePasswordDialog, setShowRegeneratePasswordDialog] =
    useState(false);
  const [showRegeneratedCodesDialog, setShowRegeneratedCodesDialog] =
    useState(false);
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [regeneratedBackupCodes, setRegeneratedBackupCodes] = useState<
    string[]
  >([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [regeneratePassword, setRegeneratePassword] = useState("");
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr");
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);

  const isTwoFactorEnabled = (
    session?.user as { twoFactorEnabled?: boolean } | undefined
  )?.twoFactorEnabled;

  // Buscar códigos de backup atuais usando tRPC que chama a API do Better Auth
  const { data: backupCodesData, refetch: refetchBackupCodes } = useQuery({
    ...trpc.tenant.users.getMyBackupCodes.queryOptions(),
    enabled: !!isTwoFactorEnabled && !!session?.user,
    refetchOnWindowFocus: false,
  });

  const currentBackupCodes =
    (backupCodesData as { backupCodes?: string[] } | undefined)?.backupCodes ||
    [];

  // Função auxiliar para tratar erros de senha
  const handlePasswordError = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase();
    if (
      lowerMessage.includes("invalid password") ||
      lowerMessage.includes("incorrect password")
    ) {
      return "Senha incorreta";
    }
    return errorMessage || "Erro ao processar";
  };

  const handleEnable2FA = async () => {
    setIsEnabling(true);
    try {
      const result = await authClient.twoFactor.enable({ password });

      if (result.error) {
        throw new Error(handlePasswordError(result.error.message || ""));
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

  // Função auxiliar para tratar erros de código
  const handleCodeError = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase();
    if (
      lowerMessage.includes("invalid") ||
      lowerMessage.includes("incorrect")
    ) {
      return "Código inválido. Verifique e tente novamente.";
    }
    return errorMessage || "Erro ao verificar código";
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
        throw new Error(handleCodeError(result.error.message || ""));
      }

      toast.success("Autenticação de dois fatores ativada!");
      setStep("backup");
      refetchSession();
      refetchBackupCodes();
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
      const result = await authClient.twoFactor.disable({ password });

      if (result.error) {
        throw new Error(handlePasswordError(result.error.message || ""));
      }

      toast.success("Autenticação de dois fatores desativada!");
      setShowDisableDialog(false);
      refetchSession();
      refetchBackupCodes();
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

  const handleGenerateBackupCodes = async () => {
    if (!regeneratePassword) {
      toast.error("Digite sua senha");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await authClient.twoFactor.generateBackupCodes({
        password: regeneratePassword,
      });

      if (result.error) {
        throw new Error(handlePasswordError(result.error.message || ""));
      }

      if (result.data?.backupCodes) {
        setRegeneratedBackupCodes(result.data.backupCodes);
        setShowRegeneratePasswordDialog(false);
        setShowRegeneratedCodesDialog(true);
        setRegeneratePassword("");
        refetchBackupCodes();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao gerar códigos de backup"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAllCodes = () => {
    const codesText = regeneratedBackupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    toast.success("Códigos copiados para a área de transferência!");
  };

  // Funções auxiliares para renderizar dialogs (reduz complexidade)
  const renderPasswordDialog = () => (
    <Credenza
      onOpenChange={(open) => {
        setShowPasswordDialog(open);
        if (!open) {
          setPassword("");
        }
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
          <Button disabled={isEnabling || !password} onClick={handleEnable2FA}>
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
  );

  const renderSetupDialog = () => (
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
                Não consegue escanear? Copie o código manualmente no aplicativo.
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
  );

  const renderBackupCodesDialog = () => (
    <Credenza
      onOpenChange={setShowBackupCodesDialog}
      open={showBackupCodesDialog}
    >
      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <CredenzaTitle>Códigos de Backup</CredenzaTitle>
          <CredenzaDescription>
            {currentBackupCodes.length > 0
              ? `Você tem ${currentBackupCodes.length} código(s) disponível(is). Cada código só pode ser usado uma vez.`
              : "Todos os códigos foram usados. Gere novos códigos na seção 'Códigos de Backup'."}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {currentBackupCodes.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-4">
              {currentBackupCodes.map((code: string) => (
                <div
                  className="flex items-center justify-between rounded-md border bg-background p-2"
                  key={code}
                >
                  <code className="font-mono text-sm">{code}</code>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden text-xs md:block">Disponível</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-muted-foreground/30 border-dashed bg-muted/30 p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Todos os códigos foram usados. Gere novos códigos na seção
                "Códigos de Backup".
              </p>
            </div>
          )}
        </CredenzaBody>
        <CredenzaFooter>
          <Button onClick={() => setShowBackupCodesDialog(false)}>
            Fechar
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );

  const renderRegeneratePasswordDialog = () => (
    <Credenza
      onOpenChange={(open) => {
        setShowRegeneratePasswordDialog(open);
        if (!open) {
          setRegeneratePassword("");
        }
      }}
      open={showRegeneratePasswordDialog}
    >
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Regenerar Códigos de Backup</CredenzaTitle>
          <CredenzaDescription>
            Digite sua senha para gerar novos códigos de backup
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="regeneratePassword">Senha</Label>
              <Input
                autoFocus
                id="regeneratePassword"
                onChange={(e) => setRegeneratePassword(e.target.value)}
                placeholder="Digite sua senha"
                type="password"
                value={regeneratePassword}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Atenção: Os códigos antigos serão invalidados após a geração de
              novos códigos.
            </p>
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <Button
            onClick={() => setShowRegeneratePasswordDialog(false)}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            disabled={isGenerating || !regeneratePassword}
            onClick={handleGenerateBackupCodes}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Códigos"
            )}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );

  const renderRegeneratedCodesDialog = () => (
    <Credenza
      onOpenChange={(open) => {
        setShowRegeneratedCodesDialog(open);
        if (!open) {
          setRegeneratedBackupCodes([]);
        }
      }}
      open={showRegeneratedCodesDialog}
    >
      <CredenzaContent className="max-w-md">
        <CredenzaHeader>
          <CredenzaTitle>Novos Códigos de Backup</CredenzaTitle>
          <CredenzaDescription>
            Guarde esses códigos em um local seguro
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {regeneratedBackupCodes.map((code) => (
                <code
                  className="rounded bg-muted p-2 text-center font-mono text-sm"
                  key={code}
                >
                  {code}
                </code>
              ))}
            </div>
            <p className="text-center text-muted-foreground text-xs">
              Cada código só pode ser usado uma vez. Guarde-os em um local
              seguro!
            </p>
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <Button onClick={handleCopyAllCodes} variant="outline">
            Copiar todos
          </Button>
          <Button onClick={() => setShowRegeneratedCodesDialog(false)}>
            Concluído
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );

  const renderDisableDialog = () => (
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
          <Button onClick={() => setShowDisableDialog(false)} variant="outline">
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
  );

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
        <CardContent className="space-y-4">
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

          {/* Exibir códigos de backup se 2FA estiver habilitado */}
          {isTwoFactorEnabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Códigos de Backup</p>
                    <p className="text-muted-foreground text-sm">
                      {currentBackupCodes.length > 0
                        ? `${currentBackupCodes.length} código(s) disponível(is)`
                        : "Nenhum código disponível"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        refetchBackupCodes();
                        setShowBackupCodesDialog(true);
                      }}
                      variant="outline"
                    >
                      Ver Códigos
                    </Button>
                    <Button
                      onClick={() => setShowRegeneratePasswordDialog(true)}
                      variant="outline"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerar
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Ao regenerar, os códigos antigos serão invalidados.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {renderPasswordDialog()}
      {renderSetupDialog()}
      {renderBackupCodesDialog()}
      {renderRegeneratePasswordDialog()}
      {renderRegeneratedCodesDialog()}
      {renderDisableDialog()}
    </>
  );
}
