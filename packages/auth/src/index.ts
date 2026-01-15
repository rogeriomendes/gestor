import { expo } from "@better-auth/expo";
import prisma from "@gestor/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
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
  databaseHooks: {
    user: {
      create: {
        before: (userData) => {
          // Remover role inválido antes de criar o usuário
          // O role será definido posteriormente pelo admin
          if (userData.role === "user" || userData.role === "admin") {
            return {
              data: {
                ...userData,
                role: null,
              },
            };
          }
          return { data: userData };
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    expo(),
    admin({
      // Configurar quais usuários são admins
      // Usuários com role "admin" ou IDs específicos
      adminUserIds: [], // IDs específicos podem ser adicionados aqui
    }),
  ],
});
