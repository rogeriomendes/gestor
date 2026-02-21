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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpcClient } from "@/utils/trpc";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface User {
  id: string;
  tenant?: {
    id: string;
    name: string;
  } | null;
  user: {
    name: string;
    email: string;
  };
}

interface AddUserDialogProps {
  availableUsers: User[];
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
  tenantId: string;
}

export function AddUserDialog({
  open,
  onOpenChange,
  tenantId,
  availableUsers,
  isLoading,
  onSuccess,
}: AddUserDialogProps) {
  const [createUserMode, setCreateUserMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("TENANT_USER");
  const [searchUser, setSearchUser] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const addUserMutation = useMutation({
    mutationFn: (input: { tenantId: string; userId: string; role: Role }) =>
      trpcClient.admin.addUserToTenant.mutate(input),
  });

  const createUserMutation = useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      tenantId: string;
      role: Role;
    }) => trpcClient.admin.createUser.mutate(input),
  });

  const handleAddUser = async () => {
    if (!selectedUser) {
      toast.error("Por favor, selecione um usuário");
      return;
    }

    try {
      await addUserMutation.mutateAsync({
        tenantId,
        userId: selectedUser,
        role: selectedRole,
      });
      toast.success("Usuário adicionado ao cliente com sucesso!");
      onSuccess();
      onOpenChange(false);
      setSelectedUser(null);
      setSearchUser("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao adicionar usuário"
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
      setSelectedUser(null);
      setSearchUser("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao adicionar usuário"
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedUser(null);
    setSearchUser("");
    setCreateUserMode(false);
    setNewUserName("");
    setNewUserEmail("");
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Adicionar Usuário ao Cliente</CredenzaTitle>
          <CredenzaDescription>
            {createUserMode
              ? "O usuário receberá um email para ativar sua conta"
              : "Selecione um usuário existente ou crie um novo"}
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
                    setSelectedUser(null);
                  }}
                  type="button"
                >
                  Selecionar Existente
                </button>
                <button
                  className={`border-b-2 px-1 py-2 font-medium text-sm ${
                    createUserMode
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => {
                    setCreateUserMode(true);
                    setSelectedUser(null);
                  }}
                  type="button"
                >
                  Criar Novo
                </button>
              </nav>
            </div>

            {/* Role Selection */}
            <Field>
              <FieldLabel>Função</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) => setSelectedRole(value as Role)}
                  value={selectedRole}
                >
                  <SelectTrigger>
                    <SelectValue>Selecione a função</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT_USER">
                      Usuário do Cliente
                    </SelectItem>
                    <SelectItem value="TENANT_USER_MANAGER">
                      Gerente de Usuários do Cliente
                    </SelectItem>
                    <SelectItem value="TENANT_OWNER">
                      Proprietário do Cliente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            {/* Content based on mode */}
            {createUserMode ? (
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="newUserName">Nome *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="newUserName"
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Nome do usuário"
                      value={newUserName}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="newUserEmail">Email *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="newUserEmail"
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="usuario@exemplo.com"
                      type="email"
                      value={newUserEmail}
                    />
                  </FieldContent>
                </Field>
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
                <Field>
                  <FieldLabel>Buscar Usuário</FieldLabel>
                  <FieldContent>
                    <Input
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="Buscar por nome ou email..."
                      value={searchUser}
                    />
                  </FieldContent>
                </Field>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {isLoading && (
                    <p className="text-muted-foreground text-sm">
                      Carregando usuários...
                    </p>
                  )}
                  {!isLoading && filteredUsers.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Nenhum usuário disponível encontrado
                    </p>
                  )}
                  {!isLoading &&
                    filteredUsers.length > 0 &&
                    filteredUsers.map((user) => (
                      <button
                        className={`flex w-full cursor-pointer items-center justify-between rounded border p-2 text-left ${
                          selectedUser === user.id
                            ? "border-primary bg-primary/10"
                            : "border-input"
                        }`}
                        key={user.id}
                        onClick={() => setSelectedUser(user.id)}
                        type="button"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {user.user.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {user.user.email}
                          </p>
                        </div>
                        {user.tenant && (
                          <span className="text-muted-foreground text-xs">
                            {user.tenant.name}
                          </span>
                        )}
                      </button>
                    ))}
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
              disabled={addUserMutation.isPending || !selectedUser}
              onClick={handleAddUser}
            >
              {addUserMutation.isPending
                ? "Adicionando..."
                : "Adicionar Usuário"}
            </Button>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
