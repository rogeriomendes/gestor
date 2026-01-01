"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { trpcClient } from "@/utils/trpc";
import { ResetPasswordSection } from "./reset-password-section";
import { UserBasicInfoSection } from "./user-basic-info-section";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  onSuccess: () => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  onSuccess,
}: EditUserDialogProps) {
  const [name, setName] = useState(userName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Resetar campos quando o diálogo abrir/fechar
  useEffect(() => {
    if (open) {
      setName(userName);
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
    }
  }, [open, userName]);

  const updateUserMutation = useMutation({
    mutationFn: (input: { userId: string; name?: string; email?: string }) =>
      trpcClient.admin.updateUser.mutate(input),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (input: { userId: string; newPassword: string }) =>
      trpcClient.admin.resetUserPassword.mutate(input),
  });

  const validatePassword = (): boolean => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return false;
    }

    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return false;
    }

    return true;
  };

  const getSuccessMessage = (
    hasNameChanges: boolean,
    hasPasswordReset: boolean
  ): string => {
    if (hasNameChanges && hasPasswordReset) {
      return "Nome atualizado e senha resetada com sucesso!";
    }
    if (hasNameChanges) {
      return "Nome atualizado com sucesso!";
    }
    return "Senha resetada com sucesso!";
  };

  const updateUserName = async (): Promise<void> => {
    await updateUserMutation.mutateAsync({
      userId,
      name,
    });
  };

  const resetPassword = async (): Promise<void> => {
    if (!validatePassword()) {
      return;
    }

    await resetPasswordMutation.mutateAsync({
      userId,
      newPassword,
    });
  };

  const handleSave = async () => {
    try {
      const hasNameChanges = name !== userName;
      const hasPasswordReset = Boolean(showPasswordFields && newPassword);

      if (!(hasNameChanges || hasPasswordReset)) {
        toast.error("Nenhuma alteração foi feita");
        return;
      }

      if (hasNameChanges) {
        await updateUserName();
      }

      if (hasPasswordReset) {
        await resetPassword();
      }

      toast.success(getSuccessMessage(hasNameChanges, hasPasswordReset));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar usuário"
      );
    }
  };

  const isLoading =
    updateUserMutation.isPending || resetPasswordMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize o nome do usuário ou defina uma nova senha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <UserBasicInfoSection
            email={userEmail}
            name={name}
            onNameChange={setName}
          />

          <Separator />

          <ResetPasswordSection
            confirmPassword={confirmPassword}
            newPassword={newPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onNewPasswordChange={setNewPassword}
            onTogglePasswordFields={() =>
              setShowPasswordFields(!showPasswordFields)
            }
            showPasswordFields={showPasswordFields}
          />
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancelar
          </Button>
          <Button disabled={isLoading} onClick={handleSave}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
