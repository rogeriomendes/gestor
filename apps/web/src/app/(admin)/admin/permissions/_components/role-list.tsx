"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRoleLabel, type Role, TENANT_ROLES } from "@/lib/role-labels";

interface RoleListProps {
  onRoleSelect: (role: Role) => void;
  selectedRole: Role | null;
}

export function RoleList({ selectedRole, onRoleSelect }: RoleListProps) {
  const roles = TENANT_ROLES;

  return (
    <Card size="sm">
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
            <div className="font-medium">{getRoleLabel(role)}</div>
            <div className="text-muted-foreground text-xs">{role}</div>
          </button>
        ))}
        <div className="rounded-md border border-dashed p-3">
          <div className="font-medium text-muted-foreground">
            {getRoleLabel("SUPER_ADMIN")}
          </div>
          <div className="text-muted-foreground text-xs">
            Tem todas as permissões
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
