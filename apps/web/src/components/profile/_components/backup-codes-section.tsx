"use client";

import { KeyRound, Loader2, RefreshCw } from "lucide-react";
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

export function BackupCodesSection() {
  const { data: session } = authClient.useSession();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isTwoFactorEnabled = (
    session?.user as { twoFactorEnabled?: boolean } | undefined
  )?.twoFactorEnabled;

  const handleGenerateBackupCodes = async () => {
    if (!password) {
      toast.error("Digite sua senha");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await authClient.twoFactor.generateBackupCodes({
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
        throw new Error(
          result.error.message || "Erro ao gerar códigos de backup"
        );
      }

      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        setShowPasswordDialog(false);
        setShowCodesDialog(true);
        setPassword("");
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

  const handleCloseCodesDialog = () => {
    setShowCodesDialog(false);
    setBackupCodes([]);
  };

  const handleCopyAllCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    toast.success("Códigos copiados para a área de transferência!");
  };

  // Só mostra se o 2FA estiver habilitado
  if (!isTwoFactorEnabled) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Códigos de Backup
          </CardTitle>
          <CardDescription>
            Gere novos códigos de recuperação para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Regenerar Códigos</p>
              <p className="text-muted-foreground text-sm">
                Gere novos códigos caso tenha perdido os anteriores
              </p>
            </div>
            <Button
              onClick={() => setShowPasswordDialog(true)}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerar
            </Button>
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            Ao regenerar, os códigos antigos serão invalidados.
          </p>
        </CardContent>
      </Card>

      {/* Dialog para inserir senha */}
      <Credenza
        onOpenChange={(open) => {
          if (open) setShowPasswordDialog(true);
          else {
            setShowPasswordDialog(false);
            setPassword("");
          }
        }}
        open={showPasswordDialog}
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
                <Label htmlFor="backupPassword">Senha</Label>
                <Input
                  autoFocus
                  id="backupPassword"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  type="password"
                  value={password}
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
              onClick={() => setShowPasswordDialog(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isGenerating || !password}
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

      {/* Dialog para exibir os códigos */}
      <Credenza onOpenChange={handleCloseCodesDialog} open={showCodesDialog}>
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
                Cada código só pode ser usado uma vez. Guarde-os em um local
                seguro!
              </p>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button onClick={handleCopyAllCodes} variant="outline">
              Copiar todos
            </Button>
            <Button onClick={handleCloseCodesDialog}>Concluído</Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
