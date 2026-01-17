import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Configuração do auth client
 * O Better Auth infere automaticamente os tipos baseado nos plugins
 */
const authClientConfig: {
  baseURL?: string;
  plugins: ReturnType<typeof adminClient>[];
} = {
  plugins: [adminClient()],
};

// Apenas definir baseURL se a variável de ambiente estiver configurada
// (deve ser uma URL completa, ex: https://api.example.com/api/auth)
if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
  authClientConfig.baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
}

export const authClient = createAuthClient(authClientConfig);
