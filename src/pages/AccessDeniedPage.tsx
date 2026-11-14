import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { appLogo } from "@/lib/branding";
import { RENEW_URL } from "@/lib/planos";
import type { AccessDenied } from "@/hooks/use-auth";

interface AccessDeniedPageProps {
  denied: AccessDenied;
  onBack: () => void;
}

/**
 * Tela simpática para assinatura vencida ou e-mail bloqueado (14/11/2026).
 * Mesmo desenho editorial do login; o botão principal leva ao checkout (RENEW_URL, placeholder).
 * Regras da casa: corpo ≥ 17 px, alvos ≥ 44 px (ed-btn), nada abaixo de 14 px.
 */
const AccessDeniedPage = ({ denied, onBack }: AccessDeniedPageProps) => {
  const { t, i18n } = useTranslation();
  const expired = denied.status === "expired";

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-sm flex flex-col items-center" data-testid="access-denied" data-status={denied.status}>
        <img src={appLogo(i18n.resolvedLanguage || i18n.language)} alt={t("appName")} className="w-24 h-24 object-contain animate-fade-in" />

        <span className="ed-eyebrow mt-8">{t("appName")}</span>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink text-center leading-tight">
          {expired ? t("access.expiredTitle") : t("access.blockedTitle")}
        </h1>
        <p className="ed-lede mt-3 text-center">{expired ? t("access.expiredBody") : t("access.blockedBody")}</p>

        <div className="ed-orn w-full !my-8" aria-hidden="true">✦</div>

        <a href={RENEW_URL} target="_blank" rel="noopener noreferrer" className="ed-btn ed-btn-primary w-full">
          {expired ? t("access.renew") : t("access.subscribeAgain")}
        </a>
        <button type="button" onClick={onBack} className="ed-btn ed-btn-ghost w-full mt-3">
          {t("access.backToLogin")}
        </button>

        <p className="mt-6 text-sm text-ink-3 text-center">{t("access.signedAs", { email: denied.email })}</p>

        <div className="mt-6">
          <LanguageSwitcher className="justify-center" variant="horizontal" />
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
