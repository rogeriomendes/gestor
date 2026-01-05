"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoleLabel, type Role } from "@/lib/role-labels";
import { trpc, trpcClient } from "@/utils/trpc";

interface UserTenantSectionProps {
  userId: string;
  currentTenantId: string | null;
  currentRole: string | null;
  onSuccess: () => void;
}

export function UserTenantSection({
  userId,
  currentTenantId,
  currentRole,
  onSuccess,
}: UserTenantSectionProps) {
  // Inicializar com os valores atuais ou padrões
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return currentTenantId || "none";
  });
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    return currentRole || "TENANT_USER";
  });

  // Atualizar estado quando props mudarem (quando dados do usuário forem carregados)
  useEffect(() => {
    if (currentTenantId !== undefined) {
      setSelectedTenantId(currentTenantId || "none");
    }
    if (currentRole !== undefined) {
      setSelectedRole(currentRole || "TENANT_USER");
    }
  }, [currentTenantId, currentRole]);

  // Buscar tenants disponíveis
  const { data: tenantsData } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  const tenants = tenantsData?.data || [];

  const tenantOptions: ComboboxOption[] = [
    { value: "none", label: "Sem cliente" },
    ...tenants.map((tenant) => ({
      value: tenant.id,
      label: tenant.name,
    })),
  ];

  const addUserToTenantMutation = useMutation({
    mutationFn: (input: {
      tenantId: string;
      userId: string;
      role: "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";
    }) => trpcClient.admin.addUserToTenant.mutate(input),
  });

  const removeUserFromTenantMutation = useMutation({
    mutationFn: (input: { tenantId: string; userId: string }) =>
      trpcClient.admin.removeUserFromTenant.mutate(input),
  });

  const handleSaveTenant = async () => {
    try {
      // Se estava sem tenant e agora tem
      if (!currentTenantId && selectedTenantId !== "none") {
        await addUserToTenantMutation.mutateAsync({
          tenantId: selectedTenantId,
          userId,
          role: selectedRole as
            | "TENANT_OWNER"
            | "TENANT_USER_MANAGER"
            | "TENANT_USER",
        });
        toast.success("Usuário adicionado ao cliente com sucesso!");
        onSuccess();
        return;
      }

      // Se tinha tenant e agora não tem
      if (currentTenantId && selectedTenantId === "none") {
        await removeUserFromTenantMutation.mutateAsync({
          tenantId: currentTenantId,
          userId,
        });
        toast.success("Usuário removido do cliente com sucesso!");
        onSuccess();
        return;
      }

      // Se mudou de tenant
      if (
        currentTenantId &&
        selectedTenantId !== "none" &&
        selectedTenantId !== currentTenantId
      ) {
        // Primeiro remover do tenant atual
        await removeUserFromTenantMutation.mutateAsync({
          tenantId: currentTenantId,
          userId,
        });
        // Depois adicionar ao novo tenant
        await addUserToTenantMutation.mutateAsync({
          tenantId: selectedTenantId,
          userId,
          role: selectedRole as
            | "TENANT_OWNER"
            | "TENANT_USER_MANAGER"
            | "TENANT_USER",
        });
        toast.success("Usuário movido para outro cliente com sucesso!");
        onSuccess();
        return;
      }

      // Se mudou apenas o role no mesmo tenant
      if (
        currentTenantId &&
        selectedTenantId === currentTenantId &&
        selectedRole !== currentRole
      ) {
        await trpcClient.admin.updateUserRoleInTenant.mutate({
          tenantId: currentTenantId,
          userId,
          role: selectedRole as
            | "TENANT_OWNER"
            | "TENANT_USER_MANAGER"
            | "TENANT_USER",
        });
        toast.success("Função do usuário atualizada com sucesso!");
        onSuccess();
        return;
      }

      toast.info("Nenhuma alteração foi feita");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar associação do usuário"
      );
    }
  };

  const hasChanges =
    selectedTenantId !== (currentTenantId || "none") ||
    (currentTenantId && selectedRole !== currentRole);

  const isLoading =
    addUserToTenantMutation.isPending || removeUserFromTenantMutation.isPending;

  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-medium text-sm">Cliente</h3>
        <p className="mb-4 text-muted-foreground text-xs">
          Associe o usuário a um cliente ou remova a associação
        </p>

        <div className="space-y-3">
          <div className="w-full">
            <Combobox
              emptyMessage="Nenhum cliente encontrado."
              onValueChange={setSelectedTenantId}
              options={tenantOptions}
              placeholder="Selecione um cliente"
              searchPlaceholder="Buscar cliente..."
              value={selectedTenantId}
            />
          </div>

          {selectedTenantId !== "none" && (
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground text-sm">
                Função no Cliente
              </Label>
              <Select
                onValueChange={(value) => setSelectedRole(value as Role)}
                value={selectedRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TENANT_OWNER">
                    {getRoleLabel("TENANT_OWNER")}
                  </SelectItem>
                  <SelectItem value="TENANT_USER_MANAGER">
                    {getRoleLabel("TENANT_USER_MANAGER")}
                  </SelectItem>
                  <SelectItem value="TENANT_USER">
                    {getRoleLabel("TENANT_USER")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {currentTenant && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Cliente atual:
              </span>
              <Badge variant="secondary">{currentTenant.name}</Badge>
              {currentRole && (
                <>
                  <span className="text-muted-foreground text-sm">•</span>
                  <Badge variant="outline">{getRoleLabel(currentRole)}</Badge>
                </>
              )}
            </div>
          )}

          {hasChanges && (
            <Button
              disabled={isLoading}
              onClick={handleSaveTenant}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações do Cliente"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
