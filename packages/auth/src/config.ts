/**
 * Configuração centralizada do Better Auth
 */
export const authConfig = {
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // 1 dia
    freshAge: 60 * 60, // 1 hora para operações sensíveis
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutos
      strategy: "compact" as const, // Menor tamanho, melhor performance
    },
  },
  rateLimit: {
    enabled: true,
    window: 10, // 10 segundos
    max: 100, // 100 requisições por janela
    customRules: {
      "/api/auth/sign-in/email": {
        window: 60, // 1 minuto
        max: 5, // Apenas 5 tentativas de login por minuto
      },
      "/api/auth/sign-up/email": {
        window: 60, // 1 minuto
        max: 3, // Apenas 3 registros por minuto
      },
      "/api/auth/reset-password": {
        window: 300, // 5 minutos
        max: 3, // Apenas 3 tentativas de reset por 5 minutos
      },
    },
    storage: "memory" as const, // Usar memória (padrão). Para usar banco, adicione o modelo rateLimit ao schema do Prisma
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    },
    cookies: {
      session_token: {
        name: "better-auth.session_token",
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
        },
      },
    },
    ipAddress: {
      ipAddressHeaders: [
        "cf-connecting-ip", // Cloudflare
        "x-forwarded-for", // Padrão
        "x-real-ip", // Nginx
      ],
      disableIpTracking: false,
    },
  },
  logger: {
    disabled: process.env.NODE_ENV === "test",
    level: (process.env.NODE_ENV === "production" ? "error" : "info") as
      | "info"
      | "warn"
      | "error"
      | "debug",
    log: (
      level: "info" | "warn" | "error" | "debug",
      message: string,
      ...args: unknown[]
    ) => {
      if (level === "error") {
        console.error(`[Better Auth] ${message}`, ...args);
        // Aqui você pode integrar com seu sistema de monitoramento (Sentry, etc.)
      } else if (level === "warn") {
        console.warn(`[Better Auth] ${message}`, ...args);
      } else {
        console.log(`[Better Auth] ${message}`, ...args);
      }
    },
  },
};

/**
 * Valida configuração do Better Auth
 * Pula validação durante build do Next.js
 */
export function validateAuthConfig() {
  // Pular validação durante build do Next.js
  // NEXT_PHASE é definido pelo Next.js durante o build
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build"
  ) {
    return;
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET não está definido. Configure a variável de ambiente."
    );
  }

  if (process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET deve ter pelo menos 32 caracteres para segurança."
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.BETTER_AUTH_SECRET === "better-auth-secret-123456789"
  ) {
    throw new Error(
      "BETTER_AUTH_SECRET não pode usar o valor padrão em produção!"
    );
  }
}
