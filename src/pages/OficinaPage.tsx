import { useState } from "react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useAi } from "@/hooks/use-ai";
import { Sparkles, Save, Loader2, BookOpen, Lightbulb, MessageCircle, Copy, Download, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const temas = ["Salvação", "Família", "Fé", "Amor", "Esperança", "Graça", "Santidade", "Missões"];
const tipos = ["Expositivo", "Temático", "Textual"];

const tempoMarks = [5, 10, 15, 20, 30, 45, 60, 90, 120];

function sliderToMinutes(val: number): number {
  return tempoMarks[Math.min(val, tempoMarks.length - 1)];
}

interface EsbocoResult {
  titulo: string;
  texto_base: string;
  introducao: { gancho: string; contextualizacao: string };
  pontos: { titulo: string; conteudo: string; versiculos: string[] }[];
  aplicacao_pratica: string;
  conclusao: string;
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

const OficinaPage = () => {
  const [titulo, setTitulo] = useState("");
  const [textoBase, setTextoBase] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState("");
  const [tempoIdx, setTempoIdx] = useState([2]); // default 15min
  const [resultado, setResultado] = useState<EsbocoResult | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [conteudoEditavel, setConteudoEditavel] = useState("");
  const { callAi, loading } = useAi();

  const minutos = sliderToMinutes(tempoIdx[0]);

  const handleGenerateAi = async () => {
    setResultado(null);
    setModoEdicao(false);
    const result = await callAi("gerar-esboco", {
      titulo,
      textoBase,
      tema,
      tipo,
      tempo: `${minutos} minutos`,
    });
    if (result && typeof result === "object") {
      setResultado(result as unknown as EsbocoResult);
    }
  };

  const converterParaTexto = (r: EsbocoResult) => {
    let text = `${r.titulo}\n${r.texto_base}\n\n`;
    text += `INTRODUÇÃO\n${r.introducao.gancho}\n${r.introducao.contextualizacao}\n\n`;
    r.pontos.forEach((p, i) => {
      text += `${i + 1}. ${p.titulo}\n${p.conteudo}\nVersículos: ${p.versiculos.join(", ")}\n\n`;
    });
    text += `APLICAÇÃO PRÁTICA\n${r.aplicacao_pratica}\n\n`;
    text += `CONCLUSÃO\n${r.conclusao}`;
    return text;
  };

  const handleCopiar = () => {
    if (!resultado) return;
    const texto = modoEdicao ? conteudoEditavel : converterParaTexto(resultado);
    navigator.clipboard.writeText(texto);
    toast({ title: "Copiado!", description: "Sermão copiado para a área de transferência." });
  };

  const handleDownloadTxt = () => {
    if (!resultado) return;
    const texto = modoEdicao ? conteudoEditavel : converterParaTexto(resultado);
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resultado.titulo || "sermao"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!resultado) return;
    const texto = modoEdicao ? conteudoEditavel : converterParaTexto(resultado);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${resultado.titulo}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.7; color: #333; }
        h1 { text-align: center; color: #5C3D2E; }
        pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 14px; }
      </style></head>
      <body><h1>${resultado.titulo}</h1><pre>${texto}</pre></body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const handleEditar = () => {
    if (resultado) {
      setConteudoEditavel(converterParaTexto(resultado));
      setModoEdicao(true);
    }
  };

  const handleSave = (status: "rascunho" | "finalizado") => {
    const conteudo = modoEdicao ? conteudoEditavel : (resultado ? converterParaTexto(resultado) : "");
    const sermao = { titulo: resultado?.titulo || titulo, textoBase: resultado?.texto_base || textoBase, tema, tipo, conteudo, status, data: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem("fc-sermoes") || "[]");
    existing.push(sermao);
    localStorage.setItem("fc-sermoes", JSON.stringify(existing));
    setTitulo(""); setTextoBase(""); setTema(""); setTipo(""); setResultado(null); setModoEdicao(false);
    toast({ title: status === "rascunho" ? "Rascunho salvo!" : "Sermão finalizado!", description: "Seu sermão foi salvo com sucesso." });
  };

  return (
    <PageShell title="Oficina de Sermões">
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Preencha o tema, versículo base e estilo do sermão. O gerador criará um esboço completo com introdução, pontos, aplicação e conclusão. Depois você pode editar, copiar ou salvar.
        </p>
        {/* Form */}
        <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Tema do Sermão *</Label>
            <Input placeholder="Ex: O Amor de Deus" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Versículo Base (Opcional)</Label>
            <Input placeholder="Ex: João 3:16" value={textoBase} onChange={(e) => setTextoBase(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Tempo do Sermão: {minutos} minutos
            </Label>
            <Slider
              value={tempoIdx}
              onValueChange={setTempoIdx}
              min={0}
              max={tempoMarks.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              {tempoMarks.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={tema} onValueChange={setTema}>
              <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
              <SelectContent>
                {temas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder="Tipo de Esboço" /></SelectTrigger>
              <SelectContent>
                {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateAi} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Gerando..." : "Gerar Sermão"}
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm">Criando esboço...</span>
          </div>
        )}

        {resultado && !loading && !modoEdicao && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-display text-2xl font-bold text-primary">{resultado.titulo}</h2>
              {resultado.texto_base && (
                <p className="text-sm text-muted-foreground">{resultado.texto_base}</p>
              )}
            </div>

            <SectionCard titulo="Introdução" icone={<BookOpen className="w-4 h-4 text-primary" />}>
              <p className="font-medium mb-1">{resultado.introducao.gancho}</p>
              <p>{resultado.introducao.contextualizacao}</p>
            </SectionCard>

            {resultado.pontos.map((p, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
                <h3 className="font-display font-bold text-sm text-primary">{i + 1}. {p.titulo}</h3>
                <p className="text-sm text-foreground">{p.conteudo}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.versiculos.map((v, j) => (
                    <span key={j} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{v}</span>
                  ))}
                </div>
              </div>
            ))}

            <SectionCard titulo="Aplicação Prática" icone={<Lightbulb className="w-4 h-4 text-primary" />}>
              <p>{resultado.aplicacao_pratica}</p>
            </SectionCard>

            <SectionCard titulo="Conclusão e Apelo" icone={<MessageCircle className="w-4 h-4 text-primary" />}>
              <p>{resultado.conclusao}</p>
            </SectionCard>

            {/* Export & Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopiar}>
                <Copy className="w-3.5 h-3.5" /> Copiar
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTxt}>
                <FileText className="w-3.5 h-3.5" /> TXT
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleEditar}>
                ✏️ Editar
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => handleSave("rascunho")}>
                <Save className="w-4 h-4" /> Rascunho
              </Button>
              <Button className="flex-1" onClick={() => handleSave("finalizado")}>
                Finalizar
              </Button>
            </div>
          </div>
        )}

        {modoEdicao && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <Textarea
              className="min-h-[400px]"
              value={conteudoEditavel}
              onChange={(e) => setConteudoEditavel(e.target.value)}
            />
            {/* Export buttons in edit mode */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopiar}>
                <Copy className="w-3.5 h-3.5" /> Copiar
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTxt}>
                <FileText className="w-3.5 h-3.5" /> TXT
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setModoEdicao(false)}>
                ← Voltar
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => handleSave("rascunho")}>
                <Save className="w-4 h-4" /> Rascunho
              </Button>
              <Button className="flex-1" onClick={() => handleSave("finalizado")}>
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default OficinaPage;
