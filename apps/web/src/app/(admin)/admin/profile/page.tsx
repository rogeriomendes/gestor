"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Camera, Mail, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layouts/page-layout";
import { SecuritySettings } from "@/components/profile/security-settings";
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
      const result = await authClient.updateUser({
        name: name.trim(),
      });

      if (result.error) {
        toast.error(result.error.message || "Erro ao atualizar nome");
        return;
      }

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

                {/* Informações da Conta */}
                {user?.createdAt && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-sm">
                      Conta criada em
                    </Label>
                    <p className="text-sm">
                      {format(
                        new Date(user.createdAt),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Segurança */}
        <SecuritySettings />
      </div>
    </PageLayout>
  );
}
