"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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

export function DeleteAccountSection() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const user = session?.user;
  const expectedConfirmText = "excluir minha conta";

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== expectedConfirmText) {
      toast.error("Digite o texto de confirmação corretamente");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await authClient.deleteUser({
        password: password || undefined,
        callbackURL: "/",
      });

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("invalid password") ||
          errorMessage.includes("incorrect password")
        ) {
          throw new Error("Senha incorreta");
        }
        throw new Error(result.error.message || "Erro ao excluir conta");
      }

      toast.success("Sua conta foi excluída com sucesso");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir conta"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setPassword("");
    setConfirmText("");
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis relacionadas à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div>
              <p className="font-medium">Excluir Conta</p>
              <p className="text-muted-foreground text-sm">
                Exclua permanentemente sua conta e todos os dados
              </p>
            </div>
            <Button onClick={() => setShowDialog(true)} variant="destructive">
              Excluir conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <Credenza onOpenChange={handleCloseDialog} open={showDialog}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Conta
            </CredenzaTitle>
            <CredenzaDescription>
              Esta ação é irreversível. Todos os seus dados serão
              permanentemente excluídos.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <p className="font-medium text-destructive text-sm">
                  O que será excluído:
                </p>
                <ul className="mt-2 list-inside list-disc text-muted-foreground text-sm">
                  <li>Todas as suas informações de perfil</li>
                  <li>Configurações de segurança (2FA, passkeys)</li>
                  <li>Histórico de sessões</li>
                  <li>Contas vinculadas</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deletePassword">Senha</Label>
                <Input
                  id="deletePassword"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  type="password"
                  value={password}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmDelete">
                  Digite <strong>{expectedConfirmText}</strong> para confirmar
                </Label>
                <Input
                  id="confirmDelete"
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={expectedConfirmText}
                  value={confirmText}
                />
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button onClick={handleCloseDialog} variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={
                isDeleting ||
                confirmText.toLowerCase() !== expectedConfirmText ||
                !password
              }
              onClick={handleDeleteAccount}
              variant="destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir minha conta"
              )}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
