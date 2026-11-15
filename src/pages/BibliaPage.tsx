import { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Volume2,
  Pause,
  Play,
  Square,
  Sparkles,
  Bookmark,
  Share2,
  Cross,
  BookOpen,
  Library,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolError } from "@/components/ToolKit";
import { toast } from "@/hooks/use-toast";
import { fetchBibleChapter } from "@/lib/content-api";
import { cleanBibleText } from "@/lib/bible-text";
import { DEFAULT_VERSION_BY_LANG, VERSIONS_BY_LANG, normalizeBibleLanguage } from "@/data/bible-versions";
import { FontSizeContext } from "@/hooks/use-font-size";
import "./BibliaDesign.css";

const SPEECH_LANG: Record<string, string> = {
  "pt-PT": "pt-PT",
  "pt-BR": "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  de: "de-DE",
};

const BOOKS = [
  { id: 1, name: "Gênesis", chapters: 50 },
  { id: 2, name: "Êxodo", chapters: 40 },
  { id: 3, name: "Levítico", chapters: 27 },
  { id: 4, name: "Números", chapters: 36 },
  { id: 5, name: "Deuteronômio", chapters: 34 },
  { id: 6, name: "Josué", chapters: 24 },
  { id: 7, name: "Juízes", chapters: 21 },
  { id: 8, name: "Rute", chapters: 4 },
  { id: 9, name: "1 Samuel", chapters: 31 },
  { id: 10, name: "2 Samuel", chapters: 24 },
  { id: 11, name: "1 Reis", chapters: 22 },
  { id: 12, name: "2 Reis", chapters: 25 },
  { id: 13, name: "1 Crônicas", chapters: 29 },
  { id: 14, name: "2 Crônicas", chapters: 36 },
  { id: 15, name: "Esdras", chapters: 10 },
  { id: 16, name: "Neemias", chapters: 13 },
  { id: 17, name: "Ester", chapters: 10 },
  { id: 18, name: "Jó", chapters: 42 },
  { id: 19, name: "Salmos", chapters: 150 },
  { id: 20, name: "Provérbios", chapters: 31 },
  { id: 21, name: "Eclesiastes", chapters: 12 },
  { id: 22, name: "Cantares", chapters: 8 },
  { id: 23, name: "Isaías", chapters: 66 },
  { id: 24, name: "Jeremias", chapters: 52 },
  { id: 25, name: "Lamentações", chapters: 5 },
  { id: 26, name: "Ezequiel", chapters: 48 },
  { id: 27, name: "Daniel", chapters: 12 },
  { id: 28, name: "Oséias", chapters: 14 },
  { id: 29, name: "Joel", chapters: 3 },
  { id: 30, name: "Amós", chapters: 9 },
  { id: 31, name: "Obadias", chapters: 1 },
  { id: 32, name: "Jonas", chapters: 4 },
  { id: 33, name: "Miquéias", chapters: 7 },
  { id: 34, name: "Naum", chapters: 3 },
  { id: 35, name: "Habacuque", chapters: 3 },
  { id: 36, name: "Sofonias", chapters: 3 },
  { id: 37, name: "Ageu", chapters: 2 },
  { id: 38, name: "Zacarias", chapters: 14 },
  { id: 39, name: "Malaquias", chapters: 4 },
  { id: 40, name: "Mateus", chapters: 28 },
  { id: 41, name: "Marcos", chapters: 16 },
  { id: 42, name: "Lucas", chapters: 24 },
  { id: 43, name: "João", chapters: 21 },
  { id: 44, name: "Atos", chapters: 28 },
  { id: 45, name: "Romanos", chapters: 16 },
  { id: 46, name: "1 Coríntios", chapters: 16 },
  { id: 47, name: "2 Coríntios", chapters: 13 },
  { id: 48, name: "Gálatas", chapters: 6 },
  { id: 49, name: "Efésios", chapters: 6 },
  { id: 50, name: "Filipenses", chapters: 4 },
  { id: 51, name: "Colossenses", chapters: 4 },
  { id: 52, name: "1 Tessalonicenses", chapters: 5 },
  { id: 53, name: "2 Tessalonicenses", chapters: 3 },
  { id: 54, name: "1 Timóteo", chapters: 6 },
  { id: 55, name: "2 Timóteo", chapters: 4 },
  { id: 56, name: "Tito", chapters: 3 },
  { id: 57, name: "Filemom", chapters: 1 },
  { id: 58, name: "Hebreus", chapters: 13 },
  { id: 59, name: "Tiago", chapters: 5 },
  { id: 60, name: "1 Pedro", chapters: 5 },
  { id: 61, name: "2 Pedro", chapters: 3 },
  { id: 62, name: "1 João", chapters: 5 },
  { id: 63, name: "2 João", chapters: 1 },
  { id: 64, name: "3 João", chapters: 1 },
  { id: 65, name: "Judas", chapters: 1 },
  { id: 66, name: "Apocalipse", chapters: 22 },
];

// Nomes em `biblia.groups.<chave>` nos 7 idiomas.
const GRUPOS_ESTANTE = [
  { chave: "pentateuch", testamento: "antigo", range: [1, 5] },
  { chave: "historical", testamento: "antigo", range: [6, 17] },
  { chave: "poetic", testamento: "antigo", range: [18, 22] },
  { chave: "majorProphets", testamento: "antigo", range: [23, 27] },
  { chave: "minorProphets", testamento: "antigo", range: [28, 39] },
  { chave: "gospelsActs", testamento: "novo", range: [40, 44] },
  { chave: "pauline", testamento: "novo", range: [45, 57] },
  { chave: "general", testamento: "novo", range: [58, 65] },
  { chave: "apocalypse", testamento: "novo", range: [66, 66] },
];

const CORES_VOLUMES = ["vol-navy", "vol-leather", "vol-blue", "vol-gold", "vol-bordeaux"];

interface Verse {
  pk: number;
  verse: number;
  text: string;
}

const BibliaPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fontCtx = useContext(FontSizeContext);
  const stepFontSize = (delta: 1 | -1) => fontCtx?.stepFontSize(delta);

  const lang = normalizeBibleLanguage(i18n.resolvedLanguage || i18n.language);
  // pt-BR tem as versões brasileiras (padrão ARA) e voz brasileira; "pt" sem região continua em pt-PT.
  const speechLang = SPEECH_LANG[i18n.resolvedLanguage || i18n.language] || SPEECH_LANG[lang] || "pt-PT";
  const versions = VERSIONS_BY_LANG[lang] || VERSIONS_BY_LANG["pt-PT"];
  const bookNames = (t("biblia.books", { returnObjects: true }) as string[]) || [];
  const requestedBookId = Number(searchParams.get("bookId") ?? searchParams.get("book"));
  const hasRequestedBook = requestedBookId >= 1 && requestedBookId <= 66;

  // Modo: Estante (66 livros) vs Leitura
  const modoInicial = searchParams.get("view") || (hasRequestedBook ? "leitor" : "estante");
  const [modo, setModo] = useState<"estante" | "leitor">(modoInicial as "estante" | "leitor");

  const [bookId, setBookId] = useState<number>(() => hasRequestedBook ? requestedBookId : 1);

  const [chapter, setChapter] = useState<number>(() => {
    const c = Number(searchParams.get("chapter"));
    return c >= 1 ? c : 1;
  });

  const [version, setVersion] = useState<string>(() => {
    const v = searchParams.get("version");
    if (v && versions.some((item) => item.id === v)) return v;
    return DEFAULT_VERSION_BY_LANG[lang] || versions[0]?.id || "ol";
  });

  // Trocou o idioma com a página aberta (Dock ou detecção por país)? Se a versão atual não existe na
  // lista nova (ex.: OL ao ir de pt-PT para pt-BR), volta para a padrão do idioma (ARA).
  useEffect(() => {
    if (!versions.some((item) => item.id === version)) {
      setVersion(DEFAULT_VERSION_BY_LANG[lang] || versions[0]?.id || "OL");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Busca e modal de capítulos na estante
  const [buscaEstante, setBuscaEstante] = useState("");
  const [livroModal, setLivroModal] = useState<typeof BOOKS[0] | null>(null);

  // Leitura por voz (TTS)
  const [lendo, setLendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [versoAtual, setVersoAtual] = useState<number | null>(null);
  const verseRefs = useRef<Record<number, HTMLElement | null>>({});

  const currentBook = BOOKS.find((b) => b.id === bookId) || BOOKS[0];
  const nomeLivro = (id: number) => bookNames[id - 1] || BOOKS.find((b) => b.id === id)?.name || "";

  // Guardar último lido
  useEffect(() => {
    try {
      localStorage.setItem("fc-biblia-ultimo", JSON.stringify({ bookId, chapter }));
    } catch { /* vazio */ }
  }, [bookId, chapter]);

  const ultimoLido = useMemo(() => {
    try {
      const data = JSON.parse(localStorage.getItem("fc-biblia-ultimo") || "null");
      if (data?.bookId && data?.chapter) {
        return {
          bookId: Number(data.bookId),
          chapter: Number(data.chapter),
          nome: `${nomeLivro(Number(data.bookId))} ${data.chapter}`,
        };
      }
    } catch { /* vazio */ }
    return { bookId: 1, chapter: 1, nome: `${nomeLivro(1)} 1` };
  }, [bookNames]);

  // Carregar versículos
  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await fetchBibleChapter({ version, bookId, chapter });
      if (Array.isArray(data)) {
        const cleaned = data.map((v: any) => ({
          pk: v.pk ?? v.verse,
          verse: v.verse,
          text: cleanBibleText(v.text),
        }));
        setVerses(cleaned);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [bookId, chapter, version]);

  useEffect(() => {
    if (modo === "leitor") {
      fetchChapter();
    }
  }, [modo, fetchChapter]);

  // Controle de áudio por voz
  const pararLeitura = useCallback(() => {
    window.speechSynthesis?.cancel();
    setLendo(false);
    setPausado(false);
    setVersoAtual(null);
  }, []);

  const iniciarLeitura = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth || verses.length === 0) return;
    synth.cancel();

    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang === speechLang);

    const inicio = selectedVerse ? verses.findIndex((v) => v.verse === selectedVerse) : 0;
    const fila = verses.slice(Math.max(0, inicio));
    fila.forEach((verso, idx) => {
      const fala = new SpeechSynthesisUtterance(verso.text);
      fala.lang = speechLang;
      if (voice) fala.voice = voice;
      fala.rate = 0.95;
      fala.onstart = () => {
        setVersoAtual(verso.verse);
        verseRefs.current[verso.verse]?.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      if (idx === fila.length - 1) {
        fala.onend = () => {
          setLendo(false);
          setPausado(false);
          setVersoAtual(null);
        };
      }
      synth.speak(fala);
    });
    setLendo(true);
    setPausado(false);
  }, [verses, speechLang, selectedVerse]);

  const alternarLeitura = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (!lendo) return iniciarLeitura();
    if (pausado) {
      synth.resume();
      setPausado(false);
    } else {
      synth.pause();
      setPausado(true);
    }
  }, [lendo, pausado, iniciarLeitura]);

  useEffect(() => {
    pararLeitura();
  }, [version, bookId, chapter, pararLeitura]);

  const irTopo = () => {
    document.querySelector("main")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };

  const goToPrevChapter = () => {
    irTopo();
    setSelectedVerse(null);
    if (chapter > 1) {
      setChapter((c) => c - 1);
    } else if (bookId > 1) {
      const prevBook = BOOKS.find((b) => b.id === bookId - 1);
      if (prevBook) {
        setBookId(prevBook.id);
        setChapter(prevBook.chapters);
      }
    }
  };

  const goToNextChapter = () => {
    irTopo();
    setSelectedVerse(null);
    if (chapter < currentBook.chapters) {
      setChapter((c) => c + 1);
    } else if (bookId < 66) {
      const nextBook = BOOKS.find((b) => b.id === bookId + 1);
      if (nextBook) {
        setBookId(nextBook.id);
        setChapter(1);
      }
    }
  };

  // Ações do versículo tocado
  const versoSelecionadoObj = useMemo(
    () => verses.find((v) => v.verse === selectedVerse),
    [verses, selectedVerse]
  );
  const refVersiculo = `${nomeLivro(bookId)} ${chapter}:${selectedVerse || 1}`;

  const handleAcaoRaioX = () => {
    navigate(`/raio-x?ref=${encodeURIComponent(refVersiculo)}`);
  };

  const handleAcaoPregar = () => {
    try {
      localStorage.setItem(
        "fc-oficina-atual",
        JSON.stringify({
          textoBase: refVersiculo,
          titulo: "",
        })
      );
    } catch { /* vazio */ }
    toast({
      title: t("biblia.sentToWorkshop"),
      description: refVersiculo,
    });
    navigate("/oficina");
  };

  const handleAcaoGuardar = () => {
    try {
      const guardados = JSON.parse(localStorage.getItem("fc-versiculos-guardados") || "[]");
      guardados.push({
        ref: refVersiculo,
        texto: versoSelecionadoObj?.text || "",
        data: new Date().toISOString(),
      });
      localStorage.setItem("fc-versiculos-guardados", JSON.stringify(guardados));
      toast({
        title: t("biblia.savedFavorite"),
        description: refVersiculo,
      });
    } catch {
      toast({ title: t("biblia.saved"), description: refVersiculo });
    }
    setSelectedVerse(null);
  };

  const handleAcaoPartilhar = async () => {
    const shareText = `“${versoSelecionadoObj?.text || ""}” — ${refVersiculo}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: refVersiculo, text: shareText });
        return;
      } catch { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: t("biblia.copied"),
        description: refVersiculo,
      });
    } catch {
      toast({ title: t("biblia.copyError"), variant: "destructive" });
    }
    setSelectedVerse(null);
  };

  // Abrir livro a partir da estante
  const handleSelecionarLivro = (livro: typeof BOOKS[0]) => {
    if (livro.chapters === 1) {
      setBookId(livro.id);
      setChapter(1);
      setSelectedVerse(null);
      setModo("leitor");
    } else {
      setLivroModal(livro);
    }
  };

  return (
    <div className="biblia-container">
      {/* ----------------- MODO ESTANTE (66 LIVROS) ----------------- */}
      {modo === "estante" && (
        <div className="biblia-estante-view">
          <div className="estante-topo">
            <div className="estante-tabs">
              <button
                type="button"
                className={`estante-tab-btn ${modo === "estante" ? "is-active" : ""}`}
                onClick={() => setModo("estante")}
              >
                <Library size={16} className="inline mr-1" /> {t("biblia.shelfTab")}
              </button>
              <button
                type="button"
                className={`estante-tab-btn ${modo === "leitor" ? "is-active" : ""}`}
                onClick={() => setModo("leitor")}
              >
                <BookOpen size={16} className="inline mr-1" /> {t("biblia.readingTab")}
              </button>
            </div>

            <div className="estante-busca">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder={t("biblia.searchShelf")}
                aria-label={t("biblia.searchShelf")}
                value={buscaEstante}
                onChange={(e) => setBuscaEstante(e.target.value)}
              />
            </div>
          </div>

          {/* Cartão de Continuar Leitura */}
          {!buscaEstante && (
            <div
              className="estante-continuar-card"
              onClick={() => {
                setBookId(ultimoLido.bookId);
                setChapter(ultimoLido.chapter);
                setSelectedVerse(null);
                setModo("leitor");
              }}
            >
              <div>
                <span className="estante-continuar-kicker">{t("biblia.continueReading")}</span>
                <div className="estante-continuar-titulo">{ultimoLido.nome}</div>
              </div>
              <ChevronRight size={26} />
            </div>
          )}

          {/* Prateleiras agrupadas */}
          {GRUPOS_ESTANTE.map((grupo) => {
            const livrosDoGrupo = BOOKS.filter(
              (b) => b.id >= grupo.range[0] && b.id <= grupo.range[1]
            ).filter((b) => {
              if (!buscaEstante.trim()) return true;
              const nome = nomeLivro(b.id).toLowerCase();
              return nome.includes(buscaEstante.toLowerCase());
            });

            if (livrosDoGrupo.length === 0) return null;

            return (
              <section key={grupo.chave} className="estante-grupo">
                <div className="estante-grupo-header">
                  <span>{t(`biblia.groups.${grupo.chave}`)}</span>
                  <span className="estante-grupo-count">
                    {livrosDoGrupo.length === 1 ? t("biblia.volumeOne") : t("biblia.volumesMany", { count: livrosDoGrupo.length })}
                  </span>
                </div>

                <div className="estante-prateleira">
                  {livrosDoGrupo.map((b, idx) => {
                    const cor = CORES_VOLUMES[(b.id + idx) % CORES_VOLUMES.length];
                    return (
                      <div
                        key={b.id}
                        className={`estante-livro ${cor}`}
                        onClick={() => handleSelecionarLivro(b)}
                        title={t("biblia.bookChapters", { book: nomeLivro(b.id), count: b.chapters })}
                      >
                        <span className="estante-livro-nome">{nomeLivro(b.id)}</span>
                        <span className="estante-livro-caps">{t("biblia.chaptersShort", { count: b.chapters })}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Modal de escolha de capítulo */}
          {livroModal && (
            <div className="capitulos-modal" onClick={() => setLivroModal(null)}>
              <div className="capitulos-card" onClick={(e) => e.stopPropagation()}>
                <div className="capitulos-header">
                  <h3>{nomeLivro(livroModal.id)}</h3>
                  <button
                    type="button"
                    className="text-sm font-semibold text-muted-foreground"
                    onClick={() => setLivroModal(null)}
                  >
                    {t("common.close")}
                  </button>
                </div>
                <div className="capitulos-grid">
                  {Array.from({ length: livroModal.chapters }, (_, i) => i + 1).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="capitulo-btn"
                      onClick={() => {
                        setBookId(livroModal.id);
                        setChapter(c);
                        setSelectedVerse(null);
                        setLivroModal(null);
                        setModo("leitor");
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- MODO LEITURA (DIREÇÃO A) ----------------- */}
      {modo === "leitor" && (
        <div className="biblia-reading-view">
          {/* Pílulas arredondadas no topo */}
          <div className="biblia-top-pills">
            <button
              type="button"
              className="biblia-pill-btn"
              onClick={() => setModo("estante")}
            >
              <Library size={18} />
              <span>{nomeLivro(bookId)} {chapter}</span>
              <ChevronDown size={16} />
            </button>

            <Select
              value={version}
              onValueChange={(v) => {
                setVersion(v);
                setSelectedVerse(null);
              }}
            >
              <SelectTrigger className="biblia-pill-btn w-auto border-[1.5px] border-[#b9a77f] rounded-full px-4 h-[46px]">
                <SelectValue placeholder={t("biblia.versionLabel")} />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.id.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título grande serifado */}
          <h2 className="biblia-chapter-title">
            {nomeLivro(bookId)} {chapter}
          </h2>

          {/* Versículos */}
          {loading ? (
            <div className="ed-wait-lines" role="status" aria-label={t("common.loading")}>
              {Array.from({ length: 10 }).map((_, i) => (
                <i key={i} />
              ))}
            </div>
          ) : verses.length > 0 ? (
            <div className="biblia-verses-container" lang={lang}>
              {verses.map((v) => {
                const isSelected = selectedVerse === v.verse;
                const isReading = versoAtual === v.verse;
                return (
                  <p
                    key={v.pk}
                    ref={(el) => {
                      verseRefs.current[v.verse] = el;
                    }}
                    className={`biblia-verse-item ${isSelected ? "is-selected" : ""} ${isReading ? "is-reading" : ""}`}
                    onClick={() => setSelectedVerse(isSelected ? null : v.verse)}
                  >
                    <span className="biblia-verse-num">{v.verse}</span>
                    <span>{v.text}</span>
                  </p>
                );
              })}
            </div>
          ) : failed ? (
            <ToolError onRetry={fetchChapter}>{t("biblia.errorMessage")}</ToolError>
          ) : (
            <p className="ed-empty">{t("biblia.emptyState")}</p>
          )}

          {/* Barra flutuante escura arredondada quando o versículo é tocado (.a-pop) */}
          {selectedVerse && (
            <aside className="biblia-action-bar" role="dialog" aria-label={t("biblia.verseActions")}>
              <button
                type="button"
                className="biblia-action-btn"
                onClick={handleAcaoRaioX}
              >
                <Sparkles />
                <span>{t("biblia.actionXray")}</span>
              </button>
              <button
                type="button"
                className="biblia-action-btn"
                onClick={handleAcaoPregar}
              >
                <Cross />
                <span>{t("biblia.actionPreach")}</span>
              </button>
              <button
                type="button"
                className="biblia-action-btn"
                onClick={handleAcaoGuardar}
              >
                <Bookmark />
                <span>{t("biblia.actionSave")}</span>
              </button>
              <button
                type="button"
                className="biblia-action-btn"
                onClick={handleAcaoPartilhar}
              >
                <Share2 />
                <span>{t("biblia.actionShare")}</span>
              </button>
            </aside>
          )}

          {/* Pílula flutuante embaixo: ‹ Ouvir Aa › (.a-float) */}
          <nav className="biblia-bottom-pill" aria-label={t("biblia.readingNav")}>
            <button
              type="button"
              className="biblia-bottom-nav-btn"
              onClick={goToPrevChapter}
              title={t("biblia.prevChapter")}
              aria-label={t("biblia.prevChapter")}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="biblia-bottom-text-btn"
              onClick={alternarLeitura}
            >
              {!lendo ? <Volume2 size={18} /> : pausado ? <Play size={18} /> : <Pause size={18} />}
              <span>{!lendo ? t("biblia.listen") : pausado ? t("biblia.resume") : t("biblia.pause")}</span>
            </button>
            <button
              type="button"
              className="biblia-bottom-text-btn"
              onClick={() => stepFontSize(1)}
              title={t("biblia.textSize")}
              aria-label={t("biblia.textSize")}
            >
              <span>Aa</span>
            </button>
            <button
              type="button"
              className="biblia-bottom-nav-btn"
              onClick={goToNextChapter}
              title={t("biblia.nextChapter")}
              aria-label={t("biblia.nextChapter")}
            >
              <ChevronRight size={22} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default BibliaPage;
