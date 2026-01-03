import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

interface RoleBadgeProps {
  role: Role | null;
  className?: string;
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  TENANT_ADMIN: {
    label: "Admin de Cliente",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  TENANT_OWNER: {
    label: "Proprietário",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  TENANT_USER_MANAGER: {
    label: "Gerente de Usuários",
    className:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  TENANT_USER: {
    label: "Usuário",
    className:
      "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) {
    return null;
  }

  const config = roleConfig[role];

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}
