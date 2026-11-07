import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { ToolError, ToolWait } from "@/components/ToolKit";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAi } from "@/hooks/use-ai";
import { toast } from "@/hooks/use-toast";
import { copySermonText, downloadSermonTxt, printSermon } from "@/lib/sermon-export";
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

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const PROGRESS_KEY = "fc-oficina-atual";

type Saved = { titulo: string; textoBase: string; tema: string; tipo: string; tempoIdx: number[]; resultado: EsbocoResult | null; conteudoEditavel: string; modoEdicao: boolean };

function readSaved(): Partial<Saved> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const OficinaPage = () => {
  const { t, i18n } = useTranslation();
  // Um esboço custa uma consulta de IA: recarregar a página não pode jogá-lo fora.
  const [saved] = useState(readSaved);
  const [titulo, setTitulo] = useState(saved.titulo ?? "");
  const [textoBase, setTextoBase] = useState(saved.textoBase ?? "");
  const [tema, setTema] = useState(saved.tema ?? "");
  const [tipo, setTipo] = useState(saved.tipo ?? "");
  const [tempoIdx, setTempoIdx] = useState(saved.tempoIdx ?? [2]);
  const [resultado, setResultado] = useState<EsbocoResult | null>(saved.resultado ?? null);
  const [modoEdicao, setModoEdicao] = useState(saved.modoEdicao ?? false);
  const [conteudoEditavel, setConteudoEditavel] = useState(saved.conteudoEditavel ?? "");
  const [faltaTema, setFaltaTema] = useState(false);
  const temaRef = useRef<HTMLInputElement>(null);
  const { callAi, loading, failed } = useAi();

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ titulo, textoBase, tema, tipo, tempoIdx, resultado, conteudoEditavel, modoEdicao } satisfies Saved));
    } catch { /* armazenamento indisponível */ }
  }, [titulo, textoBase, tema, tipo, tempoIdx, resultado, conteudoEditavel, modoEdicao]);

  const temas = [t("garimpo.suggestionAnxiety"), t("mural.categoryFamily"), t("garimpo.suggestionFaith"), t("garimpo.suggestionLove"), t("garimpo.suggestionHope"), t("garimpo.suggestionForgiveness"), t("workspace.holiness"), t("workspace.missions")];
  const tipos = t("workspace.types", { returnObjects: true }) as string[];
  const minutos = sliderToMinutes(tempoIdx[0]);
  const emEstudio = (resultado || modoEdicao) && !loading;

  const handleGenerateAi = async () => {
    if (!titulo.trim()) {
      setFaltaTema(true);
      temaRef.current?.focus();
      return;
    }
    setFaltaTema(false);
    setResultado(null);
    setModoEdicao(false);
    const result = await callAi("gerar-esboco", { titulo, textoBase, tema, tipo, tempo: `${minutos} minutos` });
    if (result && typeof result === "object") {
      setResultado(result as unknown as EsbocoResult);
      document.querySelector("main")?.scrollTo(0, 0);
      window.scrollTo(0, 0);
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

  const textoAtual = () => (modoEdicao ? conteudoEditavel : resultado ? converterParaTexto(resultado) : "");
  const tituloAtual = () => resultado?.titulo || titulo;

  const handleCopiar = async () => {
    if (await copySermonText(textoAtual())) toast({ title: t("oficina.copiedNotif"), description: t("oficina.copiedMessage") });
    else toast({ title: t("common.error"), description: t("oficina.copyFailed"), variant: "destructive" });
  };

  const handleDownloadPdf = () => {
    // O texto já começa com título e referência quando vem do gerador: não repetir no corpo.
    const corpo = textoAtual().split("\n");
    const semCabecalho = corpo[0] === tituloAtual() ? corpo.slice(corpo[1] === (resultado?.texto_base ?? "") ? 2 : 1).join("\n") : corpo.join("\n");
    if (printSermon(tituloAtual(), resultado?.texto_base ?? textoBase, semCabecalho, i18n.resolvedLanguage || i18n.language)) {
      toast({ title: t("oficina.pdfButton"), description: t("oficina.exportPrintHint") });
    } else {
      toast({ title: t("common.error"), description: t("oficina.popupBlocked"), variant: "destructive" });
    }
  };

  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleEditar = () => {
    if (resultado) { setConteudoEditavel(converterParaTexto(resultado)); setModoEdicao(true); }
  };

  const handleSave = (status: "rascunho" | "finalizado") => {
    const sermao = { titulo: tituloAtual(), textoBase: resultado?.texto_base || textoBase, tema, tipo, conteudo: textoAtual(), status, data: new Date().toISOString() };
    let existing: unknown[] = [];
    try { existing = JSON.parse(localStorage.getItem("fc-sermoes") || "[]"); } catch { /* lista corrompida recomeça */ }
    existing.push(sermao);
    localStorage.setItem("fc-sermoes", JSON.stringify(existing));
    setTitulo(""); setTextoBase(""); setTema(""); setTipo(""); setResultado(null); setModoEdicao(false); setConteudoEditavel("");
    toast({ title: status === "rascunho" ? t("oficina.draftSaved") : t("oficina.sermonFinalized") });
  };

  const exportar = (
    <div className="studio-export">
      <button type="button" onClick={handleCopiar}>{t("oficina.copyButton")}</button>
      <button type="button" onClick={handleDownloadPdf}>{t("oficina.pdfButton")}</button>
      <button type="button" onClick={() => downloadSermonTxt(tituloAtual(), textoAtual())}>{t("oficina.txtButton")}</button>
    </div>
  );

  const guardar = (
    <div className="studio-save">
      <button type="button" className="ed-btn ed-btn-ghost" onClick={() => handleSave("rascunho")}>{t("oficina.saveDraft")}</button>
      <button type="button" className="ed-btn ed-btn-primary" onClick={() => handleSave("finalizado")}>{t("oficina.finish")}</button>
    </div>
  );

  return (
    <PageShell
      title={emEstudio ? t("workspace.studio.title") : t("sidebar.oficina.title")}
      lede={emEstudio ? t("oficina.unsaved") : t("oficina.description")}
      width={emEstudio ? "wide" : "read"}
    >
      {!resultado && !modoEdicao && !loading && (
        <form className="sheet-form" noValidate onSubmit={(event) => { event.preventDefault(); handleGenerateAi(); }}>
          <div className="sheet-field">
            <label className="sheet-numeral" htmlFor="oficina-tema"><span className="ed-num" aria-hidden>I</span>{t("oficina.themeLabel")}</label>
            <input
              ref={temaRef}
              id="oficina-tema"
              className="ed-field sheet-lead w-full px-1"
              placeholder={t("oficina.themeInputPlaceholder")}
              value={titulo}
              onChange={(event) => { setTitulo(event.target.value); if (event.target.value.trim()) setFaltaTema(false); }}
              aria-invalid={faltaTema}
              aria-describedby={faltaTema ? "oficina-tema-erro" : undefined}
              required
            />
            {faltaTema && <p id="oficina-tema-erro" className="ed-error" role="alert">{t("oficina.themeRequired")}</p>}
          </div>

          <div className="sheet-field">
            <label className="sheet-numeral" htmlFor="oficina-versiculo"><span className="ed-num" aria-hidden>II</span>{t("oficina.verseLabel")}</label>
            <input id="oficina-versiculo" className="ed-field sheet-lead w-full px-1" placeholder={t("oficina.versePlaceholder")} value={textoBase} onChange={(event) => setTextoBase(event.target.value)} />
          </div>

          <div className="sheet-field">
            <p className="sheet-numeral"><span className="ed-num" aria-hidden>III</span>{t("oficina.timeLabel", { minutes: minutos })}</p>
            <Slider value={tempoIdx} onValueChange={setTempoIdx} min={0} max={tempoMarks.length - 1} step={1} thumbLabel={t("oficina.durationName")} aria-valuetext={`${minutos}`} />
            <div className="sheet-marks" aria-hidden>{tempoMarks.map((m) => <span key={m}>{m}</span>)}</div>
          </div>

          <div className="sheet-field sheet-pair">
            <div>
              <p className="sheet-numeral" id="oficina-assunto"><span className="ed-num" aria-hidden>IV</span>{t("oficina.subjectLabel")}</p>
              <Select value={tema} onValueChange={setTema}>
                <SelectTrigger aria-labelledby="oficina-assunto"><SelectValue placeholder={t("oficina.subjectPlaceholder")} /></SelectTrigger>
                <SelectContent>{temas.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <p className="sheet-numeral" id="oficina-tipo"><span className="ed-num" aria-hidden>V</span>{t("oficina.typeOptional")}</p>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger aria-labelledby="oficina-tipo"><SelectValue placeholder={t("oficina.typeChoose")} /></SelectTrigger>
                <SelectContent>{tipos.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {failed && <ToolError />}
          <button type="submit" className="ed-btn ed-btn-primary sheet-submit">{failed ? t("common.retry") : t("oficina.generateButton")}</button>
        </form>
      )}

      {loading && <ToolWait label={t("oficina.generating")} />}

      {resultado && !loading && !modoEdicao && (
        <div className="studio-shell">
          <nav className="studio-outline" aria-label={t("oficina.contents")}>
            <span className="ed-eyebrow">{t("oficina.contents")}</span>
            <ol>
              <li><button type="button" onClick={() => irPara("sec-intro")}>{t("oficina.introduction")}</button></li>
              {resultado.pontos.map((p, i) => <li key={p.titulo}><button type="button" onClick={() => irPara(`sec-ponto-${i}`)}>{p.titulo}</button></li>)}
              <li><button type="button" onClick={() => irPara("sec-aplicacao")}>{t("oficina.application")}</button></li>
              <li><button type="button" onClick={() => irPara("sec-conclusao")}>{t("oficina.conclusion")}</button></li>
            </ol>
            {exportar}
            <button type="button" className="ed-link" onClick={() => setResultado(null)}>{t("oficina.backToForm")}</button>
          </nav>

          <article className="studio-document">
            <header>
              <h2 className="ed-result-title">{resultado.titulo}</h2>
              {resultado.texto_base && <p>{resultado.texto_base}</p>}
            </header>

            <section id="sec-intro">
              <h3 className="studio-eyebrow">{t("oficina.introduction")}</h3>
              <p className="studio-hook">{resultado.introducao.gancho}</p>
              <p>{resultado.introducao.contextualizacao}</p>
            </section>

            {resultado.pontos.map((p, i) => (
              <section key={i} id={`sec-ponto-${i}`}>
                <h3 className="studio-point"><span className="ed-num" aria-hidden>{ROMAN[i] ?? i + 1}</span>{p.titulo}</h3>
                <p>{p.conteudo}</p>
                {p.versiculos.length > 0 && <p className="studio-refs">{p.versiculos.join(" · ")}</p>}
              </section>
            ))}

            <section id="sec-aplicacao">
              <h3 className="studio-eyebrow">{t("oficina.application")}</h3>
              <p>{resultado.aplicacao_pratica}</p>
            </section>
            <section id="sec-conclusao">
              <h3 className="studio-eyebrow">{t("oficina.conclusion")}</h3>
              <p>{resultado.conclusao}</p>
            </section>

            <footer className="studio-footer">
              <button type="button" className="ed-link" onClick={handleEditar}>{t("oficina.editFull")}</button>
              {guardar}
            </footer>
          </article>
        </div>
      )}

      {modoEdicao && !loading && (
        <div className="studio-editor">
          <div className="studio-editor-bar">
            <button type="button" className="ed-link" onClick={() => setModoEdicao(false)}>← {t("oficina.backToSheet")}</button>
            {exportar}
          </div>
          <Textarea aria-label={t("oficina.editFull")} value={conteudoEditavel} onChange={(event) => setConteudoEditavel(event.target.value)} />
          {guardar}
        </div>
      )}
    </PageShell>
  );
};

export default OficinaPage;
