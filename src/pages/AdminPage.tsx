import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, LogIn, LogOut, KeyRound, Shield, LayoutDashboard, Users, Brain, ScrollText, Menu, BarChart3 } from "lucide-react";
import logo from "@/assets/logo.png";
import DashboardSection from "@/components/admin/DashboardSection";
import UsersSection from "@/components/admin/UsersSection";
import CacheSection from "@/components/admin/CacheSection";
import SermonsSection from "@/components/admin/SermonsSection";
import AnalyticsSection from "@/components/admin/AnalyticsSection";

const SS_EMAIL = "fc-admin-email";
const SS_PASS = "fc-admin-pass";

type Tab = "dashboard" | "analytics" | "users" | "sermons" | "cache";

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Análises", icon: BarChart3 },
  { id: "users", label: "Usuários", icon: Users },
  { id: "sermons", label: "Sermões", icon: ScrollText },
  { id: "cache", label: "Cache do gerador", icon: Brain },
];

const AdminPage = () => {
  const [authed, setAuthed] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  const creds = {
    _admin_email: sessionStorage.getItem(SS_EMAIL) || "",
    _admin_password: sessionStorage.getItem(SS_PASS) || "",
  };

  useEffect(() => {
    const e = sessionStorage.getItem(SS_EMAIL);
    const p = sessionStorage.getItem(SS_PASS);
    if (e && p) setAuthed(true);
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
      setLoginError("E-mail ou senha incorretos.");
      return;
    }
    sessionStorage.setItem(SS_EMAIL, adminEmail.trim().toLowerCase());
    sessionStorage.setItem(SS_PASS, adminPass);
    setAuthed(true);
    setAdminPass("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SS_EMAIL);
    sessionStorage.removeItem(SS_PASS);
    setAuthed(false);
  };

  const handleChangePassword = async () => {
    if (newPw.length < 6) return toast.error("Senha muito curta (mín. 6).");
    if (newPw !== newPw2) return toast.error("Senhas não conferem.");
    const { error } = await supabase.rpc("admin_change_password", { ...creds, _new_password: newPw });
    if (error) return toast.error("Erro ao trocar senha.");
    sessionStorage.setItem(SS_PASS, newPw);
    toast.success("Senha alterada.");
    setNewPw("");
    setNewPw2("");
    setPwOpen(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <div className="w-20 h-20"><img src={logo} alt="FC Sermon" className="w-full h-full object-contain" /></div>
          <div className="w-full rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="text-center space-y-1">
              <Shield className="w-8 h-8 mx-auto text-primary" />
              <h1 className="font-display text-xl font-bold text-primary">Painel Admin</h1>
              <p className="text-sm text-muted-foreground">Acesso restrito</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@..." /></div>
              <div className="space-y-1.5"><Label>Senha</Label><Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} /></div>
              {loginError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{loginError}</p>}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Entrar
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (tab) {
      case "dashboard": return <DashboardSection creds={creds} />;
      case "analytics": return <AnalyticsSection creds={creds} />;
      case "users": return <UsersSection creds={creds} onUnauthorized={handleLogout} />;
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
            <h1 className="font-display text-base font-bold text-primary leading-tight">Painel Admin</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">FC Sermon</p>
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
          <button
            onClick={() => setPwOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <KeyRound className="w-4 h-4" />
            Trocar senha
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
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
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Trocar senha de admin</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Confirmar nova senha</Label><Input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
