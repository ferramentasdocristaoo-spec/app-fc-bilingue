import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { ToolError, ToolWait } from "@/components/ToolKit";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAi } from "@/hooks/use-ai";
import { toast } from "@/hooks/use-toast";
import { copySermonText, downloadSermonTxt, printSermon } from "@/lib/sermon-export";
import "./WorkspaceDesign.css";
import "./OficinaTrilha.css";

const tempoMarks = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const duracoesPadrao = [15, 30, 45, 60];

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

type Saved = {
  titulo: string;
  textoBase: string;
  tema: string;
  tipo: string;
  tempoIdx: number[];
  resultado: EsbocoResult | null;
  conteudoEditavel: string;
  modoEdicao: boolean;
};

function readSaved(): Partial<Saved> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const OficinaPage = () => {
  const { t, i18n } = useTranslation();
  const [saved] = useState(readSaved);
  const [titulo, setTitulo] = useState(saved.titulo ?? "");
  const [textoBase, setTextoBase] = useState(saved.textoBase ?? "");
  const [tema, setTema] = useState(saved.tema ?? "");
  const [tipo, setTipo] = useState(saved.tipo ?? "");
  const [tempoIdx, setTempoIdx] = useState(saved.tempoIdx ?? [2]); // padrão 15 min (idx 2)
  const [resultado, setResultado] = useState<EsbocoResult | null>(saved.resultado ?? null);
  const [modoEdicao, setModoEdicao] = useState(saved.modoEdicao ?? false);
  const [conteudoEditavel, setConteudoEditavel] = useState(saved.conteudoEditavel ?? "");
  const [faltaTema, setFaltaTema] = useState(false);
  const temaRef = useRef<HTMLInputElement>(null);
  const { callAi, loading, failed } = useAi();

  // "Trazer das outras etapas": dados reais persistidos
  const dadosTrazidos = useMemo(() => {
    const itens: { id: string; texto: string; tag: string; checked: boolean }[] = [];
    try {
      const sermoes = JSON.parse(localStorage.getItem("fc-sermoes") || "[]");
      const ultimo = Array.isArray(sermoes) ? sermoes.at(-1) : null;
      if (ultimo?.textoBase?.trim()) {
        itens.push({
          id: "passagem",
          texto: ultimo.textoBase.trim(),
          tag: t("sidebar.biblia.title"),
          checked: true,
        });
      }
    } catch { /* vazio */ }
    return itens;
  }, [t]);

  const [trazidosChecked, setTrazidosChecked] = useState<Record<string, boolean>>({
    passagem: true,
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({
          titulo,
          textoBase,
          tema,
          tipo,
          tempoIdx,
          resultado,
          conteudoEditavel,
          modoEdicao,
        } satisfies Saved)
      );
    } catch {
      /* armazenamento indisponível */
    }
  }, [titulo, textoBase, tema, tipo, tempoIdx, resultado, conteudoEditavel, modoEdicao]);

  const temas = [
    t("garimpo.suggestionAnxiety"),
    t("mural.categoryFamily"),
    t("garimpo.suggestionFaith"),
    t("garimpo.suggestionLove"),
    t("garimpo.suggestionHope"),
    t("garimpo.suggestionForgiveness"),
    t("workspace.holiness"),
    t("workspace.missions"),
  ];

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
    const result = await callAi("gerar-esboco", {
      titulo,
      textoBase,
      tema,
      tipo,
      tempo: `${minutos} minutos`,
    });
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

  const textoAtual = () =>
    modoEdicao ? conteudoEditavel : resultado ? converterParaTexto(resultado) : "";
  const tituloAtual = () => resultado?.titulo || titulo;

  const handleCopiar = async () => {
    if (await copySermonText(textoAtual())) {
      toast({ title: t("oficina.copiedNotif"), description: t("oficina.copiedMessage") });
    } else {
      toast({
        title: t("common.error"),
        description: t("oficina.copyFailed"),
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = () => {
    const corpo = textoAtual().split("\n");
    const semCabecalho =
      corpo[0] === tituloAtual()
        ? corpo.slice(corpo[1] === (resultado?.texto_base ?? "") ? 2 : 1).join("\n")
        : corpo.join("\n");
    if (
      printSermon(
        tituloAtual(),
        resultado?.texto_base ?? textoBase,
        semCabecalho,
        i18n.resolvedLanguage || i18n.language
      )
    ) {
      toast({ title: t("oficina.pdfButton"), description: t("oficina.exportPrintHint") });
    } else {
      toast({
        title: t("common.error"),
        description: t("oficina.popupBlocked"),
        variant: "destructive",
      });
    }
  };

  const irPara = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleEditar = () => {
    if (resultado) {
      setConteudoEditavel(converterParaTexto(resultado));
      setModoEdicao(true);
    }
  };

  const handleSave = (status: "rascunho" | "finalizado") => {
    const sermao = {
      titulo: tituloAtual(),
      textoBase: resultado?.texto_base || textoBase,
      tema,
      tipo,
      conteudo: textoAtual(),
      status,
      data: new Date().toISOString(),
    };
    let existing: unknown[] = [];
    try {
      existing = JSON.parse(localStorage.getItem("fc-sermoes") || "[]");
    } catch {
      /* lista recomeça */
    }
    existing.push(sermao);
    localStorage.setItem("fc-sermoes", JSON.stringify(existing));
    setTitulo("");
    setTextoBase("");
    setTema("");
    setTipo("");
    setResultado(null);
    setModoEdicao(false);
    setConteudoEditavel("");
    toast({
      title: status === "rascunho" ? t("oficina.draftSaved") : t("oficina.sermonFinalized"),
    });
  };

  const exportar = (
    <div className="studio-export">
      <button type="button" onClick={handleCopiar}>
        {t("oficina.copyButton")}
      </button>
      <button type="button" onClick={handleDownloadPdf}>
        {t("oficina.pdfButton")}
      </button>
      <button
        type="button"
        onClick={() => downloadSermonTxt(tituloAtual(), textoAtual())}
      >
        {t("oficina.txtButton")}
      </button>
    </div>
  );

  const guardar = (
    <div className="studio-save">
      <button
        type="button"
        className="ed-btn ed-btn-ghost"
        onClick={() => handleSave("rascunho")}
      >
        {t("oficina.saveDraft")}
      </button>
      <button
        type="button"
        className="ed-btn ed-btn-primary"
        onClick={() => handleSave("finalizado")}
      >
        {t("oficina.finish")}
      </button>
    </div>
  );

  // Bloco "Trazer das outras etapas"
  const blocoTrazer = (
    <div className="oficina-from-card">
      <div className="oficina-from-head">
        <span>{t("oficina.fromOtherStages")}</span>
      </div>
      {dadosTrazidos.length > 0 ? (
        <div className="oficina-from-list">
          {dadosTrazidos.map((item) => {
            const isChecked = trazidosChecked[item.id] ?? false;
            return (
              <label
                key={item.id}
                className="oficina-from-item"
                onClick={() => {
                  const next = !isChecked;
                  setTrazidosChecked((prev) => ({ ...prev, [item.id]: next }));
                  if (item.id === "passagem") {
                    setTextoBase(next ? item.texto : "");
                  }
                }}
              >
                <span className={`oficina-checkbox ${isChecked ? "is-checked" : ""}`}>
                  {isChecked && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="oficina-from-text">{item.texto}</span>
                <span className="oficina-from-tag">{item.tag}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="oficina-from-empty">
          Nenhuma nota de etapas anteriores guardada nesta semana. Os versículos e estudos que
          fizer na Bíblia e no Raio-X aparecerão aqui automaticamente.
        </div>
      )}
    </div>
  );

  return (
    <div className="oficina-trilha">
      {/* Cabeçalho ‹ Oficina de Sermões */}
      <header className="oficina-head">
        <Link to="/" className="oficina-back-link">
          <ChevronLeft />
          <span>{emEstudio ? t("workspace.studio.title") : t("sidebar.oficina.title")}</span>
        </Link>
      </header>

      {/* Faixa das 3 etapas arredondada */}
      <nav className="oficina-stages" aria-label={t("home.stagesLabel")}>
        <ol>
          <li>
            <Link to="/oficina" className="is-active" aria-current="step">
              <i>1</i>
              <span>{t("workspace.groups.preparation")}</span>
            </Link>
          </li>
          <li>
            <Link to="/raio-x">
              <i>2</i>
              <span>{t("workspace.groups.study")}</span>
            </Link>
          </li>
          <li>
            <Link to="/devocional">
              <i>3</i>
              <span>{t("workspace.groups.life")}</span>
            </Link>
          </li>
        </ol>
      </nav>

      {!resultado && !modoEdicao && !loading && (
        <div className="oficina-grid">
          {/* Coluna do Formulário */}
          <form
            className="oficina-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleGenerateAi();
            }}
          >
            {/* Campo: Tema */}
            <div className="oficina-field">
              <label className="oficina-field-label" htmlFor="oficina-tema">
                <span>{t("oficina.themeShort")}</span>
                {faltaTema && (
                  <span className="text-red-500 font-normal text-xs">
                    {t("oficina.themeRequired")}
                  </span>
                )}
              </label>
              <input
                ref={temaRef}
                id="oficina-tema"
                className="oficina-input"
                placeholder={t("oficina.themeInputPlaceholder")}
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  if (event.target.value.trim()) setFaltaTema(false);
                }}
                aria-invalid={faltaTema}
                required
              />
            </div>

            {/* Campo: Versículo / Passagem Base */}
            <div className="oficina-field">
              <label className="oficina-field-label" htmlFor="oficina-versiculo">
                <span>{t("oficina.verseLabel")}</span>
              </label>
              <input
                id="oficina-versiculo"
                className="oficina-input"
                placeholder={t("oficina.versePlaceholder")}
                value={textoBase}
                onChange={(event) => setTextoBase(event.target.value)}
              />
            </div>

            {/* Duração em segmentos arredondados */}
            <div className="oficina-field">
              <span className="oficina-field-label">{t("oficina.durationMinutes")}</span>
              <div
                className="oficina-segments"
                style={{ gridTemplateColumns: `repeat(${duracoesPadrao.length}, 1fr)` }}
              >
                {duracoesPadrao.map((d) => {
                  const isCurrent = minutos === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`oficina-segments-btn ${isCurrent ? "is-active" : ""}`}
                      onClick={() => {
                        const idx = tempoMarks.indexOf(d);
                        if (idx !== -1) setTempoIdx([idx]);
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipo de esboço em segmentos arredondados */}
            {Array.isArray(tipos) && tipos.length > 0 && (
              <div className="oficina-field">
                <span className="oficina-field-label">{t("oficina.typeOptional")}</span>
                <div
                  className="oficina-segments"
                  style={{ gridTemplateColumns: `repeat(${Math.min(tipos.length, 3)}, 1fr)` }}
                >
                  {tipos.slice(0, 3).map((item) => {
                    const isCurrent = tipo === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`oficina-segments-btn ${isCurrent ? "is-active" : ""}`}
                        onClick={() => setTipo(isCurrent ? "" : item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assunto / Categoria */}
            <div className="oficina-field">
              <label className="oficina-field-label" id="oficina-assunto-label">
                <span>{t("oficina.subjectLabel")}</span>
              </label>
              <Select value={tema} onValueChange={setTema}>
                <SelectTrigger aria-labelledby="oficina-assunto-label" className="oficina-input min-h-[50px]">
                  <SelectValue placeholder={t("oficina.subjectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {temas.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {failed && <ToolError />}

            <button type="submit" className="oficina-submit-btn">
              <span>{failed ? t("common.retry") : t("oficina.buildOutline")}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          {/* Coluna Direita (Trazer das outras etapas) */}
          <aside className="oficina-sidebar">
            {blocoTrazer}
          </aside>
        </div>
      )}

      {loading && <ToolWait label={t("oficina.generating")} />}

      {resultado && !loading && !modoEdicao && (
        <div className="studio-shell">
          <nav className="studio-outline" aria-label={t("oficina.contents")}>
            <span className="ed-eyebrow">{t("oficina.contents")}</span>
            <ol>
              <li>
                <button type="button" onClick={() => irPara("sec-intro")}>
                  {t("oficina.introduction")}
                </button>
              </li>
              {resultado.pontos.map((p, i) => (
                <li key={p.titulo}>
                  <button type="button" onClick={() => irPara(`sec-ponto-${i}`)}>
                    {p.titulo}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => irPara("sec-aplicacao")}>
                  {t("oficina.application")}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => irPara("sec-conclusao")}>
                  {t("oficina.conclusion")}
                </button>
              </li>
            </ol>
            {exportar}
            <button
              type="button"
              className="ed-link"
              onClick={() => setResultado(null)}
            >
              {t("oficina.backToForm")}
            </button>
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
                <h3 className="studio-point">
                  <span className="ed-num" aria-hidden>
                    {ROMAN[i] ?? i + 1}
                  </span>
                  {p.titulo}
                </h3>
                <p>{p.conteudo}</p>
                {p.versiculos.length > 0 && (
                  <p className="studio-refs">{p.versiculos.join(" · ")}</p>
                )}
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
              <button type="button" className="ed-link" onClick={handleEditar}>
                {t("oficina.editFull")}
              </button>
              {guardar}
            </footer>
          </article>
        </div>
      )}

      {modoEdicao && !loading && (
        <div className="studio-editor">
          <div className="studio-editor-bar">
            <button
              type="button"
              className="ed-link"
              onClick={() => setModoEdicao(false)}
            >
              ← {t("oficina.backToSheet")}
            </button>
            {exportar}
          </div>
          <Textarea
            aria-label={t("oficina.editFull")}
            value={conteudoEditavel}
            onChange={(event) => setConteudoEditavel(event.target.value)}
          />
          {guardar}
        </div>
      )}
    </div>
  );
};

export default OficinaPage;
