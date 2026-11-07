import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, BookOpen, BookText, Globe, Lightbulb } from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import { escapeHtml } from "@/lib/utils";

interface RaioXResult {
  referencia: string;
  versoes: { sigla: string; texto: string }[];
  palavras_chave: { palavra: string; original: string; transliteracao: string; significado: string }[];
  contexto_historico: string;
  contexto_literario: string;
  aplicacao: string;
}

const SectionCard = ({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) => (
  <div className="ed-panel">
    <div className="flex items-center gap-2">
      {icone}
      <h3 className="ed-panel-title">{titulo}</h3>
    </div>
    <div className="ed-panel-body">{children}</div>
  </div>
);

const RaioXPage = () => {
  const { t } = useTranslation();
  const [referencia, setReferencia] = useState("");
  const [refPesquisada, setRefPesquisada] = useState("");
  const [resultado, setResultado] = useState<RaioXResult | null>(null);
  const { callAi, loading } = useAi();

  const buscar = async () => {
    if (!referencia.trim()) return;
    setRefPesquisada(referencia.trim());
    setResultado(null);
    const result = await callAi("raio-x", { referencia: referencia.trim() });
    if (result && typeof result === "object") setResultado(result as unknown as RaioXResult);
  };

  return (
    <PageShell title={t("sidebar.raioX.title")}>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <p className="ed-lede">{t("raioX.description")}</p>

        <div className="ed-panel">
          <p className="text-sm text-muted-foreground font-medium">{t("raioX.label")}</p>
          <div className="flex gap-2">
            <Input placeholder={t("raioX.placeholder")} value={referencia} onChange={(e) => setReferencia(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscar()} />
            <Button onClick={buscar} disabled={loading || !referencia.trim()} className="gap-2 px-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm" dangerouslySetInnerHTML={{ __html: t("raioX.loading", { reference: `<strong class="text-primary">${escapeHtml(refPesquisada)}</strong>` }) }} />
          </div>
        )}

        {resultado && !loading && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
              <h2 className="ed-result-title">{resultado.referencia}</h2>
            </div>

            <div className="space-y-3">
              <h3 className="ed-section-title">{t("raioX.comparative")}</h3>
              {resultado.versoes.map((v, i) => (
                <div key={i} className="ed-panel">
                  <h4 className="ed-panel-title">{v.sigla}</h4>
                  <p className="ed-quote">"{v.texto}"</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="ed-section-title">{t("raioX.keywords")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultado.palavras_chave.map((p, i) => (
                  <div key={i} className="ed-panel">
                    <h4 className="ed-panel-title">{p.palavra}</h4>
                    <p className="text-foreground text-base font-medium">{p.original} <span className="text-muted-foreground text-sm">({p.transliteracao})</span></p>
                    <p className="text-xs text-muted-foreground">{p.significado}</p>
                  </div>
                ))}
              </div>
            </div>

            <SectionCard titulo={t("raioX.historical")} icone={<Globe className="w-4 h-4 text-primary" />}>
              <p>{resultado.contexto_historico}</p>
            </SectionCard>
            <SectionCard titulo={t("raioX.literary")} icone={<BookText className="w-4 h-4 text-primary" />}>
              <p>{resultado.contexto_literario}</p>
            </SectionCard>
            <SectionCard titulo={t("raioX.theological")} icone={<Lightbulb className="w-4 h-4 text-primary" />}>
              <p>{resultado.aplicacao}</p>
            </SectionCard>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default RaioXPage;
