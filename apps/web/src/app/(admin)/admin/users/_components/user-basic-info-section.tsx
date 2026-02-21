"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserBasicInfoSectionProps {
  email: string;
  name: string;
  onNameChange: (name: string) => void;
}

export function UserBasicInfoSection({
  name,
  email,
  onNameChange,
}: UserBasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nome do usuário"
          value={name}
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          disabled
          id="email"
          placeholder="usuario@exemplo.com"
          type="email"
          value={email}
        />
        <p className="mt-1 text-muted-foreground text-xs">
          O email não pode ser alterado
        </p>
      </div>
    </div>
  );
}
