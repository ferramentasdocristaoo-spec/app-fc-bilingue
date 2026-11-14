import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/i18n";
import i18n from "i18next";
import { APP_LANGUAGES, PLANO_KEY, getPlanoAtual, idiomaLiberado, idiomasLiberados, setPlanoAtual } from "@/i18n/app-languages";
import { MANUAL_LANGUAGE_KEY } from "@/i18n/geo-language";
import { LanguageFlags } from "@/components/LanguageFlags";
import { Toaster } from "@/components/ui/toaster";
import AccessDeniedPage from "@/pages/AccessDeniedPage";
import { RENEW_URL } from "@/lib/planos";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    from: vi.fn(),
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe() {} } } })), signOut: vi.fn() },
  },
}));

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
}

const TODOS = APP_LANGUAGES.map((l) => l.code);

describe("Trava de idiomas por plano (idiomasLiberados)", () => {
  beforeEach(async () => { localStorage.clear(); setPlanoAtual(null); await i18n.changeLanguage("pt-PT"); });
  // Desmonta antes de zerar o plano: senão o FlagList ainda montado re-renderiza fora de act().
  afterEach(() => { cleanup(); setPlanoAtual(null); });

  it("sem plano conhecido (null, 'manual', lista antiga): todos os 7, como antes", () => {
    expect(idiomasLiberados(null)).toEqual(TODOS);
    expect(idiomasLiberados({ plan: null, idiomasLiberados: false })).toEqual(TODOS);
    expect(idiomasLiberados({ plan: "manual", idiomasLiberados: false })).toEqual(TODOS);
  });

  it("plano brasileiro sem adicional: só pt-BR", () => {
    for (const plan of ["br_mensal", "br_3m", "br_6m", "br_12m"]) {
      expect(idiomasLiberados({ plan, idiomasLiberados: false }), plan).toEqual(["pt-BR"]);
    }
    expect(idiomaLiberado("en", { plan: "br_mensal", idiomasLiberados: false })).toBe(false);
    expect(idiomaLiberado("pt-BR", { plan: "br_mensal", idiomasLiberados: false })).toBe(true);
  });

  it("adicional de idiomas ou plano internacional: os 7", () => {
    expect(idiomasLiberados({ plan: "br_mensal", idiomasLiberados: true })).toEqual(TODOS);
    expect(idiomasLiberados({ plan: "intl_mensal", idiomasLiberados: false })).toEqual(TODOS);
  });

  it("o plano fica guardado no aparelho e é lido sem argumento", () => {
    setPlanoAtual({ plan: "br_6m", idiomasLiberados: false });
    expect(JSON.parse(localStorage.getItem(PLANO_KEY)!)).toEqual({ plan: "br_6m", idiomasLiberados: false });
    expect(getPlanoAtual()?.plan).toBe("br_6m");
    expect(idiomasLiberados()).toEqual(["pt-BR"]);
    setPlanoAtual(null);
    expect(localStorage.getItem(PLANO_KEY)).toBeNull();
    expect(idiomasLiberados()).toEqual(TODOS);
  });

  it("bandeiras: plano br_* sem adicional deixa 6 apagadas com cadeado; tocar numa abre o aviso e não troca o idioma", async () => {
    await i18n.changeLanguage("pt-BR");
    setPlanoAtual({ plan: "br_mensal", idiomasLiberados: false });
    render(<><LanguageFlags /><Toaster /></>);
    expect(document.querySelectorAll(".lang-flag-btn.is-locked")).toHaveLength(6);
    expect(document.querySelectorAll(".lang-flag-btn.is-locked .lang-flag-lock")).toHaveLength(6);
    expect(document.querySelectorAll(".lang-flag-btn:disabled")).toHaveLength(0); // continua tocável para mostrar o aviso
    const br = screen.getByRole("button", { name: "Português (Brasil)" });
    expect(br).not.toHaveClass("is-locked");
    expect(br).toHaveAttribute("aria-pressed", "true");

    const en = screen.getByRole("button", { name: "English · Idiomas adicionais" });
    expect(en).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(en);
    expect(await screen.findByText("Idiomas adicionais")).toBeInTheDocument();
    expect(screen.getByText("Ative na sua assinatura para usar English.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Ativar idiomas" });
    expect(link).toHaveAttribute("href", expect.stringContaining("ferramentasdocristao.com"));
    expect(i18n.language).toBe("pt-BR");
    expect(localStorage.getItem(MANUAL_LANGUAGE_KEY)).toBeNull();
  });

  it("bandeiras: com o adicional (ou plano intl) nenhuma fica apagada e a troca funciona", async () => {
    setPlanoAtual({ plan: "br_mensal", idiomasLiberados: true });
    render(<LanguageFlags />);
    expect(document.querySelectorAll(".lang-flag-btn.is-locked")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Español" }));
    await waitFor(() => expect(i18n.language).toBe("es"));
  });

  it("bandeiras re-renderizam quando o login grava o plano", () => {
    render(<LanguageFlags />);
    expect(document.querySelectorAll(".lang-flag-btn.is-locked")).toHaveLength(0);
    act(() => setPlanoAtual({ plan: "br_12m", idiomasLiberados: false }));
    expect(document.querySelectorAll(".lang-flag-btn.is-locked")).toHaveLength(6);
  });
});

describe("Tela de assinatura vencida / bloqueada", () => {
  beforeEach(async () => { localStorage.clear(); setPlanoAtual(null); rpc.mockReset(); await i18n.changeLanguage("pt-BR"); });

  it("vencida: título simpático, botão Renovar para o checkout e volta ao login", () => {
    const onBack = vi.fn();
    render(<AccessDeniedPage denied={{ status: "expired", email: "maria@exemplo.com" }} onBack={onBack} />);
    expect(screen.getByRole("heading", { name: "Sua assinatura venceu" })).toBeInTheDocument();
    const renovar = screen.getByRole("link", { name: "Renovar assinatura" });
    expect(renovar).toHaveAttribute("href", RENEW_URL);
    expect(renovar).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Conta: maria@exemplo.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entrar com outro e-mail" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("bloqueada: texto próprio e botão de assinar de novo", () => {
    render(<AccessDeniedPage denied={{ status: "blocked", email: "x@y.com" }} onBack={() => {}} />);
    expect(screen.getByRole("heading", { name: "Acesso pausado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assinar de novo" })).toHaveAttribute("href", RENEW_URL);
  });

  it("as chaves novas existem nos 7 idiomas", () => {
    for (const lng of TODOS) {
      for (const key of ["access.expiredTitle", "access.expiredBody", "access.blockedTitle", "access.blockedBody", "access.renew", "access.subscribeAgain", "access.backToLogin", "access.signedAs", "languages.lockedTitle", "languages.lockedBody", "languages.lockedAction", "login.errorUnavailable"]) {
        const value = i18n.getFixedT(lng)(key);
        expect(value, `${lng} ${key}`).not.toBe(key);
        expect(value.trim(), `${lng} ${key}`).not.toBe("");
      }
    }
  });

  // Modo "email": quem ficou logado no aparelho é conferido de novo ao abrir o app.
  const Probe = () => {
    const { email, denied, clearDenied } = useAuth();
    if (denied) return <AccessDeniedPage denied={denied} onBack={clearDenied} />;
    return <p>{email ? `dentro:${email}` : "login"}</p>;
  };

  it("login em modo e-mail: assinatura vencida leva à tela de renovar e grava o plano quando ok", async () => {
    rpc.mockImplementation(async (fn: string) => fn === "app_access_info"
      ? { data: { status: "expired", plan: "br_mensal", expires_at: "2026-10-01T00:00:00Z", idiomas_liberados: false }, error: null }
      : { data: null, error: new Error("sem rpc") });
    localStorage.setItem("fc-sermon-auth-email", "vencida@exemplo.com");
    render(<AuthProvider><Probe /></AuthProvider>);
    // Abre primeiro (sem rede o app continua), confere e então mostra a tela de renovar.
    expect(await screen.findByTestId("access-denied")).toHaveAttribute("data-status", "expired");
    expect(localStorage.getItem("fc-sermon-auth-email")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Entrar com outro e-mail" }));
    expect(await screen.findByText("login")).toBeInTheDocument();
  });

  it("login ok em modo e-mail: plano gravado e idioma fora do plano volta para pt-BR", async () => {
    await i18n.changeLanguage("en");
    rpc.mockImplementation(async (fn: string) => fn === "app_access_info"
      ? { data: { status: "ok", plan: "br_12m", expires_at: "2027-11-01T00:00:00Z", idiomas_liberados: false }, error: null }
      : { data: null, error: new Error("sem rpc") });
    localStorage.setItem("fc-sermon-auth-email", "ok@exemplo.com");
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText("dentro:ok@exemplo.com")).toBeInTheDocument();
    await waitFor(() => expect(getPlanoAtual()).toEqual({ plan: "br_12m", idiomasLiberados: false }));
    await waitFor(() => expect(i18n.language).toBe("pt-BR"));
  });

  it("sem rede (RPC e tabela falham): quem já estava dentro continua dentro", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("offline") });
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: new Error("offline") }) }) }),
    });
    localStorage.setItem("fc-sermon-auth-email", "offline@exemplo.com");
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText("dentro:offline@exemplo.com")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.getByText("dentro:offline@exemplo.com")).toBeInTheDocument();
    expect(localStorage.getItem("fc-sermon-auth-email")).toBe("offline@exemplo.com");
  });
});
