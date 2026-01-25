"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccessDeniedCardProps {
  title?: string;
  description?: string;
}

export function AccessDeniedCard({
  title = "Acesso Negado",
  description = "Você não tem permissão para acessar este recurso.",
}: AccessDeniedCardProps) {
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
