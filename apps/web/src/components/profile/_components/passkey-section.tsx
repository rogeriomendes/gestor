"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Fingerprint, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export function PasskeySection() {
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);

  const {
    data: passkeys,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const result = await authClient.passkey.listUserPasskeys();
      return result.data || [];
    },
  });

  const handleAddPasskey = async () => {
    setIsAddingPasskey(true);
    try {
      const result = await authClient.passkey.addPasskey();
      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        const errorCode =
          "code" in result.error
            ? (result.error.code as string)?.toLowerCase() || ""
            : "";

        if (
          errorMessage.includes("cancel") ||
          errorMessage.includes("abort") ||
          errorMessage.includes("not allowed") ||
          errorCode.includes("notallowed") ||
          errorCode.includes("abort")
        ) {
          return;
        }

        throw new Error(result.error.message || "Erro ao adicionar passkey");
      }
      toast.success("Passkey adicionada com sucesso!");
      refetch();
    } catch (error) {
      if (error instanceof Error) {
        const errorName = error.name?.toLowerCase() || "";
        const errorMessage = error.message?.toLowerCase() || "";

        if (
          errorName === "notallowederror" ||
          errorName === "aborterror" ||
          errorMessage.includes("cancel") ||
          errorMessage.includes("abort") ||
          errorMessage.includes("not allowed") ||
          errorMessage.includes("user refused") ||
          errorMessage.includes("operation either timed out or was not allowed")
        ) {
          return;
        }

        toast.error(error.message);
      } else {
        toast.error("Erro ao adicionar passkey");
      }
    } finally {
      setIsAddingPasskey(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    try {
      const result = await authClient.passkey.deletePasskey({ id: passkeyId });
      if (result.error) {
        throw new Error(result.error.message || "Erro ao remover passkey");
      }
      toast.success("Passkey removida com sucesso!");
      refetch();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao remover passkey");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Use biometria ou chave de segurança para fazer login sem senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : passkeys && passkeys.length > 0 ? (
            <div className="space-y-2">
              {passkeys.map((passkey) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3"
                  key={passkey.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{passkey.name || "Passkey"}</p>
                      <p className="text-muted-foreground text-xs">
                        {passkey.deviceType === "singleDevice"
                          ? "Dispositivo único"
                          : "Multi-dispositivo"}
                        {passkey.createdAt &&
                          ` • Criada em ${format(new Date(passkey.createdAt), "dd/MM/yyyy", { locale: ptBR })}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeletePasskey(passkey.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Fingerprint className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground text-sm">
                Nenhuma passkey cadastrada
              </p>
            </div>
          )}

          <Button
            className="w-full"
            disabled={isAddingPasskey}
            onClick={handleAddPasskey}
            variant="outline"
          >
            {isAddingPasskey ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Passkey
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
