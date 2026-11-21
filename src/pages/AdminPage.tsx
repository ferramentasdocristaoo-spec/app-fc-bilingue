import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, LogIn, LogOut, KeyRound, Home, Users, Brain, ScrollText, BarChart3, Library, Map, BellRing, ArrowLeft, LayoutGrid, Sun, Moon, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logo from "@/assets/logo-pt.png";
import { useTheme } from "@/hooks/use-theme";
import DashboardSection from "@/components/admin/DashboardSection";
import UsersSection from "@/components/admin/UsersSection";
import CacheSection from "@/components/admin/CacheSection";
import SermonsSection from "@/components/admin/SermonsSection";
import AnalyticsSection from "@/components/admin/AnalyticsSection";
import LibrarySection from "@/components/admin/LibrarySection";
import JourneyEditorialSection from "@/components/admin/JourneyEditorialSection";
import NotificationsSection from "@/components/admin/NotificationsSection";
import { SectionHead } from "@/components/admin/admin-ui";
import { emailAdminDaSessao, lembrarAdmin } from "@/hooks/use-is-admin";
import "@/components/admin/AdminShell.css";

const SS_EMAIL = "fc-admin-email";
const SS_PASS = "fc-admin-pass";

export type Tab = "dashboard" | "analytics" | "users" | "sermons" | "cache" | "livraria" | "jornada" | "notificacoes";

type NavItem = { id: Tab; label: string; curto: string; icon: LucideIcon; grupo: string; titulo: string; lede: string };

/* Painel no padrão do app novo (21/11/2026, Aoliabe): lateral azul-noite no computador; no celular,
   cabeçalho com a logo discreta + barra inferior igual à do app + folha "Mais". Só a apresentação mudou:
   login, sessão, RPCs e o fluxo das notificações são os mesmos. */
const NAV: NavItem[] = [
  { id: "dashboard", label: "Início", curto: "Início", icon: Home, grupo: "Painel", titulo: "Painel", lede: "" },
  { id: "analytics", label: "Análises", curto: "Análises", icon: BarChart3, grupo: "Painel", titulo: "Análises", lede: "Como o app está sendo usado: dias, horários, novos acessos e economia da IA." },
  { id: "users", label: "Assinantes", curto: "Pessoas", icon: Users, grupo: "Pessoas", titulo: "Assinantes", lede: "Quem tem acesso ao app: buscar, liberar, bloquear e corrigir e-mail." },
  { id: "notificacoes", label: "Notificações", curto: "Avisos", icon: BellRing, grupo: "Pessoas", titulo: "Notificações", lede: "Escreva em português; o painel traduz para cada idioma e mostra a prévia antes de enviar." },
  { id: "jornada", label: "Jornada", curto: "Jornada", icon: Map, grupo: "Conteúdo", titulo: "Jornada pela Bíblia", lede: "Gerar, revisar e publicar os capítulos da Jornada." },
  { id: "livraria", label: "Livraria", curto: "Livraria", icon: Library, grupo: "Conteúdo", titulo: "Livraria", lede: "Coleções liberadas por compra (SKU) e acessos dados à mão." },
  { id: "sermons", label: "Esboços", curto: "Esboços", icon: ScrollText, grupo: "Conteúdo", titulo: "Esboços", lede: "" },
  { id: "cache", label: "Cache da IA", curto: "Cache", icon: Brain, grupo: "Conteúdo", titulo: "Cache da IA", lede: "Respostas guardadas para não pagar a IA duas vezes pela mesma pergunta." },
];
const BARRA: Tab[] = ["dashboard", "users", "notificacoes", "jornada"];
const TABS = NAV.map((n) => n.id);

const tabDaUrl = (): Tab => {
  const h = window.location.hash.replace("#", "");
  return (TABS as string[]).includes(h) ? (h as Tab) : "dashboard";
};

const AdminPage = () => {
  // O painel é sempre exibido em português do Brasil, independente do idioma do app.
  const t = i18n.getFixedT("pt-BR");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [authed, setAuthed] = useState(false);
  // Admin pela sessão do app (e-mail confirmado em admin_users): entra direto, sem senha.
  const [sessaoEmail, setSessaoEmail] = useState<string | null>(null);
  const [conferindoSessao, setConferindoSessao] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tab, setTabState] = useState<Tab>(tabDaUrl);
  const [buscarAssinante, setBuscarAssinante] = useState(0);
  const [maisOpen, setMaisOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  const ir = useCallback((id: Tab, opts?: { buscar?: boolean }) => {
    setTabState(id);
    setMaisOpen(false);
    if (opts?.buscar) setBuscarAssinante((n) => n + 1);
    // A aba fica no endereço (#notificacoes): recarregar o PWA volta no mesmo lugar.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
    window.scrollTo(0, 0);
  }, []);

  // Na sessão, as RPCs admin_* recebem o e-mail da sessão e senha vazia (verify_admin aceita a sessão).
  const creds = sessaoEmail
    ? { _admin_email: sessaoEmail, _admin_password: "" }
    : { _admin_email: sessionStorage.getItem(SS_EMAIL) || "", _admin_password: sessionStorage.getItem(SS_PASS) || "" };

  useEffect(() => {
    let ativo = true;
    const e = sessionStorage.getItem(SS_EMAIL);
    const p = sessionStorage.getItem(SS_PASS);
    if (e && p) setAuthed(true);
    emailAdminDaSessao()
      .then((email) => { if (ativo && email) { setSessaoEmail(email); setAuthed(true); } })
      .catch(() => { /* sem sessão: login antigo */ })
      .finally(() => { if (ativo) setConferindoSessao(false); });
    return () => { ativo = false; };
  }, []);

  // Link direto para uma aba (ex.: /fc-control-panel#notificacoes) com a página já aberta.
  useEffect(() => {
    const onHash = () => setTabState(tabDaUrl());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Folha "Mais": Esc fecha.
  useEffect(() => {
    if (!maisOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMaisOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maisOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const { data, error } = await supabase.rpc("verify_admin", {
      _email: adminEmail.trim().toLowerCase(),
      _password: adminPass,
    });
    setLoading(false);
    if (error || !data) {
      setLoginError(t("admin.errorInvalid"));
      return;
    }
    sessionStorage.setItem(SS_EMAIL, adminEmail.trim().toLowerCase());
    sessionStorage.setItem(SS_PASS, adminPass);
    // Atalho "Admin" no app deste aparelho (só aparece se o app estiver com este mesmo e-mail).
    lembrarAdmin(adminEmail.trim().toLowerCase());
    setAuthed(true);
    setAdminPass("");
  };

  const handleLogout = () => {
    // Na sessão do app, "sair do painel" é só voltar ao app (a conta continua logada).
    if (sessaoEmail) { navigate("/"); return; }
    lembrarAdmin(null);
    sessionStorage.removeItem(SS_EMAIL);
    sessionStorage.removeItem(SS_PASS);
    setAuthed(false);
  };

  // Sessão recusada no meio do uso (expirou ou o e-mail saiu de admin_users): volta ao login antigo com aviso.
  const handleUnauthorized = () => {
    if (sessaoEmail) {
      setSessaoEmail(null);
      setAuthed(!!(sessionStorage.getItem(SS_EMAIL) && sessionStorage.getItem(SS_PASS)));
      setLoginError("A sessão de admin não vale mais. Entre com e-mail e senha do painel.");
      return;
    }
    handleLogout();
  };

  const handleChangePassword = async () => {
    if (newPw.length < 6) return toast.error(t("admin.passwordTooShort"));
    if (newPw !== newPw2) return toast.error(t("admin.passwordMismatch"));
    const { error } = await supabase.rpc("admin_change_password", { ...creds, _new_password: newPw });
    if (error) return toast.error(t("common.error"));
    sessionStorage.setItem(SS_PASS, newPw);
    toast.success(t("admin.passwordChanged"));
    setNewPw("");
    setNewPw2("");
    setPwOpen(false);
  };

  const temaLabel = theme === "dark" ? "Tema claro" : "Tema escuro";
  const TemaIcon = theme === "dark" ? Sun : Moon;

  if (!authed && conferindoSessao) {
    return (
      <div className="adm-root adm-login">
        <div className="adm-login-box" role="status" aria-label="Conferindo acesso">
          <img src={logo} alt="" />
          <Loader2 className="h-8 w-8 animate-spin text-gold-ink" aria-hidden="true" />
          <p className="adm-lede">Conferindo o seu acesso…</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="adm-root adm-login">
        <img className="adm-wm" src={logo} alt="" aria-hidden="true" />
        <div className="adm-login-box">
          <img src={logo} alt="Ferramentas do Cristão" />
          <div className="adm-card">
            <span className="adm-eyebrow">Ferramentas do Cristão</span>
            <h1 className="adm-h1">{t("admin.title")}</h1>
            <p className="adm-lede">Acesso só para a equipe. Entre com o e-mail e a senha do painel.</p>
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label className="adm-label" htmlFor="adm-email">{t("admin.emailLabel")}</label>
                <input id="adm-email" className="adm-field" type="email" autoComplete="username" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@..." />
              </div>
              <div>
                <label className="adm-label" htmlFor="adm-pass">{t("admin.passwordLabel")}</label>
                <input id="adm-pass" className="adm-field" type="password" autoComplete="current-password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
              </div>
              {loginError && <p className="adm-error" role="alert">{loginError}</p>}
              <button type="submit" className="adm-btn w-full" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <LogIn className="h-5 w-5" aria-hidden="true" />}
                {t("admin.button")}
              </button>
            </form>
          </div>
          <Link to="/" className="adm-back"><ArrowLeft className="h-5 w-5" aria-hidden="true" />Voltar ao app</Link>
        </div>
      </div>
    );
  }

  const atual = NAV.find((n) => n.id === tab)!;

  const renderSection = () => {
    switch (tab) {
      case "dashboard": return <DashboardSection creds={creds} onIr={ir} />;
      case "analytics": return <AnalyticsSection creds={creds} />;
      case "users": return <UsersSection creds={creds} onUnauthorized={handleUnauthorized} focarBusca={buscarAssinante} />;
      case "livraria": return <LibrarySection creds={creds} onUnauthorized={handleUnauthorized} />;
      case "jornada": return <JourneyEditorialSection credentials={creds} />;
      case "notificacoes": return <NotificationsSection creds={creds} onUnauthorized={handleUnauthorized} />;
      case "sermons": return <SermonsSection />;
      case "cache": return <CacheSection creds={creds} />;
    }
  };

  const grupos = [...new Set(NAV.map((n) => n.grupo))];
  const mais = NAV.filter((n) => !BARRA.includes(n.id));

  return (
    <div className="adm-root">
      {/* Computador: lateral azul-noite, com a marca discreta no topo e "Voltar ao app" sempre à vista. */}
      <aside className="adm-side" aria-label="Menu do painel">
        <Link to="/" className="adm-brand" aria-label="Ferramentas do Cristão: voltar ao app">
          <img src={logo} alt="" />
          <span><b>Ferramentas do Cristão</b><small>Painel do dono</small></span>
        </Link>
        <nav className="adm-side-nav">
          {grupos.map((g) => (
            <div key={g}>
              <p className="adm-side-group">{g}</p>
              {NAV.filter((n) => n.grupo === g).map((item) => (
                <button key={item.id} type="button" className="adm-side-item" aria-current={tab === item.id ? "page" : undefined} onClick={() => ir(item.id)}>
                  <item.icon aria-hidden="true" />{item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <Link to="/" className="adm-side-item adm-side-app"><ArrowLeft aria-hidden="true" />Voltar ao app</Link>
          <button type="button" className="adm-side-item" onClick={toggleTheme}><TemaIcon aria-hidden="true" />{temaLabel}</button>
          {!sessaoEmail && <button type="button" className="adm-side-item" onClick={() => setPwOpen(true)}><KeyRound aria-hidden="true" />{t("admin.changePassword")}</button>}
          {!sessaoEmail && <button type="button" className="adm-side-item adm-side-danger" onClick={handleLogout}><LogOut aria-hidden="true" />{t("admin.logout")}</button>}
          {sessaoEmail && <p className="adm-side-who">Entrou pela conta {sessaoEmail}</p>}
        </div>
      </aside>

      <div className="adm-shell">
        {/* Celular: logo pequena, nome da aba, tema e "App" (voltar) sempre visíveis. */}
        <header className="adm-top">
          <img className="adm-top-logo" src={logo} alt="Ferramentas do Cristão" />
          <p className="adm-top-title">Painel</p>
          <button type="button" className="adm-iconbtn" onClick={toggleTheme} aria-label={temaLabel} title={temaLabel}>
            <TemaIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <Link to="/" className="adm-back" aria-label="Voltar ao app"><ArrowLeft className="h-5 w-5" aria-hidden="true" />App</Link>
        </header>

        <main ref={mainRef} className="adm-main" id="adm-conteudo">
          <img className="adm-wm" src={logo} alt="" aria-hidden="true" />
          {tab !== "dashboard" && <SectionHead title={atual.titulo} lede={atual.lede || undefined} />}
          {renderSection()}
        </main>
      </div>

      {/* Celular: barra inferior no mesmo desenho da barra do app. */}
      <nav className="adm-bnav" aria-label="Menu do painel">
        <div className="adm-bnav-bar">
          {BARRA.map((id) => {
            const item = NAV.find((n) => n.id === id)!;
            return (
              <button key={id} type="button" className="adm-bnav-tab" aria-current={tab === id ? "page" : undefined} onClick={() => ir(id)}>
                <span className="adm-bnav-pill"><item.icon aria-hidden="true" /></span><span>{item.curto}</span>
              </button>
            );
          })}
          <button type="button" className="adm-bnav-tab" aria-haspopup="dialog" aria-expanded={maisOpen}
            aria-current={mais.some((m) => m.id === tab) ? "page" : undefined} onClick={() => setMaisOpen(true)}>
            <span className="adm-bnav-pill"><LayoutGrid aria-hidden="true" /></span><span>Mais</span>
          </button>
        </div>
      </nav>

      {maisOpen && (
        <>
          <div className="adm-sheet-overlay" onClick={() => setMaisOpen(false)} aria-hidden="true" />
          <div className="adm-sheet" role="dialog" aria-modal="true" aria-labelledby="adm-mais-titulo">
            <div className="adm-sheet-grab" aria-hidden="true" />
            <div className="adm-sheet-head">
              <h2 id="adm-mais-titulo">Mais do painel</h2>
              <button type="button" className="adm-iconbtn" onClick={() => setMaisOpen(false)} aria-label="Fechar" autoFocus><X className="h-6 w-6" aria-hidden="true" /></button>
            </div>
            <div className="adm-sheet-grid">
              {mais.map((item) => (
                <button key={item.id} type="button" className="adm-sheet-card" aria-current={tab === item.id ? "page" : undefined} onClick={() => ir(item.id)}>
                  <span className="adm-tile"><item.icon aria-hidden="true" /></span>{item.label}
                </button>
              ))}
            </div>
            <p className="adm-sec">Ajustes</p>
            <Link to="/" className="adm-sheet-row"><ArrowLeft aria-hidden="true" />Voltar ao app</Link>
            <button type="button" className="adm-sheet-row" onClick={toggleTheme}><TemaIcon aria-hidden="true" />{temaLabel}</button>
            {!sessaoEmail && <button type="button" className="adm-sheet-row" onClick={() => { setMaisOpen(false); setPwOpen(true); }}><KeyRound aria-hidden="true" />{t("admin.changePassword")}</button>}
            {!sessaoEmail && <button type="button" className="adm-sheet-row is-danger" onClick={handleLogout}><LogOut aria-hidden="true" />{t("admin.logout")}</button>}
            {sessaoEmail && <p className="adm-kpi-hint" style={{ padding: "10px 6px 0", wordBreak: "break-all" }}>Entrou pela conta {sessaoEmail}</p>}
          </div>
        </>
      )}

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.changePasswordTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>{t("admin.newPassword")}</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>{t("admin.confirmPassword")}</Label><Input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>{t("admin.cancel")}</Button>
            <Button onClick={handleChangePassword}>{t("admin.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
