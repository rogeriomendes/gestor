import { ActiveSessionsSection } from "./_components/active-sessions-section";
import { BackupCodesSection } from "./_components/backup-codes-section";
import { ChangePasswordSection } from "./_components/change-password-section";
import { DeleteAccountSection } from "./_components/delete-account-section";
import { EmailSection } from "./_components/email-section";
import { LinkedAccountsSection } from "./_components/linked-accounts-section";
import { PasskeySection } from "./_components/passkey-section";
import { TwoFactorSection } from "./_components/two-factor-section";

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      {/* Credenciais */}
      <EmailSection />
      <ChangePasswordSection />

      {/* Autenticação */}
      <PasskeySection />
      <TwoFactorSection />
      <BackupCodesSection />

      {/* Contas */}
      <LinkedAccountsSection />
      <ActiveSessionsSection />

      {/* Zona de perigo */}
      <DeleteAccountSection />
    </div>
  );
}
