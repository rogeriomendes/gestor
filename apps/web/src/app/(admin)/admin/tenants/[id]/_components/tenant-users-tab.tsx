"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddUserDialog } from "./add-user-dialog";
import { UserListItem } from "./user-list-item";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AvailableUser = {
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

type TenantUsersTabProps = {
  tenantId: string;
  users: User[];
  isLoading: boolean;
  availableUsers: AvailableUser[];
  availableUsersLoading: boolean;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
  onRefresh: () => void;
};

export function TenantUsersTab({
  tenantId,
  users,
  isLoading,
  availableUsers,
  availableUsersLoading,
  onUpdateRole,
  onRemove,
  onRefresh,
}: TenantUsersTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Gerencie os usuários associados a este tenant
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="mr-2 size-4" /> Adicionar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">
              Carregando usuários...
            </p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum usuário encontrado para este tenant
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <UserListItem
                  email={user.email}
                  key={user.id}
                  name={user.name}
                  onRemove={onRemove}
                  onUpdateRole={onUpdateRole}
                  role={user.role}
                  userId={user.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserDialog
        availableUsers={availableUsers}
        isLoading={availableUsersLoading}
        onOpenChange={setIsDialogOpen}
        onSuccess={onRefresh}
        open={isDialogOpen}
        tenantId={tenantId}
      />
    </div>
  );
}
