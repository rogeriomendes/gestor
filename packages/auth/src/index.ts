import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import prisma from "@gestor/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, twoFactor } from "better-auth/plugins";
import { authConfig, validateAuthConfig } from "./config";
import {
  ac,
  SUPER_ADMIN,
  TENANT_ADMIN,
  TENANT_OWNER,
  TENANT_USER,
  TENANT_USER_MANAGER,
} from "./permissions";

// Validar configuração antes de inicializar
// A validação já pula automaticamente durante build do Next.js
validateAuthConfig();

// Durante build do Next.js, garantir que temos um secret válido
// (mesmo que seja temporário apenas para o build)
const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  (process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build"
    ? "build-time-secret-123456789012345678901234567890"
    : undefined);

if (!authSecret) {
  throw new Error(
    "BETTER_AUTH_SECRET não está definido. Configure a variável de ambiente."
  );
}

export const auth = betterAuth({
  secret: authSecret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    process.env.CORS_ORIGIN || "http://localhost:3001",
    "mybettertapp://",
    "exp://",
  ],
  emailAndPassword: {
    enabled: true,
  },
  // Provedores sociais (OAuth)
  socialProviders: {
    // Google OAuth - requer GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
    ...(process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account",
        },
      }),
  },
  // emailAndPassword: {
  //   enabled: true,
  //   // Configure password hasher to use bcryptjs
  //   password: {
  //     hash: async (password: string) => {
  //       return await bcrypt.hash(password, 12);
  //     },
  //     verify: async ({
  //       password,
  //       hash: storedHash,
  //     }: {
  //       password: string;
  //       hash: string;
  //     }) => {
  //       try {
  //         return await bcrypt.compare(password, storedHash);
  //       } catch (error) {
  //         console.error("Password verification error:", error);
  //         return false;
  //       }
  //     },
  //   },
  // },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false, // Não permitir que o usuário defina role no signup
      },
    },
    // Permitir alteração de email
    changeEmail: {
      enabled: true,
    },
    // Permitir exclusão de conta
    deleteUser: {
      enabled: true,
    },
  },
  session: authConfig.session,
  rateLimit: authConfig.rateLimit,
  advanced: authConfig.advanced,
  logger: authConfig.logger,
  databaseHooks: {
    user: {
      create: {
        before: (userData) => {
          // Normalizar email
          if (userData.email) {
            userData.email = userData.email.toLowerCase().trim();
          }

          // Remover role inválido antes de criar o usuário
          // O role será definido posteriormente pelo admin
          if (userData.role === "user" || userData.role === "admin") {
            return Promise.resolve({
              data: {
                ...userData,
                role: null,
              },
            });
          }
          return Promise.resolve({ data: userData });
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    expo(),
    admin({
      // Configuração de permissões customizadas, seguindo a documentação:
      // https://www.better-auth.com/docs/plugins/admin#permissions
      ac,
      roles: {
        SUPER_ADMIN,
        TENANT_ADMIN,
        TENANT_OWNER,
        TENANT_USER_MANAGER,
        TENANT_USER,
      },
      defaultRole: "TENANT_USER",
      adminRoles: [
        "SUPER_ADMIN",
        "TENANT_ADMIN",
        "TENANT_OWNER",
        "TENANT_USER_MANAGER",
        "TENANT_USER",
      ],
      impersonationSessionDuration: 60 * 60 * 24, // 24 horas
    }),
    // Passkey (WebAuthn) - autenticação sem senha
    passkey({
      rpID:
        process.env.NODE_ENV === "production"
          ? new URL(process.env.CORS_ORIGIN || "http://localhost:3001").hostname
          : "localhost",
      rpName: "FBI Gestor",
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.CORS_ORIGIN || "http://localhost:3001"
          : "http://localhost:3001",
    }),
    // Two-Factor Authentication (2FA) - TOTP
    twoFactor({
      issuer: "FBI Gestor",
      totpOptions: {
        digits: 6,
        period: 30,
      },
    }),
  ],
});
