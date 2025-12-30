"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { useTenant } from "@/contexts/tenant-context";
import { authClient } from "@/lib/auth-client";
import { getRedirectPath } from "@/lib/auth-redirect";

export default function LoginPage() {
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(true);
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { role, isLoading: tenantLoading } = useTenant();

  // Se já está autenticado, redirecionar
  useEffect(() => {
    if (session?.user && role && !sessionLoading && !tenantLoading) {
      const redirectPath = getRedirectPath(role);
      if (redirectPath === "/admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, role, sessionLoading, tenantLoading, router]);

  // Mostrar loader enquanto verifica autenticação
  if (sessionLoading || tenantLoading) {
    return <Loader />;
  }

  // Se já está autenticado, não mostrar nada (será redirecionado)
  if (session?.user) {
    return null;
  }

  // return showSignIn ? (
  //   <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  // ) : (
  //   <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  // );

  return (
    <>
      <SignInForm /> <SignUpForm />
    </>
  );
}
