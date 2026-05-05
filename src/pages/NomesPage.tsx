import { useState } from "react";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, BookOpen, Globe } from "lucide-react";
import { useAi } from "@/hooks/use-ai";

interface NomeResultado {
  significado_geral: string;
  hebraico?: { original: string; transliteracao: string; significado: string };
  aramaico?: { original: string; transliteracao: string; significado: string };
  grego?: { original: string; transliteracao: string; significado: string };
  latim?: { original: string; transliteracao: string; significado: string };
  etimologia: string;
  historia: string;
  
  variacoes: string[];
}

const LinguaCard = ({ titulo, dados, cor }: { titulo: string; dados: { original: string; transliteracao: string; significado: string }; cor: string }) => (
  <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
    <h3 className={`font-display font-bold text-sm ${cor}`}>{titulo}</h3>
    <p className="text-foreground text-lg font-medium">
      {dados.original} <span className="text-muted-foreground">({dados.transliteracao})</span>
    </p>
    <p className="text-sm text-muted-foreground">{dados.significado}</p>
  </div>
);

const SectionCard = ({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
    <div className="flex items-center gap-2">
      {icone}
      <h3 className="font-display font-bold text-sm text-primary">{titulo}</h3>
    </div>
    <div className="text-sm text-foreground leading-relaxed">{children}</div>
  </div>
);

const NomesPage = () => {
  const [nome, setNome] = useState("");
  const [nomePesquisado, setNomePesquisado] = useState("");
  const [resultado, setResultado] = useState<NomeResultado | null>(null);
  const { callAi, loading } = useAi();

  const pesquisar = async () => {
    if (!nome.trim()) return;
    setNomePesquisado(nome.trim());
    setResultado(null);
    const result = await callAi("nomes", { nome: nome.trim() });
    if (result && typeof result === "object") {
      setResultado(result as unknown as NomeResultado);
    } else if (typeof result === "string") {
      // fallback: try parsing if string
      try {
        setResultado(JSON.parse(result));
      } catch {
        setResultado(null);
      }
    }
  };

  return (
    <PageShell title="Significado de Nomes">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Digite um nome ou palavra e descubra seu significado no hebraico, grego, aramaico e latim, além da etimologia e história bíblica.
        </p>
        {/* Search */}
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Palavra ou Nome</p>
          <div className="flex gap-2">
            <Input
              placeholder="Digite um nome..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pesquisar()}
              className="flex-1"
            />
            <Button onClick={pesquisar} disabled={loading || !nome.trim()} className="gap-2 px-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm">Pesquisando significado de <strong className="text-primary">{nomePesquisado}</strong>...</span>
          </div>
        )}

        {resultado && !loading && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="font-display text-2xl font-bold text-primary">{nomePesquisado}</h2>
              <p className="text-sm text-muted-foreground italic">"{resultado.significado_geral}"</p>
            </div>

            <h3 className="font-display font-bold text-primary text-base mt-2">Resultado da Tradução</h3>

            {/* Language cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resultado.hebraico && (
                <LinguaCard titulo="Hebraico" dados={resultado.hebraico} cor="text-primary" />
              )}
              {resultado.grego && (
                <LinguaCard titulo="Grego" dados={resultado.grego} cor="text-primary" />
              )}
              {resultado.aramaico && (
                <LinguaCard titulo="Aramaico" dados={resultado.aramaico} cor="text-primary" />
              )}
              {resultado.latim && (
                <LinguaCard titulo="Latim" dados={resultado.latim} cor="text-primary" />
              )}
            </div>

            {/* Etimologia */}
            <SectionCard titulo="Etimologia" icone={<BookOpen className="w-4 h-4 text-primary" />}>
              <p>{resultado.etimologia}</p>
            </SectionCard>

            {/* História */}
            <SectionCard titulo="História do Nome" icone={<Globe className="w-4 h-4 text-primary" />}>
              <p>{resultado.historia}</p>
            </SectionCard>


            {/* Variações */}
            {resultado.variacoes && resultado.variacoes.length > 0 && (
              <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
                <h3 className="font-display font-bold text-sm text-primary">Variações do Nome</h3>
                <div className="flex flex-wrap gap-2">
                  {resultado.variacoes.map((v, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default NomesPage;
