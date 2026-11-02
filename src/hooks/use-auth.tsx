import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type AccessStatus = "ok" | "notApproved" | "blocked" | "expired";

interface AuthContextType {
  email: string | null;
  loading: boolean;
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

/** Confere a liberação pela RPC app_access_status; sem ela (migração não aplicada), lê a tabela como antes. */
async function checkAccess(email: string): Promise<AccessStatus> {
  // RPC nova (migração 20261102010000) ainda fora dos tipos gerados.
  const rpc = (await supabase.rpc("app_access_status" as never, { _email: email } as never)) as { data: unknown; error: unknown };
  if (!rpc.error && typeof rpc.data === "string" && RPC_STATUS[rpc.data]) return RPC_STATUS[rpc.data];

  const { data } = await supabase
    .from("approved_emails")
    .select("id, bloqueado, expires_at")
    .eq("email", email)
    .maybeSingle();
  if (!data) return "notApproved";
  if (data.bloqueado) return "blocked";
  if (data.expires_at && new Date(data.expires_at) < new Date()) return "expired";
  return "ok";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (AUTH_MODE === "email") {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) setEmail(saved);
      setLoading(false);
      return;
    }

    let active = true;
    const applySession = async (sessionEmail: string | null | undefined) => {
      if (!sessionEmail) {
        if (active) setEmail(null);
        return;
      }
      const normalized = sessionEmail.trim().toLowerCase();
      const status = await checkAccess(normalized);
      if (!active) return;
      if (status === "ok") {
        localStorage.setItem(AUTH_KEY, normalized);
        setEmail(normalized);
      } else {
        localStorage.removeItem(AUTH_KEY);
        setEmail(null);
        await supabase.auth.signOut();
      }
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
    const status = await checkAccess(normalizedEmail);
    if (status !== "ok") return { error: status };

    if (AUTH_MODE === "password") {
      if (!password) return { error: "passwordEmpty" };
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) return { error: "invalidCredentials" };
      // onAuthStateChange(SIGNED_IN) confere de novo a liberação e grava o e-mail.
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

    localStorage.setItem(AUTH_KEY, normalizedEmail);
    setEmail(normalizedEmail);
    return { error: null };
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setEmail(null);
    if (AUTH_MODE !== "email") void supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ email, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
