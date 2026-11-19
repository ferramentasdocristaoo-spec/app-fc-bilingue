import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import i18n from "i18next";
import { supabase } from "@/integrations/supabase/client";
import { setLanguageManually } from "@/i18n";
import { idiomasLiberados, matchAppLanguage, setPlanoAtual, type PlanoAcesso } from "@/i18n/app-languages";

type AccessStatus = "ok" | "notApproved" | "blocked" | "expired" | "unavailable";
/** Motivos que levam à tela de acesso encerrado (AccessDeniedPage). */
export type DeniedStatus = "blocked" | "expired";

export interface AccessDenied {
  status: DeniedStatus;
  email: string;
}

interface AuthContextType {
  email: string | null;
  loading: boolean;
  /** Preenchido quando a assinatura venceu ou o e-mail foi bloqueado: o App mostra a tela de renovar. */
  denied: AccessDenied | null;
  clearDenied: () => void;
  /** pending = "checkEmail" quando o link mágico foi enviado e falta o usuário clicar. */
  signIn: (email: string, password?: string) => Promise<{ error: string | null; pending?: "checkEmail" }>;
  signOut: () => void;
}

const AUTH_KEY = "fc-sermon-auth-email";

/**
 * "email" (padrão): login antigo, só confere se o e-mail está liberado.
 * "magiclink": Supabase Auth com link mágico — gera o JWT que o Worker de conteúdo confere.
 * "password": Supabase Auth com e-mail + senha — também gera JWT real, sem depender de SMTP.
 * Só ligue "magiclink" depois de configurar SMTP próprio no Supabase (ver relatório).
 */
type AuthMode = "email" | "magiclink" | "password";
export const AUTH_MODE: AuthMode =
  import.meta.env.VITE_AUTH_MODE === "magiclink"
    ? "magiclink"
    : import.meta.env.VITE_AUTH_MODE === "password"
      ? "password"
      : "email";

const RPC_STATUS: Record<string, AccessStatus> = {
  ok: "ok",
  not_approved: "notApproved",
  blocked: "blocked",
  expired: "expired",
};

interface AccessInfo {
  status: AccessStatus;
  plano: PlanoAcesso | null;
}

/**
 * Confere a liberação e o plano: RPC app_access_info (migração 20261114010000) → RPC app_access_status
 * (20261102010000) → leitura direta da tabela (instalações antigas). Falha de rede = "unavailable":
 * quem já estava logado continua (o app abre sem internet), quem está entrando vê um aviso.
 */
/** Momento em que o banco respondeu que a RPC app_access_info não existe (migração ainda não aplicada). */
export const SEM_ACCESS_INFO_KEY = "fc-sem-app-access-info";
/** Depois disso pergunta de novo: quando o SQL for aplicado, o plano passa a valer sem precisar fechar a aba/PWA. */
export const SEM_ACCESS_INFO_TTL_MS = 10 * 60 * 1000;

function rpcInexistente(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "PGRST202";
}

function lembrouSemAccessInfo(): boolean {
  try {
    const desde = Number(sessionStorage.getItem(SEM_ACCESS_INFO_KEY));
    return desde > 0 && Date.now() - desde < SEM_ACCESS_INFO_TTL_MS;
  } catch {
    return false;
  }
}

async function checkAccess(email: string): Promise<AccessInfo> {
  // RPCs novas ainda fora dos tipos gerados. Se o banco já disse que app_access_info não existe,
  // não pergunta de novo por 10 min (evita um 404 a cada abertura até o SQL ser aplicado).
  const pularInfo = lembrouSemAccessInfo();
  const info = pularInfo
    ? { data: null, error: { code: "PGRST202" } }
    : ((await supabase.rpc("app_access_info" as never, { _email: email } as never)) as { data: unknown; error: unknown });
  if (!pularInfo && rpcInexistente(info.error)) {
    try { sessionStorage.setItem(SEM_ACCESS_INFO_KEY, String(Date.now())); } catch { /* modo privado */ }
  }
  if (!info.error && info.data && typeof info.data === "object") {
    const d = info.data as { status?: string; plan?: string | null; idiomas_liberados?: boolean };
    const status = RPC_STATUS[d.status ?? ""];
    if (status) return { status, plano: { plan: d.plan ?? null, idiomasLiberados: d.idiomas_liberados === true } };
  }

  const rpc = (await supabase.rpc("app_access_status" as never, { _email: email } as never)) as { data: unknown; error: unknown };
  if (!rpc.error && typeof rpc.data === "string" && RPC_STATUS[rpc.data]) return { status: RPC_STATUS[rpc.data], plano: null };

  const { data, error } = await supabase
    .from("approved_emails")
    .select("id, bloqueado, expires_at, plan")
    .eq("email", email)
    .maybeSingle();
  if (error) return { status: "unavailable", plano: null };
  if (!data) return { status: "notApproved", plano: null };
  const plano: PlanoAcesso = { plan: data.plan ?? null, idiomasLiberados: false };
  if (data.bloqueado) return { status: "blocked", plano };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { status: "expired", plano };
  return { status: "ok", plano };
}

/** Guarda o plano e, se o idioma em uso ficou fora dele, troca para o primeiro liberado. */
function aplicarPlano(plano: PlanoAcesso | null) {
  setPlanoAtual(plano);
  const liberados = idiomasLiberados(plano);
  const atual = matchAppLanguage(i18n.resolvedLanguage || i18n.language || "pt-PT");
  if (!liberados.includes(atual)) void setLanguageManually(liberados[0]);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<AccessDenied | null>(null);

  useEffect(() => {
    let active = true;

    // Resultado da conferência para alguém que já estava dentro (sessão salva ou Supabase Auth).
    const aplicarStatus = async (normalized: string, info: AccessInfo) => {
      if (!active) return;
      if (info.status === "ok") {
        aplicarPlano(info.plano);
        localStorage.setItem(AUTH_KEY, normalized);
        setEmail(normalized);
        return;
      }
      if (info.status === "unavailable") return; // sem rede: mantém como está
      localStorage.removeItem(AUTH_KEY);
      setPlanoAtual(null);
      setEmail(null);
      if (info.status === "blocked" || info.status === "expired") setDenied({ status: info.status, email: normalized });
      if (AUTH_MODE !== "email") await supabase.auth.signOut();
    };

    if (AUTH_MODE === "email") {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) setEmail(saved); // abre já (também sem internet) e confere em seguida
      setLoading(false);
      if (saved) void checkAccess(saved).then((info) => aplicarStatus(saved, info)).catch(() => { /* sem rede */ });
      return () => { active = false; };
    }

    const applySession = async (sessionEmail: string | null | undefined) => {
      if (!sessionEmail) {
        if (active) setEmail(null);
        return;
      }
      const normalized = sessionEmail.trim().toLowerCase();
      const info = await checkAccess(normalized);
      await aplicarStatus(normalized, info);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session?.user.email);
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") void applySession(session?.user.email);
      if (event === "SIGNED_OUT" && active) {
        localStorage.removeItem(AUTH_KEY);
        setEmail(null);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (inputEmail: string, password?: string) => {
    const normalizedEmail = inputEmail.trim().toLowerCase();
    const info = await checkAccess(normalizedEmail);
    if (info.status === "blocked" || info.status === "expired") {
      setDenied({ status: info.status, email: normalizedEmail });
      return { error: info.status };
    }
    if (info.status !== "ok") return { error: info.status };

    if (AUTH_MODE === "password") {
      if (!password) return { error: "passwordEmpty" };
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) return { error: "invalidCredentials" };
      // onAuthStateChange(SIGNED_IN) confere de novo a liberação e grava o e-mail.
      aplicarPlano(info.plano);
      localStorage.setItem(AUTH_KEY, normalizedEmail);
      setEmail(normalizedEmail);
      return { error: null };
    }

    if (AUTH_MODE === "magiclink") {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
      });
      if (error) return { error: error.message };
      return { error: null, pending: "checkEmail" as const };
    }

    aplicarPlano(info.plano);
    localStorage.setItem(AUTH_KEY, normalizedEmail);
    setEmail(normalizedEmail);
    return { error: null };
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setPlanoAtual(null);
    setEmail(null);
    if (AUTH_MODE !== "email") void supabase.auth.signOut();
  };

  const clearDenied = () => setDenied(null);

  return (
    <AuthContext.Provider value={{ email, loading, denied, clearDenied, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
