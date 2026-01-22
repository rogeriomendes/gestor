"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Camera, KeyRound, Mail, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layouts/page-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Administrador",
  TENANT_ADMIN: "Administrador",
  TENANT_OWNER: "Proprietário",
  TENANT_USER_MANAGER: "Gerente de Usuários",
  TENANT_USER: "Usuário",
};

function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "U";
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminProfilePage() {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  // Estados para edição
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Estados para alteração de senha
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Atualizar nome quando carregar
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error("Nome não pode estar vazio");
      return;
    }

    setIsSavingName(true);
    try {
      await authClient.updateUser({
        name: name.trim(),
      });
      toast.success("Nome atualizado com sucesso!");
      setIsEditingName(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar nome"
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!(currentPassword && newPassword && confirmPassword)) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      toast.success("Senha alterada com sucesso!");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar senha"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isSessionLoading) {
    return (
      <PageLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Meu Perfil" },
        ]}
        subtitle="Gerencie suas informações pessoais"
        title="Meu Perfil"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const user = session?.user;
  const userRole = (user as { role?: string } | undefined)?.role;

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Meu Perfil" },
      ]}
      subtitle="Gerencie suas informações pessoais"
      title="Meu Perfil"
    >
      <div className="space-y-6">
        {/* Card de Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Visualize e edite suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    alt={user?.name || "Avatar"}
                    src={user?.image || undefined}
                  />
                  <AvatarFallback className="text-2xl">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  className="absolute right-0 bottom-0 h-8 w-8 rounded-full p-0"
                  disabled
                  size="sm"
                  title="Em breve"
                  variant="secondary"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {/* Informações */}
              <div className="flex-1 space-y-4">
                {/* Nome */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">Nome</Label>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="max-w-xs"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        value={name}
                      />
                      <Button
                        disabled={isSavingName}
                        onClick={handleUpdateName}
                        size="sm"
                      >
                        {isSavingName ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingName(false);
                          setName(user?.name || "");
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">{user?.name}</p>
                      <Button
                        onClick={() => setIsEditingName(true)}
                        size="sm"
                        variant="ghost"
                      >
                        Editar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{user?.email}</p>
                  </div>
                </div>

                {/* Role */}
                {userRole && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-sm">
                      Função
                    </Label>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">
                        {ROLE_LABELS[userRole] || userRole}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie suas configurações de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Alterar Senha */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Senha</p>
                  <p className="text-muted-foreground text-sm">
                    Altere sua senha de acesso
                  </p>
                </div>
                <Button
                  onClick={() => setPasswordDialogOpen(true)}
                  variant="outline"
                >
                  Alterar senha
                </Button>
              </div>

              {/* Informações da Conta */}
              {user?.createdAt && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 font-medium">Informações da Conta</p>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Conta criada em
                      </span>
                      <span>
                        {format(
                          new Date(user.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Alteração de Senha */}
      <Credenza onOpenChange={setPasswordDialogOpen} open={passwordDialogOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Alterar Senha</CredenzaTitle>
            <CredenzaDescription>
              Digite sua senha atual e a nova senha desejada
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  type="password"
                  value={currentPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  type="password"
                  value={newPassword}
                />
                <p className="text-muted-foreground text-xs">
                  Mínimo de 8 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  type="password"
                  value={confirmPassword}
                />
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button
              onClick={() => setPasswordDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isChangingPassword}
              onClick={handleChangePassword}
            >
              {isChangingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </PageLayout>
  );
}
