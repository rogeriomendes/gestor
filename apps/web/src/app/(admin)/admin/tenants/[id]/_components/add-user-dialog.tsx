"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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

type User = {
  id: string;
  user: {
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
  } | null;
};

type AddUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  availableUsers: User[];
  isLoading: boolean;
  onSuccess: () => void;
};

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
  const [newUserPassword, setNewUserPassword] = useState("");

  const addUserMutation = useMutation({
    mutationFn: (input: { tenantId: string; userId: string; role: Role }) =>
      trpcClient.admin.addUserToTenant.mutate(input),
  });

  const createUserMutation = useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      password: string;
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
      toast.success("Usuário adicionado ao tenant com sucesso!");
      onSuccess();
      onOpenChange(false);
      setSelectedUser(null);
      setSearchUser("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateUser = async () => {
    if (!(newUserName && newUserEmail && newUserPassword)) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        tenantId,
        role: selectedRole,
      });
      toast.success("Usuário criado e adicionado ao tenant com sucesso!");
      onSuccess();
      onOpenChange(false);
      setCreateUserMode(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setSelectedUser(null);
      setSearchUser("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedUser(null);
    setSearchUser("");
    setCreateUserMode(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Usuário ao Tenant</DialogTitle>
          <DialogDescription>
            {createUserMode
              ? "Crie um novo usuário e adicione-o a este tenant"
              : "Selecione um usuário existente ou crie um novo"}
          </DialogDescription>
        </DialogHeader>
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
                  <SelectItem value="TENANT_USER">Usuário</SelectItem>
                  <SelectItem value="TENANT_USER_MANAGER">
                    Gerente de Usuários
                  </SelectItem>
                  <SelectItem value="TENANT_OWNER">Proprietário</SelectItem>
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
              <Field>
                <FieldLabel htmlFor="newUserPassword">Senha *</FieldLabel>
                <FieldContent>
                  <Input
                    id="newUserPassword"
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    type="password"
                    value={newUserPassword}
                  />
                </FieldContent>
              </Field>
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
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">
                    Carregando usuários...
                  </p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhum usuário disponível encontrado
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      className={`flex cursor-pointer items-center justify-between rounded border p-2 ${
                        selectedUser === user.id
                          ? "border-primary bg-primary/10"
                          : "border-input"
                      }`}
                      key={user.id}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{user.user.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {user.user.email}
                        </p>
                      </div>
                      {user.tenant && (
                        <span className="text-muted-foreground text-xs">
                          {user.tenant.name}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Cancelar
          </Button>
          {createUserMode ? (
            <Button
              disabled={
                createUserMutation.isPending ||
                !newUserName ||
                !newUserEmail ||
                !newUserPassword
              }
              onClick={handleCreateUser}
            >
              {createUserMutation.isPending
                ? "Criando..."
                : "Criar e Adicionar Usuário"}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
