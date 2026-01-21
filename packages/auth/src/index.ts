import { expo } from "@better-auth/expo";
import prisma from "@gestor/db";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
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
validateAuthConfig();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
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
  ],
});
