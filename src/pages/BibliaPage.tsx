import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Pause, Play, Square, Volume2 } from "lucide-react";
import { ToolError } from "@/components/ToolKit";
import { toast } from "@/hooks/use-toast";
import PageShell from "@/components/PageShell";
import { fetchBibleChapter } from "@/lib/content-api";
import { cleanBibleText } from "@/lib/bible-text";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_VERSION_BY_LANG, VERSIONS_BY_LANG, normalizeBibleLanguage } from "@/data/bible-versions";

const SPEECH_LANG: Record<string, string> = {
  "pt-PT": "pt-PT",
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

interface Verse {
  pk: number;
  verse: number;
  text: string;
}

function isVerse(value: unknown): value is Verse {
  if (!value || typeof value !== "object") return false;
  const verse = value as Partial<Verse>;
  return typeof verse.pk === "number"
    && typeof verse.verse === "number"
    && typeof verse.text === "string";
}

const BibliaPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const lang = normalizeBibleLanguage(i18n.resolvedLanguage || i18n.language);
  const versions = VERSIONS_BY_LANG[lang];
  const [version, setVersion] = useState(() => {
    const requested = searchParams.get("version");
    return versions.some((v) => v.id === requested) ? requested! : DEFAULT_VERSION_BY_LANG[lang];
  });
  const [bookId, setBookId] = useState(() => {
    const requested = Number(searchParams.get("bookId"));
    return BOOKS.some((book) => book.id === requested) ? requested : 1;
  });
  const [chapter, setChapter] = useState(() => {
    const requested = Number(searchParams.get("chapter"));
    return Number.isInteger(requested) && requested > 0 ? requested : 1;
  });
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [lendo, setLendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [versoAtual, setVersoAtual] = useState<number | null>(null);
  const verseRefs = useRef<Record<number, HTMLParagraphElement | null>>({});
  const requestIdRef = useRef(0);

  // Reset version to language default when language changes
  useEffect(() => {
    setVersion(DEFAULT_VERSION_BY_LANG[lang]);
    setVerses([]);
  }, [lang]);

  // Atalhos do Dock e do Início (?version=, ?bookId=, ?chapter=) também valem quando a página já está aberta.
  useEffect(() => {
    const requestedVersion = searchParams.get("version");
    if (requestedVersion && versions.some((v) => v.id === requestedVersion)) { setVersion(requestedVersion); setSelectedVerse(null); }
    const requestedBook = Number(searchParams.get("bookId"));
    if (BOOKS.some((book) => book.id === requestedBook)) {
      setBookId(requestedBook);
      const requestedChapter = Number(searchParams.get("chapter"));
      setChapter(Number.isInteger(requestedChapter) && requestedChapter > 0 ? requestedChapter : 1);
      setSelectedVerse(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const bookNames = t("biblia.books", { returnObjects: true }) as string[];
  const currentBook = BOOKS.find((b) => b.id === bookId)!;

  const fetchChapter = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const data = await fetchBibleChapter({ version, bookId, chapter });

      const validVerses = data
        .filter(isVerse)
        .map((verse) => ({ ...verse, text: cleanBibleText(verse.text) }));

      if (validVerses.length === 0) throw new Error("Capítulo vazio");
      if (requestId === requestIdRef.current) setVerses(validVerses);
    } catch {
      if (requestId === requestIdRef.current) {
        setFailed(true);
        setVerses([]);
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [version, bookId, chapter]);

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  const pararLeitura = useCallback(() => {
    window.speechSynthesis?.cancel();
    setLendo(false);
    setPausado(false);
    setVersoAtual(null);
  }, []);

  const iniciarLeitura = useCallback(() => {
    const synth = window.speechSynthesis;
    if (verses.length === 0) return;
    if (!synth) {
      toast({ title: t("common.error"), description: t("livraria.reader.noSpeech"), variant: "destructive" });
      return;
    }
    synth.cancel();
    const speechLang = SPEECH_LANG[lang] ?? "pt-PT";
    const voices = synth.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(speechLang.slice(0, 2)));
    const voice = voices.find((v) => v.lang.replace("_", "-").toLowerCase() === speechLang.toLowerCase()) ?? voices[0];
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
      if (idx === fila.length - 1) fala.onend = () => { setLendo(false); setPausado(false); setVersoAtual(null); };
      synth.speak(fala);
    });
    setLendo(true);
    setPausado(false);
  }, [verses, lang, selectedVerse, t]);

  const alternarLeitura = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (!lendo) return iniciarLeitura();
    if (pausado) { synth.resume(); setPausado(false); }
    else { synth.pause(); setPausado(true); }
  }, [lendo, pausado, iniciarLeitura]);

  useEffect(() => { pararLeitura(); }, [version, bookId, chapter, pararLeitura]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const irTopo = () => { document.querySelector("main")?.scrollTo(0, 0); window.scrollTo(0, 0); };
  const nomeLivro = (id: number) => bookNames[id - 1] || BOOKS.find((b) => b.id === id)?.name || "";
  const prevLabel = chapter > 1 ? `${nomeLivro(bookId)} ${chapter - 1}` : bookId > 1 ? `${nomeLivro(bookId - 1)} ${BOOKS[bookId - 2].chapters}` : "";
  const nextLabel = chapter < currentBook.chapters ? `${nomeLivro(bookId)} ${chapter + 1}` : bookId < 66 ? `${nomeLivro(bookId + 1)} 1` : "";

  const goToPrevChapter = () => {
    irTopo();
    setSelectedVerse(null);
    if (chapter > 1) {
      setChapter((c) => c - 1);
    } else {
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
    } else {
      const nextBook = BOOKS.find((b) => b.id === bookId + 1);
      if (nextBook) {
        setBookId(nextBook.id);
        setChapter(1);
      }
    }
  };

  return (
    <PageShell title={t("sidebar.biblia.title")} width="tool">
      <div className="bible-controls">
        <div className="bible-book">
          <label className="ed-label" id="biblia-livro">{t("biblia.bookLabel")}</label>
          <Select value={String(bookId)} onValueChange={(v) => { setBookId(Number(v)); setChapter(1); setSelectedVerse(null); }}>
            <SelectTrigger aria-labelledby="biblia-livro"><SelectValue placeholder={t("biblia.bookLabel")} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {BOOKS.map((b) => <SelectItem key={b.id} value={String(b.id)}>{bookNames[b.id - 1] || b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="ed-label" id="biblia-capitulo">{t("biblia.chapterName")}</label>
          <Select value={String(chapter)} onValueChange={(v) => { setChapter(Number(v)); setSelectedVerse(null); }}>
            <SelectTrigger aria-labelledby="biblia-capitulo"><SelectValue placeholder={t("biblia.chapterName")} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {Array.from({ length: currentBook.chapters }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="ed-label" id="biblia-verso">{t("biblia.verseName")}</label>
          <Select value={selectedVerse ? String(selectedVerse) : ""} disabled={verses.length === 0} onValueChange={(v) => {
            const num = Number(v);
            setSelectedVerse(num);
            verseRefs.current[num]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}>
            <SelectTrigger aria-labelledby="biblia-verso"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {verses.map((v) => <SelectItem key={v.verse} value={String(v.verse)}>{v.verse}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bible-version">
          <label className="ed-label" id="biblia-versao">{t("biblia.versionLabel")}</label>
          <Select value={version} onValueChange={(value) => { setVersion(value); setSelectedVerse(null); }}>
            <SelectTrigger aria-labelledby="biblia-versao"><SelectValue placeholder={t("biblia.versionLabel")} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {versions.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bible-title">
        <h2>{bookNames[bookId - 1] || currentBook.name} {chapter}</h2>
        {verses.length > 0 && (
          <div className="bible-listen" role="group" aria-label={t("biblia.listenChapter")}>
            <button type="button" onClick={alternarLeitura}>
              {!lendo ? <Volume2 aria-hidden /> : pausado ? <Play aria-hidden /> : <Pause aria-hidden />}
              {!lendo ? t("biblia.listenChapter") : pausado ? t("livraria.reader.resume") : t("livraria.reader.pause")}
            </button>
            {lendo && <button type="button" onClick={pararLeitura}><Square aria-hidden />{t("livraria.reader.stop")}</button>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="ed-wait-lines" role="status" aria-label={t("common.loading")}>{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
      ) : verses.length > 0 ? (
        <div className="bible-text" lang={lang}>
          {verses.map((v) => (
            <p
              key={v.pk}
              ref={(el) => { verseRefs.current[v.verse] = el; }}
              className={versoAtual === v.verse ? "is-reading" : selectedVerse === v.verse ? "is-selected" : ""}
            >
              <sup>{v.verse}</sup>
              <span className="whitespace-pre-line">{v.text}</span>
            </p>
          ))}
        </div>
      ) : failed ? (
        <ToolError onRetry={fetchChapter}>{t("biblia.errorMessage")}</ToolError>
      ) : (
        <p className="ed-empty">{t("biblia.emptyState")}</p>
      )}

      <nav className="bible-nav" aria-label={t("biblia.choose")}>
        {prevLabel ? <button type="button" onClick={goToPrevChapter}><ArrowLeft aria-hidden /><span><small>{t("biblia.previousButton")}</small>{prevLabel}</span></button> : <span />}
        {nextLabel ? <button type="button" className="is-next" onClick={goToNextChapter}><span><small>{t("biblia.nextButton")}</small>{nextLabel}</span><ArrowRight aria-hidden /></button> : <span />}
      </nav>
    </PageShell>
  );
};

export default BibliaPage;
