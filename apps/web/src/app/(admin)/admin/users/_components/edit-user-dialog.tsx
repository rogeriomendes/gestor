"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Separator } from "@/components/ui/separator";
import { trpc, trpcClient } from "@/utils/trpc";
import { ResetPasswordSection } from "./reset-password-section";
import { UserBasicInfoSection } from "./user-basic-info-section";
import { UserTenantSection } from "./user-tenant-section";

interface EditUserDialogProps {
  /**
   * Se true, oculta a seção de seleção de tenant (usado na área do tenant)
   */
  hideTenantSection?: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
  userEmail: string;
  userId: string;
  userName: string;
  userRole?: string | null;
  userTenantId?: string | null;
}

export function EditUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  userTenantId,
  userRole,
  onSuccess,
  hideTenantSection = false,
}: EditUserDialogProps) {
  const [name, setName] = useState(userName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Usar tenantId e role passados como props, ou buscar se não disponíveis
  const { data: userData, refetch: refetchUser } = useQuery({
    ...trpc.admin.listAllUsers.queryOptions({
      page: 1,
      limit: 100,
    }),
    enabled: open && !(userTenantId || userRole), // Só buscar se não tiver os dados
    select: (data) => data.data.find((u) => u.user.id === userId) || null,
  });

  // Priorizar dados passados como props, depois dados da query
  const currentTenantId = userTenantId ?? userData?.tenant?.id ?? null;
  const currentRole = userRole ?? userData?.role ?? null;

  // Resetar campos quando o diálogo abrir/fechar
  useEffect(() => {
    if (open) {
      setName(userName);
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
      refetchUser();
    }
  }, [open, userName, refetchUser]);

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
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <CredenzaTitle>Editar Usuário</CredenzaTitle>
          <CredenzaDescription>
            Atualize o nome do usuário ou defina uma nova senha
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody>
          <div className="space-y-6">
            <UserBasicInfoSection
              email={userEmail}
              name={name}
              onNameChange={setName}
            />

            {(currentTenantId || !hideTenantSection) && (
              <>
                <Separator />

                <UserTenantSection
                  currentRole={currentRole}
                  currentTenantId={currentTenantId}
                  hideTenantSelection={hideTenantSection}
                  onSuccess={() => {
                    refetchUser();
                    onSuccess();
                  }}
                  userId={userId}
                />
              </>
            )}

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
        </CredenzaBody>

        <CredenzaFooter>
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
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
