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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { EditUserDialog } from "../../../users/_components/edit-user-dialog";
import { AddUserDialog } from "./add-user-dialog";
import { UserListItem } from "./user-list-item";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AvailableUser {
  id: string;
  user: {
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
  } | null;
}

interface TenantUsersTabProps {
  tenantId: string;
  users: User[];
  isLoading: boolean;
  availableUsers: AvailableUser[];
  availableUsersLoading: boolean;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
  onRefresh: () => void;
}

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
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const handleEdit = (userId: string, name: string, email: string) => {
    setEditingUser({ id: userId, name, email });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Gerencie os usuários associados a este cliente
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="mr-2 size-4" /> Adicionar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => `skeleton-user-${i}`).map(
                (key) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={key}
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                )
              )}
            </div>
          )}
          {!isLoading && users.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserPlus className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>
                  Nenhum usuário encontrado para este cliente
                </EmptyTitle>
                <EmptyDescription>
                  Nenhum usuário foi associado a este cliente ainda. Adicione
                  usuários para começar.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <UserListItem
                  email={user.email}
                  key={user.id}
                  name={user.name}
                  onEdit={handleEdit}
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

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
          onSuccess={() => {
            onRefresh();
            setEditingUser(null);
          }}
          open={!!editingUser}
          userEmail={editingUser.email}
          userId={editingUser.id}
          userName={editingUser.name}
        />
      )}
    </div>
  );
}
