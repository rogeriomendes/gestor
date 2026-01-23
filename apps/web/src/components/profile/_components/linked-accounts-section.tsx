"use client";

import { useQuery } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LinkedAccountsSection() {
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  const { data: accounts, refetch } = useQuery({
    queryKey: ["linked-accounts"],
    queryFn: async () => {
      const result = await authClient.listAccounts();
      return result.data || [];
    },
  });

  const googleAccount = accounts?.find(
    (account) => account.providerId === "google"
  );

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: window.location.href,
      });

      if (result?.error) {
        const errorMessage = result.error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("cancel") ||
          errorMessage.includes("closed") ||
          errorMessage.includes("popup")
        ) {
          return;
        }
        throw new Error(
          result.error.message || "Erro ao vincular conta Google"
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message?.toLowerCase() || "";
        if (
          errorMessage.includes("cancel") ||
          errorMessage.includes("closed") ||
          errorMessage.includes("popup")
        ) {
          return;
        }
        toast.error(error.message);
      } else {
        toast.error("Erro ao vincular conta Google");
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      if (!googleAccount) {
        return;
      }
      const result = await authClient.unlinkAccount({
        providerId: "google",
        accountId: googleAccount.id,
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Erro ao desvincular conta Google"
        );
      }

      toast.success("Conta Google desvinculada!");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao desvincular conta Google"
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Contas Vinculadas
        </CardTitle>
        <CardDescription>
          Vincule outras contas para fazer login mais facilmente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <GoogleIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-muted-foreground text-sm">
                  {googleAccount
                    ? "Conta vinculada"
                    : "Faça login com sua conta Google"}
                </p>
              </div>
            </div>
            {googleAccount ? (
              <Button onClick={handleUnlinkGoogle} variant="outline">
                Desvincular
              </Button>
            ) : (
              <Button
                disabled={isLinkingGoogle}
                onClick={handleLinkGoogle}
                variant="outline"
              >
                {isLinkingGoogle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  "Vincular"
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
