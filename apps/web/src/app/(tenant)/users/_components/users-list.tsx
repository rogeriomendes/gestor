"use client";

import { UserPlus } from "lucide-react";
import { TenantUsersSkeleton } from "@/components/tenant-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { UserListItem } from "./user-list-item";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

type TenantUser = {
  id: string;
  userId: string;
  role: Role;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type UsersListProps = {
  users: TenantUser[];
  isLoading: boolean;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
};

export function UsersList({
  users,
  isLoading,
  onUpdateRole,
  onRemove,
}: UsersListProps) {
  if (isLoading) {
    return <TenantUsersSkeleton />;
  }

  if (users.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserPlus className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
          <EmptyDescription>
            Convide usuários para começar a trabalhar em equipe.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Usuários</CardTitle>
        <CardDescription>
          {users.length} usuário(s) encontrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((tenantUser) => (
          <UserListItem
            email={tenantUser.user.email}
            key={tenantUser.id}
            name={tenantUser.user.name}
            onRemove={onRemove}
            onUpdateRole={onUpdateRole}
            role={tenantUser.role}
            userId={tenantUser.userId}
          />
        ))}
      </CardContent>
    </Card>
  );
}
