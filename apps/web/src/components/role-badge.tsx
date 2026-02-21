import { Badge } from "@/components/ui/badge";
import { ROLE_BADGE_CONFIG, type Role } from "@/lib/role-labels";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  className?: string;
  role: Role | null;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) {
    return null;
  }

  const config = ROLE_BADGE_CONFIG[role];

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}
