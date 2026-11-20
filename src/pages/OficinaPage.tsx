import { useEffect, useRef, useState, useMemo } from "react";
import { PROGRESS_KEY, guardarTrabalhoAberto, partesDoTexto, pedirArmazenamentoPersistente, readProgress, salvarSermao, type EsbocoResult, type OficinaProgress } from "@/lib/oficina-store";
import { partesParaTexto, resultadoParaPartes, textoParaPartes, type Parte } from "@/lib/sermon-parts";
import { montarDadosPdf } from "@/lib/pdf/dados-pdf";
import { baixarSermaoPdf, prepararPdf } from "@/lib/pdf/sermon-pdf-browser";
import FolhaPartes from "@/components/oficina/FolhaPartes";
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

const OficinaPage = () => {
  const { t, i18n } = useTranslation();
  const [saved] = useState(readProgress);
  const [titulo, setTitulo] = useState(saved.titulo ?? "");
  const [textoBase, setTextoBase] = useState(saved.textoBase ?? "");
  const [tema, setTema] = useState(saved.tema ?? "");
  const [tipo, setTipo] = useState(saved.tipo ?? "");
  const [tempoIdx, setTempoIdx] = useState(saved.tempoIdx ?? [2]); // padrão 15 min (idx 2)
  const [resultado, setResultado] = useState<EsbocoResult | null>(saved.resultado ?? null);
  const [modoEdicao, setModoEdicao] = useState(saved.modoEdicao ?? false);
  const [conteudoEditavel, setConteudoEditavel] = useState(saved.conteudoEditavel ?? "");
  // Esboço de Meus Esboços sendo continuado aqui: salvar substitui o mesmo item.
  const [origemData, setOrigemData] = useState<string | undefined>(saved.origemData);
  // Esboço em partes (folha editável). Trabalho salvo por versões antigas só tem `resultado`: deriva dele.
  const [partes, setPartes] = useState<Parte[] | null>(
    () => saved.partes ?? (saved.resultado ? resultadoParaPartes(saved.resultado) : null),
  );
  const [gerandoPdf, setGerandoPdf] = useState(false);
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
          origemData,
          partes,
        } satisfies OficinaProgress)
      );
    } catch {
      /* armazenamento indisponível */
    }
  }, [titulo, textoBase, tema, tipo, tempoIdx, resultado, conteudoEditavel, modoEdicao, origemData, partes]);

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
  const emEstudio = (partes || modoEdicao) && !loading;
  const idioma = i18n.resolvedLanguage || i18n.language;

  // Fontes e gerador do PDF carregados antes do toque (no iPhone o compartilhar exige resposta rápida).
  useEffect(() => {
    if (emEstudio) prepararPdf(idioma);
  }, [emEstudio, idioma]);

  const handleGenerateAi = async () => {
    if (!titulo.trim()) {
      setFaltaTema(true);
      temaRef.current?.focus();
      return;
    }
    setFaltaTema(false);
    setResultado(null);
    setPartes(null);
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
      setPartes(resultadoParaPartes(result as unknown as EsbocoResult));
      document.querySelector("main")?.scrollTo(0, 0);
      window.scrollTo(0, 0);
    }
  };

  const labels = {
    introduction: t("oficina.introduction"),
    application: t("oficina.application"),
    conclusion: t("oficina.conclusion"),
  };

  const tituloAtual = () => resultado?.titulo || titulo;
  const passagemAtual = () => resultado?.texto_base || textoBase;
  const textoAtual = () =>
    modoEdicao ? conteudoEditavel : partes ? partesParaTexto(tituloAtual(), passagemAtual(), partes, labels) : "";
  /** Partes que valem agora: as da folha, ou as lidas do texto corrido no modo "Editar texto". */
  const partesAtuais = (): Parte[] =>
    modoEdicao ? textoParaPartes(conteudoEditavel, labels, tituloAtual(), passagemAtual()) : partes ?? [];

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

  /** Imprimir pelo navegador: só se o PDF próprio falhar (ex.: fontes sem rede). */
  const imprimirReserva = () => {
    const corpo = textoAtual().split("\n");
    const semCabecalho =
      corpo[0] === tituloAtual()
        ? corpo.slice(corpo[1] === passagemAtual() ? 2 : 1).join("\n")
        : corpo.join("\n");
    if (!printSermon(tituloAtual(), passagemAtual(), semCabecalho, idioma)) {
      toast({ title: t("common.error"), description: t("oficina.popupBlocked"), variant: "destructive" });
    }
  };

  const handleDownloadPdf = async () => {
    if (gerandoPdf) return;
    setGerandoPdf(true);
    try {
      const entrega = await baixarSermaoPdf(
        montarDadosPdf({ titulo: tituloAtual(), passagem: passagemAtual(), partes: partesAtuais(), data: new Date(), idioma, t }),
      );
      if (entrega === "baixado") toast({ title: t("oficina.pdfReady"), description: t("oficina.pdfSaved") });
    } catch (erro) {
      console.error("PDF do sermão:", erro);
      toast({ title: t("common.error"), description: t("oficina.pdfFailed"), variant: "destructive" });
      imprimirReserva();
    } finally {
      setGerandoPdf(false);
    }
  };

  const irPara = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleEditar = () => {
    if (partes) {
      setConteudoEditavel(partesParaTexto(tituloAtual(), passagemAtual(), partes, labels));
      setModoEdicao(true);
    }
  };

  /** Do texto corrido de volta para a folha: o texto editado é lido em partes (nada se perde). */
  const handleVoltarFolha = () => {
    setPartes(textoParaPartes(conteudoEditavel, labels, tituloAtual(), passagemAtual()));
    setModoEdicao(false);
  };

  const limparOficina = () => {
    setTitulo("");
    setTextoBase("");
    setTema("");
    setTipo("");
    setResultado(null);
    setPartes(null);
    setModoEdicao(false);
    setConteudoEditavel("");
    setOrigemData(undefined);
  };

  const handleFechar = () => {
    guardarTrabalhoAberto(labels);
    limparOficina();
  };

  const handleSave = (status: "rascunho" | "finalizado") => {
    salvarSermao(
      {
        titulo: tituloAtual(),
        textoBase: passagemAtual(),
        tema,
        tipo,
        conteudo: textoAtual(),
        status,
        partes: modoEdicao ? partesDoTexto(conteudoEditavel, labels, tituloAtual(), passagemAtual()) : partes ?? undefined,
      },
      origemData,
    );
    void pedirArmazenamentoPersistente();
    limparOficina();
    toast({
      title: status === "rascunho" ? t("oficina.draftSaved") : t("oficina.sermonFinalized"),
    });
  };

  const exportar = (
    <div className="studio-export">
      <button type="button" onClick={handleCopiar}>
        {t("oficina.copyButton")}
      </button>
      <button type="button" onClick={handleDownloadPdf} disabled={gerandoPdf} aria-busy={gerandoPdf}>
        {gerandoPdf ? t("oficina.pdfPreparing") : t("oficina.pdfButton")}
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

      {!partes && !modoEdicao && !loading && (
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
                  <span className="text-red-500 font-normal text-sm">
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

      {partes && !loading && !modoEdicao && (
        <div className="studio-shell">
          <nav className="studio-outline" aria-label={t("oficina.contents")}>
            <span className="ed-eyebrow">{t("oficina.contents")}</span>
            <ol>
              {(() => {
                let n = -1;
                return partes.map((p) => {
                  const ehPonto = p.tipo === "ponto";
                  if (ehPonto) n += 1;
                  const alvo = ehPonto ? `sec-ponto-${n}` : p.tipo === "introducao" ? "sec-intro" : p.tipo === "aplicacao" ? "sec-aplicacao" : p.tipo === "conclusao" ? "sec-conclusao" : `sec-${p.id}`;
                  const nome = p.tipo === "introducao" ? labels.introduction : p.tipo === "aplicacao" ? labels.application : p.tipo === "conclusao" ? labels.conclusion : p.titulo;
                  if (!nome.trim()) return null;
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => irPara(alvo)}>
                        {nome}
                      </button>
                    </li>
                  );
                });
              })()}
            </ol>
            {exportar}
            {resultado && (
              <button
                type="button"
                className="ed-link"
                onClick={() => {
                  setResultado(null);
                  setPartes(null);
                }}
              >
                {t("oficina.backToForm")}
              </button>
            )}
            {!resultado && (
              <button type="button" className="ed-link" onClick={handleFechar}>
                {t("oficina.closeEditor")}
              </button>
            )}
          </nav>

          <article className="studio-document">
            <header>
              <h2 className="ed-result-title">{tituloAtual()}</h2>
              {passagemAtual() && <p>{passagemAtual()}</p>}
            </header>

            <FolhaPartes partes={partes} labels={labels} onChange={setPartes} />

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
            {/* Volta para a folha lendo o texto em partes; esboço aberto de Meus Esboços também pode ser fechado. */}
            <button type="button" className="ed-link" onClick={handleVoltarFolha}>
              ← {t("oficina.editInSheet")}
            </button>
            {!resultado && (
              <button type="button" className="ed-link" onClick={handleFechar}>
                {t("oficina.closeEditor")}
              </button>
            )}
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
