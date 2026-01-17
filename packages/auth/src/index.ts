import { expo } from "@better-auth/expo";
import prisma from "@gestor/db";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { authConfig, validateAuthConfig } from "./config";

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
      // Usar adminUserIds vazio por padrão
      // Os roles SUPER_ADMIN e TENANT_ADMIN são gerenciados pelo sistema de permissões customizado
      // Se necessário, adicione IDs específicos aqui: adminUserIds: ["user_id_1", "user_id_2"]
      adminUserIds: [],
    }),
  ],
});
