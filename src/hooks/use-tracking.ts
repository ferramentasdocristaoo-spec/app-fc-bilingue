import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const TOOL_NAMES: Record<string, string> = {
  "/": "Início",
  "/oficina": "Oficina de Sermões",
  "/esbocos": "Esboços",
  "/raio-x": "Raio-X de Versículo",
  "/devocional": "Devocional Diário",
  "/nomes": "Significado de Nomes",
  "/garimpo": "Garimpo de Promessas",
  "/mural": "Mural de Oração",
  "/voz-de-deus": "Voz de Deus",
  "/pulpito": "Púlpito Compartilhado",
  "/biblia": "Bíblia",
};

export const usePageTracking = () => {
  const { pathname } = useLocation();
  const { email } = useAuth();

  useEffect(() => {
    if (!email) return;
    const tool = TOOL_NAMES[pathname];
    if (!tool) return;
    supabase.rpc("log_tool_usage", { _email: email, _tool: tool }).then(() => {});
  }, [pathname, email]);
};
