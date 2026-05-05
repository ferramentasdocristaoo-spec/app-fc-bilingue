import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AiAction = "gerar-esboco" | "raio-x" | "devocional" | "garimpo" | "nomes";

export function useAi() {
  const [loading, setLoading] = useState(false);

  const callAi = async (action: AiAction, payload: Record<string, string>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action, payload },
      });

      if (error) {
        toast({ title: "Erro", description: error.message || "Falha ao chamar a IA.", variant: "destructive" });
        return null;
      }

      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return null;
      }

      return data.result;
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível conectar com a IA.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callAi, loading };
}
