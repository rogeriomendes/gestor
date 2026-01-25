import { ActiveSessionsSection } from "./_components/active-sessions-section";
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
      <div id="email">
        <EmailSection />
      </div>
      <div id="password">
        <ChangePasswordSection />
      </div>

      {/* Autenticação */}
      <div id="passkey">
        <PasskeySection />
      </div>
      <div id="two-factor">
        <TwoFactorSection />
      </div>

      {/* Contas */}
      <div id="linked-accounts">
        <LinkedAccountsSection />
      </div>
      <div id="active-sessions">
        <ActiveSessionsSection />
      </div>

      {/* Zona de perigo */}
      <div id="delete-account">
        <DeleteAccountSection />
      </div>
    </div>
  );
}
