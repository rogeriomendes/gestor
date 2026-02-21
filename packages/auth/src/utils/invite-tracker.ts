/**
 * Sistema de rastreamento de convites para interceptar emails de reset de senha
 * e enviar emails de boas-vindas personalizados
 */

interface InviteInfo {
  invitedBy?: string;
  roleName?: string;
  tenantName?: string;
  timestamp: number;
  userName: string;
}

// Map para armazenar informações de convites pendentes
// Key: email normalizado, Value: informações do convite
const pendingInvites = new Map<string, InviteInfo>();

// Tempo de expiração para convites (5 minutos)
const INVITE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Registra um convite pendente
 */
export function registerInvite(
  email: string,
  info: Omit<InviteInfo, "timestamp">
) {
  const normalizedEmail = email.toLowerCase().trim();
  pendingInvites.set(normalizedEmail, {
    ...info,
    timestamp: Date.now(),
  });

  // Limpar automaticamente após expiração
  setTimeout(() => {
    pendingInvites.delete(normalizedEmail);
  }, INVITE_EXPIRY_MS);
}

/**
 * Verifica se um email tem um convite pendente e retorna as informações
 */
export function getInviteInfo(email: string): InviteInfo | null {
  const normalizedEmail = email.toLowerCase().trim();
  const invite = pendingInvites.get(normalizedEmail);

  if (!invite) {
    return null;
  }

  // Verificar se expirou
  if (Date.now() - invite.timestamp > INVITE_EXPIRY_MS) {
    pendingInvites.delete(normalizedEmail);
    return null;
  }

  return invite;
}

/**
 * Remove um convite pendente (após enviar o email)
 */
export function removeInvite(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  pendingInvites.delete(normalizedEmail);
}

/**
 * Limpa convites expirados (manutenção)
 */
export function cleanupExpiredInvites() {
  const now = Date.now();
  for (const [email, invite] of pendingInvites.entries()) {
    if (now - invite.timestamp > INVITE_EXPIRY_MS) {
      pendingInvites.delete(email);
    }
  }
}
