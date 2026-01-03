"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin de Cliente",
  TENANT_OWNER: "Proprietário",
  TENANT_USER_MANAGER: "Gerente de Usuários",
  TENANT_USER: "Usuário",
};

type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

interface RoleListProps {
  selectedRole: Role | null;
  onRoleSelect: (role: Role) => void;
}

export function RoleList({ selectedRole, onRoleSelect }: RoleListProps) {
  const roles: Role[] = [
    "TENANT_ADMIN",
    "TENANT_OWNER",
    "TENANT_USER_MANAGER",
    "TENANT_USER",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>Selecione uma role</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {roles.map((role) => (
          <button
            className={`w-full rounded-md border p-3 text-left transition-colors ${
              selectedRole === role
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
            key={role}
            onClick={() => onRoleSelect(role)}
            type="button"
          >
            <div className="font-medium">{ROLE_LABELS[role]}</div>
            <div className="text-muted-foreground text-xs">{role}</div>
          </button>
        ))}
        <div className="rounded-md border border-dashed p-3">
          <div className="font-medium text-muted-foreground">
            {ROLE_LABELS.SUPER_ADMIN}
          </div>
          <div className="text-muted-foreground text-xs">
            Tem todas as permissões
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
