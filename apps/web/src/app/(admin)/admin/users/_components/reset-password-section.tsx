"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResetPasswordSectionProps {
  confirmPassword: string;
  newPassword: string;
  onConfirmPasswordChange: (password: string) => void;
  onNewPasswordChange: (password: string) => void;
  onTogglePasswordFields: () => void;
  showPasswordFields: boolean;
}

export function ResetPasswordSection({
  newPassword,
  confirmPassword,
  showPasswordFields,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onTogglePasswordFields,
}: ResetPasswordSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Resetar Senha</h3>
          <p className="text-muted-foreground text-sm">
            Defina uma nova senha para este usuário
          </p>
        </div>
        <Button onClick={onTogglePasswordFields} size="sm" variant="outline">
          {showPasswordFields ? "Cancelar" : "Resetar Senha"}
        </Button>
      </div>

      {showPasswordFields && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              onChange={(e) => onNewPasswordChange(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              type="password"
              value={newPassword}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder="Digite a senha novamente"
              type="password"
              value={confirmPassword}
            />
          </div>
        </div>
      )}
    </div>
  );
}
