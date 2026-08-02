import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import "./WorkspaceDesign.css";

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
  const { t } = useTranslation();
  const [titulo, setTitulo] = useState("");
  const [textoBase, setTextoBase] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState("");
  const [tempoIdx, setTempoIdx] = useState([2]);
  const [resultado, setResultado] = useState<EsbocoResult | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [conteudoEditavel, setConteudoEditavel] = useState("");
  const { callAi, loading } = useAi();

  const temas = [t("garimpo.suggestionAnxiety"), t("mural.categoryFamily"), t("garimpo.suggestionFaith"), t("garimpo.suggestionLove"), t("garimpo.suggestionHope"), t("garimpo.suggestionForgiveness"), t("workspace.holiness"), t("workspace.missions")];
  const tipos = t("workspace.types", { returnObjects: true }) as string[];
  const journeySteps = t("workspace.journey.steps", { returnObjects: true }) as string[];

  const minutos = sliderToMinutes(tempoIdx[0]);

  const handleGenerateAi = async () => {
    setResultado(null);
    setModoEdicao(false);
    const result = await callAi("gerar-esboco", { titulo, textoBase, tema, tipo, tempo: `${minutos} minutos` });
    if (result && typeof result === "object") {
      setResultado(result as unknown as EsbocoResult);
    }
  };

  const converterParaTexto = (r: EsbocoResult) => {
    let text = `${r.titulo}\n${r.texto_base}\n\n`;
    text += `${t("oficina.introduction").toUpperCase()}\n${r.introducao.gancho}\n${r.introducao.contextualizacao}\n\n`;
    r.pontos.forEach((p, i) => {
      text += `${i + 1}. ${p.titulo}\n${p.conteudo}\n${p.versiculos.join(", ")}\n\n`;
    });
    text += `${t("oficina.application").toUpperCase()}\n${r.aplicacao_pratica}\n\n`;
    text += `${t("oficina.conclusion").toUpperCase()}\n${r.conclusao}`;
    return text;
  };

  const handleCopiar = () => {
    if (!resultado) return;
    const texto = modoEdicao ? conteudoEditavel : converterParaTexto(resultado);
    navigator.clipboard.writeText(texto);
    toast({ title: t("oficina.copiedNotif"), description: t("oficina.copiedMessage") });
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
    if (resultado) { setConteudoEditavel(converterParaTexto(resultado)); setModoEdicao(true); }
  };

  const handleSave = (status: "rascunho" | "finalizado") => {
    const conteudo = modoEdicao ? conteudoEditavel : (resultado ? converterParaTexto(resultado) : "");
    const sermao = { titulo: resultado?.titulo || titulo, textoBase: resultado?.texto_base || textoBase, tema, tipo, conteudo, status, data: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem("fc-sermoes") || "[]");
    existing.push(sermao);
    localStorage.setItem("fc-sermoes", JSON.stringify(existing));
    setTitulo(""); setTextoBase(""); setTema(""); setTipo(""); setResultado(null); setModoEdicao(false);
    toast({ title: status === "rascunho" ? t("oficina.draftSaved") : t("oficina.sermonFinalized") });
  };

  return (
    <PageShell title={resultado || modoEdicao ? t("workspace.studio.title") : t("sidebar.oficina.title")}>
      <div className={`sermon-workflow ${resultado || modoEdicao ? "studio-active" : "journey-active"}`}>
        {!resultado && !modoEdicao && <>
          <div className="journey-rail">
            {journeySteps.map((step, index) => <div className={index === 0 ? "active" : ""} key={step}><span>{index + 1}</span><small>{step}</small></div>)}
          </div>
          <div className="journey-heading"><span>{t("workspace.journey.kicker")}</span><h2>{t("workspace.journey.title")}</h2><p>{t("oficina.description")}</p></div>
        </>}

        {!resultado && !modoEdicao && <div className="journey-form rounded-xl border border-border bg-card/50 p-5 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">{t("oficina.themeLabel")}</Label>
            <Input placeholder={t("oficina.themePlaceholder")} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">{t("oficina.verseLabel")}</Label>
            <Input placeholder={t("oficina.versePlaceholder")} value={textoBase} onChange={(e) => setTextoBase(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              {t("oficina.timeLabel", { minutes: minutos })}
            </Label>
            <Slider value={tempoIdx} onValueChange={setTempoIdx} min={0} max={tempoMarks.length - 1} step={1} className="w-full" />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              {tempoMarks.map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={tema} onValueChange={setTema}>
              <SelectTrigger><SelectValue placeholder={t("oficina.themePlaceholder")} /></SelectTrigger>
              <SelectContent>
                {temas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder={t("oficina.typePlaceholder")} /></SelectTrigger>
              <SelectContent>
                {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateAi} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? t("oficina.generating") : t("oficina.generateButton")}
          </Button>
        </div>}

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm">{t("common.loading")}</span>
          </div>
        )}

        {resultado && !loading && !modoEdicao && (
          <div className="studio-shell animate-fade-in">
            <aside className="studio-outline">
              <span className="studio-panel-label">{t("workspace.studio.message")}</span>
              <button className="active"><b>01</b>{t("oficina.introduction")}</button>
              {resultado.pontos.map((p, i) => <button key={p.titulo}><b>0{i + 2}</b>{p.titulo}</button>)}
              <button><b>0{resultado.pontos.length + 2}</b>{t("oficina.conclusion")}</button>
              <div className="studio-sources"><span>{t("workspace.studio.sources")}</span><p><BookOpen />{resultado.texto_base}</p><p><Lightbulb />{tema || tipo}</p></div>
            </aside>
            <div className="studio-document">
            <div className="text-center space-y-1">
              <h2 className="font-display text-2xl font-bold text-primary">{resultado.titulo}</h2>
              {resultado.texto_base && <p className="text-sm text-muted-foreground">{resultado.texto_base}</p>}
            </div>

            <SectionCard titulo={t("oficina.introduction")} icone={<BookOpen className="w-4 h-4 text-primary" />}>
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

            <SectionCard titulo={t("oficina.application")} icone={<Lightbulb className="w-4 h-4 text-primary" />}>
              <p>{resultado.aplicacao_pratica}</p>
            </SectionCard>

            <SectionCard titulo={t("oficina.conclusion")} icone={<MessageCircle className="w-4 h-4 text-primary" />}>
              <p>{resultado.conclusao}</p>
            </SectionCard>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopiar}>
                <Copy className="w-3.5 h-3.5" /> {t("oficina.copyButton")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                <Download className="w-3.5 h-3.5" /> {t("oficina.pdfButton")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTxt}>
                <FileText className="w-3.5 h-3.5" /> {t("oficina.txtButton")}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleEditar}>✏️ {t("oficina.editButton")}</Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => handleSave("rascunho")}>
                <Save className="w-4 h-4" /> {t("oficina.draftButton")}
              </Button>
              <Button className="flex-1" onClick={() => handleSave("finalizado")}>{t("oficina.finalButton")}</Button>
            </div>
            </div>
            <aside className="studio-assistant">
              <div className="studio-assistant-title"><Sparkles /> <strong>{t("workspace.studio.assistant")}</strong></div>
              <span>{t("workspace.studio.working")}</span>
              <h3>{resultado.pontos[0]?.titulo || resultado.titulo}</h3>
              <p>{t("workspace.studio.help")}</p>
              <button><Sparkles /> {t("workspace.studio.develop")}</button>
              <button><BookOpen /> {t("workspace.studio.supportTexts")}</button>
              <button><Lightbulb /> {t("workspace.studio.illustration")}</button>
              <button onClick={handleEditar}>✏️ {t("workspace.studio.fullEditor")}</button>
            </aside>
          </div>
        )}

        {modoEdicao && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <Textarea className="min-h-[400px]" value={conteudoEditavel} onChange={(e) => setConteudoEditavel(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopiar}>
                <Copy className="w-3.5 h-3.5" /> {t("oficina.copyButton")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                <Download className="w-3.5 h-3.5" /> {t("oficina.pdfButton")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTxt}>
                <FileText className="w-3.5 h-3.5" /> {t("oficina.txtButton")}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setModoEdicao(false)}>← {t("oficina.backButton")}</Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => handleSave("rascunho")}>
                <Save className="w-4 h-4" /> {t("oficina.draftButton")}
              </Button>
              <Button className="flex-1" onClick={() => handleSave("finalizado")}>{t("oficina.finalButton")}</Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default OficinaPage;
