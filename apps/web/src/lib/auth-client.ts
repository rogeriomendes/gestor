import { passkeyClient } from "@better-auth/passkey/client";
import {
  ac,
  SUPER_ADMIN,
  TENANT_ADMIN,
  TENANT_OWNER,
  TENANT_USER,
  TENANT_USER_MANAGER,
} from "@gestor/auth/permissions";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Configuração do auth client com suporte a:
 * - Admin (permissões e roles)
 * - Passkey (WebAuthn)
 * - Two-Factor Authentication (2FA/TOTP)
 * - Google OAuth (configurado no servidor)
 */
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
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        // Redirecionar para a página de verificação 2FA
        window.location.href = "/2fa";
      },
    }),
  ],
});
