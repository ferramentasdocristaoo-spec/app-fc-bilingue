import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Botão "Admin" no app (21/11/2026). Nada de e-mail fixo no front: quem decide é a tabela admin_users.
 *  - Com sessão Supabase (login por senha ou link mágico): RPC is_session_admin() — e-mail confirmado e em admin_users.
 *  - No login antigo (modo "email", sem sessão): o botão aparece neste aparelho depois que o painel foi aberto
 *    com e-mail + senha de admin uma vez (marca local abaixo). É só um atalho: o painel continua pedindo a senha
 *    (ou a sessão) para mostrar qualquer dado.
 */
export const ADMIN_LEMBRADO_KEY = "fc-admin-lembrado";

export function lembrarAdmin(email: string | null) {
  try {
    if (email) localStorage.setItem(ADMIN_LEMBRADO_KEY, email.trim().toLowerCase());
    else localStorage.removeItem(ADMIN_LEMBRADO_KEY);
  } catch { /* modo privado */ }
}

function adminLembrado(): string | null {
  try { return localStorage.getItem(ADMIN_LEMBRADO_KEY); } catch { return null; }
}

/** E-mail do admin da sessão Supabase, ou null. */
export async function emailAdminDaSessao(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data, error } = await supabase.rpc("session_admin_email" as never);
  if (error || typeof data !== "string" || !data) return null;
  return data;
}

export function useIsAdmin(email: string | null): boolean {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    let ativo = true;
    if (!email) { setAdmin(false); return; }
    const lembrado = adminLembrado();
    setAdmin(!!lembrado && lembrado === email.toLowerCase());
    emailAdminDaSessao()
      .then((e) => { if (ativo && e) setAdmin(true); })
      .catch(() => { /* sem rede: fica como está */ });
    return () => { ativo = false; };
  }, [email]);
  return admin;
}
