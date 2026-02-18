import { useTenant } from "@/contexts/tenant-context";
import { authClient } from "@/lib/auth-client";
import { getRedirectPath } from "@/lib/auth-redirect";
import { useForm } from "@tanstack/react-form";
import { Fingerprint, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Ícone do Google
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

export default function SignInForm() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { role, isLoading: tenantLoading } = useTenant();
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [isSigningInWithPasskey, setIsSigningInWithPasskey] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirecionar após login bem-sucedido
  useEffect(() => {
    if (session?.user && role && !tenantLoading) {
      const redirectPath = getRedirectPath(role);
      router.push(redirectPath as never);
    }
  }, [session, role, tenantLoading, router]);

  // Login com Google
  const handleGoogleSignIn = async () => {
    setIsSigningInWithGoogle(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao fazer login com Google"
      );
      setIsSigningInWithGoogle(false);
    }
  };

  // Login com Passkey
  const handlePasskeySignIn = async () => {
    setIsSigningInWithPasskey(true);
    try {
      const result = await authClient.signIn.passkey();

      if (result?.error) {
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

        toast.error(result.error.message || "Erro ao fazer login com passkey");
        return;
      }

      toast.success("Login realizado com sucesso!");
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
        toast.error("Erro ao fazer login com passkey");
      }
    } finally {
      setIsSigningInWithPasskey(false);
    }
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        // O redirecionamento para 2FA é feito automaticamente pelo onTwoFactorRedirect
        // configurado no auth-client.ts
        await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess(context) {
              if (!context.data.twoFactorRedirect) {
                toast.success("Login realizado com sucesso");
              }
            },
            onError(context) {
              const raw =
                context.error.message ||
                "Email ou senha incorretos. Tente novamente.";
              const msg =
                raw.toLowerCase().includes("invalid email or password") ||
                raw.toLowerCase().includes("invalid credentials")
                  ? "Email ou senha incorretos. Tente novamente."
                  : raw;
              setSubmitError(msg);
            },
          }
        );
      } catch (error) {
        const raw =
          error instanceof Error
            ? error.message
            : "Email ou senha incorretos. Tente novamente.";
        const msg =
          raw.toLowerCase().includes("invalid email or password") ||
          raw.toLowerCase().includes("invalid credentials")
            ? "Email ou senha incorretos. Tente novamente."
            : raw;
        setSubmitError(msg);
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Endereço de email inválido"),
        password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      }),
    },
  });

  if (sessionPending || tenantLoading) {
    return <Loader />;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-3 text-center font-bold text-3xl">
        Bem-vindo de volta
      </h1>
      <p className="mb-6 text-center text-muted-foreground text-sm">
        Entre com sua conta para continuar
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  aria-invalid={!!submitError}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  placeholder="seu@email.com"
                  type="email"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Senha</Label>
                  <Link
                    className="text-muted-foreground text-sm hover:text-primary hover:underline"
                    href="/forgot-password"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  aria-invalid={!!submitError}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  placeholder="••••••••"
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
                {submitError && (
                  <p className="text-destructive text-sm" role="alert">
                    {submitError}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
              type="submit"
            >
              {state.isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      {/* Separador */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      {/* Botões de login alternativo */}
      <div className="grid grid-cols-2 gap-3">
        {/* Login com Google */}
        <Button
          className="w-auto"
          disabled={isSigningInWithGoogle}
          onClick={handleGoogleSignIn}
          variant="outline"
        >
          {isSigningInWithGoogle ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Entrar com Google
        </Button>
        {/* Login com Passkey */}
        <Button
          className="w-auto"
          disabled={isSigningInWithPasskey}
          onClick={handlePasskeySignIn}
          variant="outline"
        >
          {isSigningInWithPasskey ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Fingerprint className="mr-2 h-4 w-4" />
          )}
          Entrar com Passkey
        </Button>
      </div>
    </div>
  );
}
