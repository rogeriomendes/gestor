import {
  ac,
  SUPER_ADMIN,
  TENANT_ADMIN,
  TENANT_OWNER,
  TENANT_USER,
  TENANT_USER_MANAGER,
} from "@gestor/auth/permissions";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Configuração do auth client
 * O Better Auth infere automaticamente os tipos baseado nos plugins
 */
// const authClientConfig: {
//   baseURL?: string;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   plugins: any[];
// } = {
//   plugins: [
//     adminClient({
//       ac,
//       roles: {
//         SUPER_ADMIN,
//         TENANT_ADMIN,
//         TENANT_OWNER,
//         TENANT_USER_MANAGER,
//         TENANT_USER,
//       },
//     }),
//   ],
// };

// if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
//   // Apenas definir baseURL se a variável de ambiente estiver configurada
//   // (deve ser uma URL completa, ex: https://api.example.com/api/auth)
//   authClientConfig.baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
// }

// export const authClient = createAuthClient(authClientConfig);

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        SUPER_ADMIN,
        TENANT_ADMIN,
        TENANT_OWNER,
        TENANT_USER_MANAGER,
        TENANT_USER,
      },
    }),
  ],
});
