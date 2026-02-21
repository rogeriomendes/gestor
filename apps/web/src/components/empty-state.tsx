import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message?: string;
}

export function EmptyState({
  message = "Nenhum item encontrado",
  icon,
}: EmptyStateProps) {
  return (
    <div className="my-10 flex flex-col items-center justify-center gap-4 text-muted-foreground text-sm md:text-base">
      {icon}
      {message}
    </div>
  );
}
