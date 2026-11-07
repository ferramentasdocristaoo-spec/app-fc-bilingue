import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AiAction = "gerar-esboco" | "raio-x" | "devocional" | "garimpo" | "nomes";

export function useAi() {
  const { i18n, t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const callAi = async (action: AiAction, payload: Record<string, string>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action, payload: { ...payload, lang: i18n.language } },
      });

      if (error) {
        toast({ title: t("common.error"), description: t("common.aiError"), variant: "destructive" });
        return null;
      }

      if (data?.error) {
        toast({ title: t("common.error"), description: t("common.aiError"), variant: "destructive" });
        return null;
      }

      return data.result;
    } catch (e) {
      toast({ title: t("common.error"), description: t("common.aiError"), variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callAi, loading };
}
