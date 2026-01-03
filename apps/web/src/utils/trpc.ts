import type { AppRouter } from "@gestor/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

// Cache para evitar toasts duplicados da mesma mensagem
const errorToastCache = new Set<string>();
const ERROR_TOAST_TIMEOUT = 5000; // 5 segundos

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Não mostrar toast para erros esperados em páginas públicas
      // ou quando o usuário não está autenticado
      if (
        error.message?.includes("Cliente não encontrado") ||
        error.message?.includes("Usuário deve estar associado a um cliente") ||
        error.message?.includes("Authentication required") ||
        error.message?.includes("UNAUTHORIZED")
      ) {
        return;
      }

      // Evitar toasts duplicados da mesma mensagem
      const errorKey = error.message || "Unknown error";
      if (errorToastCache.has(errorKey)) {
        return;
      }

      // Adicionar ao cache e remover após timeout
      errorToastCache.add(errorKey);
      setTimeout(() => {
        errorToastCache.delete(errorKey);
      }, ERROR_TOAST_TIMEOUT);

      toast.error(error.message, {
        action: {
          label: "Tentar novamente",
          onClick: query.invalidate,
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
