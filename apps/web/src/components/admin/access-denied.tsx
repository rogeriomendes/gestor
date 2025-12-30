"use client";

export function AccessDenied() {
  return (
    <div className="container mx-auto max-w-7xl p-6 text-center">
      <h1 className="mb-4 font-bold text-2xl">Acesso Negado</h1>
      <p className="text-muted-foreground">
        Você não tem permissão para visualizar esta página.
      </p>
    </div>
  );
}
