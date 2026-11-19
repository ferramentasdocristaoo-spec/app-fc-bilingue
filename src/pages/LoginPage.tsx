import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_MODE, useAuth } from "@/hooks/use-auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Loader2 } from "lucide-react";
import { appLogo } from "@/lib/branding";
import { toast } from "@/hooks/use-toast";

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const usePassword = AUTH_MODE === "password";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("login.errorEmpty"));
      return;
    }

    if (usePassword && !password) {
      setError(t("login.errorPasswordEmpty"));
      return;
    }

    setLoading(true);
    const { error, pending } = await signIn(email, usePassword ? password : undefined);
    if (pending === "checkEmail") toast({ title: t("login.checkEmail") });
    if (error) {
      const msgs: Record<string, string> = {
        notApproved: t("login.errorNotApproved"),
        blocked: t("login.errorBlocked"),
        expired: t("login.errorExpired"),
        invalidCredentials: t("login.errorInvalidCredentials"),
        passwordEmpty: t("login.errorPasswordEmpty"),
        unavailable: t("login.errorUnavailable"),
      };
      setError(msgs[error] ?? error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img
          src={appLogo(i18n.resolvedLanguage || i18n.language)}
          alt={t("appName")}
          className="w-24 h-24 object-contain animate-fade-in"
        />

        <span className="ed-eyebrow mt-8">{t("appName")}</span>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink text-center leading-tight">
          {t("login.title")}
        </h1>
        <p className="ed-lede mt-3 text-center">{t("login.subtitle")}</p>

        <div className="ed-orn w-full !my-8" aria-hidden="true">✦</div>

        <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="ed-eyebrow">{t("login.emailLabel")}</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-transparent"
            />
          </div>

          {usePassword && (
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="ed-eyebrow">{t("login.passwordLabel")}</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-transparent"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive border-l-2 border-destructive pl-3 py-1">{error}</p>
          )}

          <button type="submit" className="ed-btn ed-btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("login.button")}
          </button>
        </form>

        <div className="mt-8">
          <LanguageSwitcher className="justify-center" variant="horizontal" />
        </div>

        <p className="mt-6 text-sm text-ink-3 text-center max-w-xs leading-relaxed">
          {t("login.footer")}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
