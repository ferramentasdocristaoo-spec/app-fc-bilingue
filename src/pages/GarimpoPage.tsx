import { useState } from "react";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, BookOpen } from "lucide-react";
import { useAi } from "@/hooks/use-ai";

interface GarimpoResult {
  tema: string;
  resumo: string;
  versiculos: { referencia: string; texto: string; aplicacao: string }[];
}

const categoriasSugeridas = ["Ansiedade", "Fé", "Força", "Amor", "Prosperidade", "Família", "Perdão", "Cura", "Sabedoria", "Esperança"];

const GarimpoPage = () => {
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<GarimpoResult | null>(null);
  const { callAi, loading } = useAi();

  const pesquisar = async (categoria: string) => {
    setBusca(categoria);
    setResultado(null);
    const result = await callAi("garimpo", { categoria });
    if (result && typeof result === "object") {
      setResultado(result as unknown as GarimpoResult);
    }
  };

  return (
    <PageShell title="Garimpo Bíblico">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pesquise um tema bíblico e receba versículos relevantes com explicação e aplicação prática. Use as sugestões ou digite seu próprio tema.
        </p>
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Tema para Busca</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: ansiedade, perdão, fé..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && busca.trim() && pesquisar(busca)}
            />
            <Button onClick={() => pesquisar(busca)} disabled={loading || !busca.trim()} className="gap-2 px-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {!resultado && !loading && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Sugestões</p>
            <div className="flex flex-wrap gap-2">
              {categoriasSugeridas.map((cat) => (
                <Button
                  key={cat}
                  variant="outline"
                  size="sm"
                  className="text-xs border-primary/20 hover:bg-primary/10"
                  onClick={() => pesquisar(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm">Garimpando versículos sobre <strong className="text-primary">{busca}</strong>...</span>
          </div>
        )}

        {resultado && !loading && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-display text-2xl font-bold text-primary">{resultado.tema}</h2>
              <p className="text-sm text-muted-foreground">{resultado.resumo}</p>
            </div>

            <h3 className="font-display font-bold text-primary text-base">Versículos Encontrados</h3>

            {resultado.versiculos.map((v, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <h4 className="font-display font-bold text-sm text-primary">{v.referencia}</h4>
                </div>
                <p className="text-sm text-foreground italic">"{v.texto}"</p>
                <p className="text-xs text-muted-foreground">{v.aplicacao}</p>
              </div>
            ))}

            <Button variant="ghost" size="sm" className="text-primary self-start" onClick={() => { setResultado(null); setBusca(""); }}>
              ← Nova busca
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default GarimpoPage;
