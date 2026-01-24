"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layouts/page-layout";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { SecuritySettings } from "@/components/profile/security-settings";
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
      <div className="flex flex-col gap-6 lg:flex-row">
        <ProfileSidebar />
        <div className="flex-1 space-y-6">
          {/* Card de Perfil */}
          <Card id="personal-info">
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
              <div className="space-y-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label className="font-medium text-muted-foreground text-sm">
                    Nome
                  </Label>
                  {isEditingName ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        className="max-w-md"
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
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-semibold text-lg">{user?.name}</p>
                      </div>
                      <Button
                        onClick={() => setIsEditingName(true)}
                        size="sm"
                        variant="outline"
                      >
                        Editar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Grid de Informações */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Email */}
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                    <Label className="font-medium text-muted-foreground text-sm">
                      Email
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  {userRole && (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                      <Label className="font-medium text-muted-foreground text-sm">
                        Função
                      </Label>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Badge className="font-medium" variant="secondary">
                          {ROLE_LABELS[userRole] || userRole}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Informações da Conta */}
                  {user?.createdAt && (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                      <Label className="font-medium text-muted-foreground text-sm">
                        Conta criada em
                      </Label>
                      <p className="font-medium text-sm">
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
      </div>
    </PageLayout>
  );
}
