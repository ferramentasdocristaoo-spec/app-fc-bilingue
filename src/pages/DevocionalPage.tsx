import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, BookOpen, MessageCircle } from "lucide-react";
import { useAi } from "@/hooks/use-ai";

interface DevocionalResult {
  titulo: string;
  leitura: string;
  versiculo_chave: string;
  meditacao: string;
  oracao: string;
}

const SectionCard = ({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
    <div className="flex items-center gap-2">
      {icone}
      <h3 className="font-display font-bold text-sm text-primary">{titulo}</h3>
    </div>
    <div className="text-sm text-foreground leading-relaxed">{children}</div>
  </div>
);

const DevocionalPage = () => {
  const { t } = useTranslation();
  const [tema, setTema] = useState("");
  const [resultado, setResultado] = useState<DevocionalResult | null>(null);
  const { callAi, loading } = useAi();

  const gerar = async () => {
    setResultado(null);
    const result = await callAi("devocional", { tema });
    if (result && typeof result === "object") {
      setResultado(result as unknown as DevocionalResult);
    }
  };

  return (
    <PageShell title={t("sidebar.devocional.title")}>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{t("devocional.description")}</p>

        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{t("devocional.label")}</p>
          <div className="flex gap-2">
            <Input
              placeholder={t("devocional.placeholder")}
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && gerar()}
            />
            <Button onClick={gerar} disabled={loading} className="gap-2 px-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm">{t("devocional.loading")}</span>
          </div>
        )}

        {resultado && !loading && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-display text-2xl font-bold text-primary">{resultado.titulo}</h2>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold text-sm text-primary">📖 {t("devocional.reading")}</h3>
              </div>
              <p className="text-lg font-display font-bold text-foreground">{resultado.leitura}</p>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center space-y-2">
              <p className="text-base text-foreground italic leading-relaxed">"{resultado.versiculo_chave}"</p>
            </div>

            <SectionCard titulo={`💭 ${t("devocional.meditation")}`} icone={<span />}>
              <p className="whitespace-pre-wrap">{resultado.meditacao}</p>
            </SectionCard>

            <SectionCard titulo={`🙏 ${t("devocional.prayer")}`} icone={<MessageCircle className="w-4 h-4 text-primary" />}>
              <p className="italic whitespace-pre-wrap">{resultado.oracao}</p>
            </SectionCard>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default DevocionalPage;
