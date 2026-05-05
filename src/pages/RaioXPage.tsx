import { useState } from "react";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, BookOpen, BookText, Globe, Lightbulb } from "lucide-react";
import { useAi } from "@/hooks/use-ai";

interface RaioXResult {
  referencia: string;
  versoes: { sigla: string; texto: string }[];
  palavras_chave: { palavra: string; original: string; transliteracao: string; significado: string }[];
  contexto_historico: string;
  contexto_literario: string;
  aplicacao: string;
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

const RaioXPage = () => {
  const [referencia, setReferencia] = useState("");
  const [refPesquisada, setRefPesquisada] = useState("");
  const [resultado, setResultado] = useState<RaioXResult | null>(null);
  const { callAi, loading } = useAi();

  const buscar = async () => {
    if (!referencia.trim()) return;
    setRefPesquisada(referencia.trim());
    setResultado(null);
    const result = await callAi("raio-x", { referencia: referencia.trim() });
    if (result && typeof result === "object") {
      setResultado(result as unknown as RaioXResult);
    }
  };

  return (
    <PageShell title="Raio-X do Versículo">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Digite uma referência bíblica (ex: João 3:16) e receba uma análise profunda com comparação de versões, palavras no original (hebraico/grego), contexto histórico e aplicação teológica.
        </p>
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Referência Bíblica</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: João 3:16"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <Button onClick={buscar} disabled={loading || !referencia.trim()} className="gap-2 px-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm">Analisando <strong className="text-primary">{refPesquisada}</strong>...</span>
          </div>
        )}

        {resultado && !loading && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-primary">{resultado.referencia}</h2>
            </div>

            {/* Versões */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-primary text-base">Comparativo de Versões</h3>
              {resultado.versoes.map((v, i) => (
                <div key={i} className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
                  <h4 className="font-display font-bold text-xs text-primary">{v.sigla}</h4>
                  <p className="text-sm text-foreground italic">"{v.texto}"</p>
                </div>
              ))}
            </div>

            {/* Palavras-chave */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-primary text-base">Palavras-Chave no Original</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultado.palavras_chave.map((p, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
                    <h4 className="font-display font-bold text-sm text-primary">{p.palavra}</h4>
                    <p className="text-foreground text-base font-medium">
                      {p.original} <span className="text-muted-foreground text-sm">({p.transliteracao})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{p.significado}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contexto Histórico */}
            <SectionCard titulo="Contexto Histórico" icone={<Globe className="w-4 h-4 text-primary" />}>
              <p>{resultado.contexto_historico}</p>
            </SectionCard>

            {/* Contexto Literário */}
            <SectionCard titulo="Contexto Literário" icone={<BookText className="w-4 h-4 text-primary" />}>
              <p>{resultado.contexto_literario}</p>
            </SectionCard>

            {/* Aplicação */}
            <SectionCard titulo="Aplicação Teológica" icone={<Lightbulb className="w-4 h-4 text-primary" />}>
              <p>{resultado.aplicacao}</p>
            </SectionCard>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default RaioXPage;
