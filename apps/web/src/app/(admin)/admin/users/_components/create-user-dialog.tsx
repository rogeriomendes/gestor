"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("SUPER_ADMIN");

  const createUserMutation = useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      password: string;
      role: Role;
    }) => trpcClient.admin.createUser.mutate(input),
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

    if (!password) {
      toast.error("Por favor, insira a senha");
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      toast.success("Usuário criado com sucesso!");
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
    setPassword("");
    setConfirmPassword("");
    setRole("SUPER_ADMIN");
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário com permissões de administrador
          </DialogDescription>
        </DialogHeader>

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

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              type="password"
              value={password}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              type="password"
              value={confirmPassword}
            />
          </div>
        </div>

        <DialogFooter>
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
              "Criar Usuário"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
