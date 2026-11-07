import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

type AiAction = "gerar-esboco" | "raio-x" | "devocional" | "garimpo" | "nomes";

export function useAi() {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  // Falha fica no estado: a própria tela mostra o aviso com "tentar de novo", junto do pedido.
  const [failed, setFailed] = useState(false);

  const callAi = async (action: AiAction, payload: Record<string, string>) => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action, payload: { ...payload, lang: i18n.language } },
      });

      if (error || data?.error) {
        setFailed(true);
        return null;
      }

      return data.result;
    } catch {
      setFailed(true);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callAi, loading, failed };
}
