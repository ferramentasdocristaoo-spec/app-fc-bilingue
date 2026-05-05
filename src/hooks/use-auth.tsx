import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  email: string | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AUTH_KEY = "fc-sermon-auth-email";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) setEmail(saved);
    setLoading(false);
  }, []);

  const signIn = async (inputEmail: string) => {
    const normalizedEmail = inputEmail.trim().toLowerCase();

    const { data } = await supabase
      .from("approved_emails")
      .select("id, bloqueado")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!data) {
      return { error: "Este e-mail ainda não foi liberado. Aguarde a confirmação da sua compra." };
    }

    if ((data as any).bloqueado) {
      return { error: "Este e-mail está bloqueado. Entre em contato com o suporte." };
    }

    localStorage.setItem(AUTH_KEY, normalizedEmail);
    setEmail(normalizedEmail);
    return { error: null };
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setEmail(null);
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
