"use client";

import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpcClient } from "@/utils/trpc";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface AddUserDialogProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
  tenantId: string;
}

export function AddUserDialog({
  open,
  onOpenChange,
  tenantId,
  onSuccess,
}: AddUserDialogProps) {
  const [createUserMode, setCreateUserMode] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("TENANT_USER");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const inviteUserMutation = useMutation({
    mutationFn: (input: { email: string; role: Role }) =>
      trpcClient.tenant.users.inviteUser.mutate(input),
  });

  const createUserMutation = useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      tenantId?: string;
      role: Role;
    }) => trpcClient.admin.createUser.mutate(input),
  });

  const handleInviteUser = async () => {
    if (!selectedEmail) {
      toast.error("Por favor, insira o email do usuário");
      return;
    }

    try {
      await inviteUserMutation.mutateAsync({
        email: selectedEmail,
        role: selectedRole,
      });
      toast.success("Usuário convidado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setSelectedEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao convidar usuário"
      );
    }
  };

  const handleCreateUser = async () => {
    if (!(newUserName && newUserEmail)) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: newUserName,
        email: newUserEmail,
        tenantId,
        role: selectedRole,
      });
      toast.success(
        "Usuário criado! Um email foi enviado para que ele ative sua conta."
      );
      onSuccess();
      onOpenChange(false);
      setCreateUserMode(false);
      setNewUserName("");
      setNewUserEmail("");
      setSelectedEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar usuário"
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedEmail("");
    setCreateUserMode(false);
    setNewUserName("");
    setNewUserEmail("");
  };

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Adicionar Usuário ao Cliente</CredenzaTitle>
          <CredenzaDescription>
            {createUserMode
              ? "O usuário receberá um email para ativar sua conta"
              : "Convidar um usuário existente ou criar um novo"}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b">
              <nav className="-mb-px flex space-x-4">
                <button
                  className={`border-b-2 px-1 py-2 font-medium text-sm ${
                    createUserMode
                      ? "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
                      : "border-primary text-primary"
                  }`}
                  onClick={() => {
                    setCreateUserMode(false);
                    setSelectedEmail("");
                  }}
                  type="button"
                >
                  Convidar Existente
                </button>
                <button
                  className={`border-b-2 px-1 py-2 font-medium text-sm ${
                    createUserMode
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => {
                    setCreateUserMode(true);
                    setSelectedEmail("");
                  }}
                  type="button"
                >
                  Criar Novo
                </button>
              </nav>
            </div>

            {/* Role Selection */}
            <div>
              <Label>Role</Label>
              <Select
                onValueChange={(value) => setSelectedRole(value as Role)}
                value={selectedRole}
              >
                <SelectTrigger>
                  <SelectValue>Selecione a role</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TENANT_USER">Usuário</SelectItem>
                  <SelectItem value="TENANT_USER_MANAGER">
                    Gerente de Usuários
                  </SelectItem>
                  <SelectItem value="TENANT_OWNER">Proprietário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content based on mode */}
            {createUserMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newUserName">Nome *</Label>
                  <Input
                    id="newUserName"
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nome do usuário"
                    value={newUserName}
                  />
                </div>
                <div>
                  <Label htmlFor="newUserEmail">Email *</Label>
                  <Input
                    id="newUserEmail"
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="usuario@exemplo.com"
                    type="email"
                    value={newUserEmail}
                  />
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-blue-700 text-sm dark:text-blue-300">
                      O usuário receberá um email com um link para criar sua
                      própria senha e ativar a conta.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email do Usuário *</Label>
                  <Input
                    id="email"
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    placeholder="usuario@exemplo.com"
                    type="email"
                    value={selectedEmail}
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Digite o email do usuário que deseja convidar. O usuário
                    deve já estar cadastrado no sistema.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CredenzaBody>
        <CredenzaFooter>
          <Button onClick={handleClose} variant="outline">
            Cancelar
          </Button>
          {createUserMode ? (
            <Button
              disabled={
                createUserMutation.isPending || !newUserName || !newUserEmail
              }
              onClick={handleCreateUser}
            >
              {createUserMutation.isPending
                ? "Criando..."
                : "Criar e Enviar Convite"}
            </Button>
          ) : (
            <Button
              disabled={inviteUserMutation.isPending || !selectedEmail}
              onClick={handleInviteUser}
            >
              {inviteUserMutation.isPending ? "Enviando..." : "Convidar"}
            </Button>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
