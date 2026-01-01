"use client";

import { Edit, MoreHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { RoleBadge } from "@/components/role-badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListSkeleton } from "@/components/ui/list-skeleton";

interface User {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  role: string | null;
  tenant: {
    id: string;
    name: string;
  } | null;
}

interface UsersListProps {
  users: User[];
  isLoading: boolean;
  pagination:
    | {
        page: number;
        totalPages: number;
        total: number;
      }
    | undefined;
  selectedRole: string;
  onPageChange: (page: number) => void;
  onEdit: (userId: string, userName: string, userEmail: string) => void;
}

export function UsersList({
  users,
  isLoading,
  pagination,
  selectedRole,
  onPageChange,
  onEdit,
}: UsersListProps) {
  const filteredUsers = users.filter((user) => {
    if (!user?.user) {
      return false;
    }
    if (selectedRole === "all") {
      return true;
    }
    return user.role === selectedRole;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination?.total || 0} usuário{pagination?.total !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListSkeleton count={5} itemHeight="h-20" />
        </CardContent>
      </Card>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination?.total || 0} usuário{pagination?.total !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
              <EmptyDescription>
                {(() => {
                  const hasFilters = selectedRole !== "all";
                  return hasFilters
                    ? "Tente ajustar os filtros para encontrar usuários."
                    : "Ainda não há usuários cadastrados no sistema.";
                })()}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {pagination?.total || 0} usuário{pagination?.total !== 1 ? "s" : ""}
        </CardTitle>
        <CardDescription>
          Lista de todos os usuários cadastrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers
            .filter((user) => user?.user)
            .map((user) => {
              if (!user?.user) {
                return null;
              }
              return (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={user.id}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.user.name}</p>
                        {user.role && (
                          <RoleBadge
                            role={
                              user.role as
                                | "SUPER_ADMIN"
                                | "TENANT_ADMIN"
                                | "TENANT_OWNER"
                                | "TENANT_USER_MANAGER"
                                | "TENANT_USER"
                                | null
                            }
                          />
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {user.user.email}
                      </p>
                      {user.tenant && (
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className="text-xs" variant="outline">
                            {user.tenant.name}
                          </Badge>
                          <Link
                            className="text-muted-foreground text-xs underline hover:text-primary"
                            href={`/admin/tenants/${user.tenant.id}`}
                          >
                            Ver tenant
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground text-xs">
                      {new Date(user.user.createdAt).toLocaleDateString(
                        "pt-BR"
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button className="h-8 w-8 p-0" variant="ghost" />
                        }
                      >
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            onEdit(
                              user.user.id,
                              user.user.name,
                              user.user.email
                            )
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
            .filter(Boolean)}

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-muted-foreground text-sm">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={pagination.page === 1}
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    onPageChange(
                      Math.min(pagination.totalPages, pagination.page + 1)
                    )
                  }
                  variant="outline"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
