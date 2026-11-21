import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, LogIn, LogOut, KeyRound, Shield, LayoutDashboard, Users, Brain, ScrollText, Menu, BarChart3, Library, BookMarked, BellRing, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logo from "@/assets/logo-pt.png";
import DashboardSection from "@/components/admin/DashboardSection";
import UsersSection from "@/components/admin/UsersSection";
import CacheSection from "@/components/admin/CacheSection";
import SermonsSection from "@/components/admin/SermonsSection";
import AnalyticsSection from "@/components/admin/AnalyticsSection";
import LibrarySection from "@/components/admin/LibrarySection";
import JourneyEditorialSection from "@/components/admin/JourneyEditorialSection";
import NotificationsSection from "@/components/admin/NotificationsSection";
import { emailAdminDaSessao, lembrarAdmin } from "@/hooks/use-is-admin";

const SS_EMAIL = "fc-admin-email";
const SS_PASS = "fc-admin-pass";

type Tab = "dashboard" | "analytics" | "users" | "sermons" | "cache" | "livraria" | "jornada" | "notificacoes";

const AdminPage = () => {
  // O painel admin é sempre exibido em português, independente do idioma do app.
  const t = i18n.getFixedT("pt-PT");
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  // Admin pela sessão do app (e-mail confirmado em admin_users): entra direto, sem senha.
  const [sessaoEmail, setSessaoEmail] = useState<string | null>(null);
  const [conferindoSessao, setConferindoSessao] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  const NAV: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "dashboard", label: t("admin.dashboard"), icon: LayoutDashboard },
    { id: "analytics", label: t("admin.analytics"), icon: BarChart3 },
    { id: "users", label: t("admin.users"), icon: Users },
    { id: "livraria", label: t("admin.livraria"), icon: Library },
    { id: "jornada", label: "Jornada Bíblica", icon: BookMarked },
    { id: "notificacoes", label: "Notificações", icon: BellRing },
    { id: "sermons", label: t("admin.sermons"), icon: ScrollText },
    { id: "cache", label: t("admin.cache"), icon: Brain },
  ];

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
    sessionStorage.removeItem(SS_EMAIL);
    sessionStorage.removeItem(SS_PASS);
    setAuthed(false);
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

  if (!authed && conferindoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Conferindo acesso" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <div className="w-20 h-20"><img src={logo} alt="Ferramentas do Cristão" className="w-full h-full object-contain" /></div>
          <div className="w-full rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="text-center space-y-1">
              <Shield className="w-8 h-8 mx-auto text-primary" />
              <h1 className="font-display text-xl font-bold text-primary">{t("admin.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5"><Label>{t("admin.emailLabel")}</Label><Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@..." /></div>
              <div className="space-y-1.5"><Label>{t("admin.passwordLabel")}</Label><Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} /></div>
              {loginError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{loginError}</p>}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {t("admin.button")}
              </Button>
            </form>
          </div>
          <Link to="/" className="inline-flex min-h-12 items-center gap-2 rounded-lg px-4 text-[0.9375rem] text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />Voltar ao app
          </Link>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (tab) {
      case "dashboard": return <DashboardSection creds={creds} />;
      case "analytics": return <AnalyticsSection creds={creds} />;
      case "users": return <UsersSection creds={creds} onUnauthorized={handleLogout} />;
      case "livraria": return <LibrarySection creds={creds} onUnauthorized={handleLogout} />;
      case "jornada": return <JourneyEditorialSection credentials={creds} />;
      case "notificacoes": return <NotificationsSection creds={creds} onUnauthorized={handleLogout} />;
      case "sermons": return <SermonsSection />;
      case "cache": return <CacheSection creds={creds} />;
    }
  };

  const currentNav = NAV.find((n) => n.id === tab)!;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9"><img src={logo} alt="" className="w-full h-full object-contain" /></div>
          <div>
            <h1 className="font-display text-base font-bold text-primary leading-tight">{t("admin.title")}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ferramentas do Cristão</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-muted transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao app
          </Link>
          {sessaoEmail && <p className="px-3 py-1 text-sm text-muted-foreground break-all">Entrou pela conta {sessaoEmail}</p>}
          {!sessaoEmail && <button
            onClick={() => setPwOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <KeyRound className="w-4 h-4" />
            {t("admin.changePassword")}
          </button>}
          {!sessaoEmail && <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="w-4 h-4" />
            {t("admin.logout")}
          </button>}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 md:px-6 bg-card/50 backdrop-blur sticky top-0 z-30">
          <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <currentNav.icon className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-primary">{currentNav.label}</h2>
          <Link to="/" className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">Voltar ao app</span><span className="sm:hidden">App</span>
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="w-full">
            {renderSection()}
          </div>
        </main>
      </div>

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
