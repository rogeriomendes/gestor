import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import { isSubscriptionActive } from "../utils/subscription";

/**
 * Middleware que garante que o tenant tem uma assinatura ativa
 * SUPER_ADMIN é isento desta verificação
 */
export function requireActiveSubscription() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    // SUPER_ADMIN é isento (pode acessar qualquer tenant)
    if (ctx.isSuperAdmin) {
      return next({ ctx });
    }

    // Verificar se tem assinatura
    if (!ctx.subscription) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cliente não possui assinatura ativa",
      });
    }

    // Verificar se está ativa
    if (!isSubscriptionActive(ctx.subscription)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Assinatura expirada ou cancelada",
      });
    }

    return next({ ctx });
  };
}
