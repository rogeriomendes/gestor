"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Mail } from "lucide-react";
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
import { getRoleLabel, type Role } from "@/lib/role-labels";
import { trpcClient } from "@/utils/trpc";

interface CreateUserDialogProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("SUPER_ADMIN");

  const createUserMutation = useMutation({
    mutationFn: (input: { name: string; email: string; role: Role }) =>
      trpcClient.admin.createUser.mutate(input),
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Por favor, insira o nome do usuário");
      return;
    }

    if (!email.trim()) {
      toast.error("Por favor, insira o email do usuário");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        role,
      });

      toast.success(
        "Usuário criado com sucesso! Um email foi enviado para que ele ative sua conta."
      );
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar usuário"
      );
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setRole("SUPER_ADMIN");
    onOpenChange(false);
  };

  return (
    <Credenza onOpenChange={onOpenChange} open={open}>
      <CredenzaContent className="max-w-md">
        <CredenzaHeader>
          <CredenzaTitle>Criar Usuário</CredenzaTitle>
          <CredenzaDescription>
            O usuário receberá um email para ativar sua conta e criar uma senha.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                onValueChange={(value) => setRole(value as Role)}
                value={role}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">
                    {getRoleLabel("SUPER_ADMIN")}
                  </SelectItem>
                  <SelectItem value="TENANT_ADMIN">
                    {getRoleLabel("TENANT_ADMIN")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-blue-700 text-sm dark:text-blue-300">
                  O usuário receberá um email com um link para criar sua própria
                  senha e ativar a conta.
                </p>
              </div>
            </div>
          </div>
        </CredenzaBody>

        <CredenzaFooter>
          <Button onClick={handleClose} variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={createUserMutation.isPending}
            onClick={handleCreate}
          >
            {createUserMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar e Enviar Convite"
            )}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
