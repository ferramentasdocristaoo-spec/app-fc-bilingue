import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AArrowDown,
  AArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  Palette,
  Pause,
  Play,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { libraryLanguage, libraryProduct, setVolumeProgress } from "@/data/library";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface VolumeContent {
  title: string;
  content: string;
  language: string;
  word_count: number;
}

interface Chapter {
  title: string;
  lines: string[];
}

type ThemeName = "bege" | "sepia" | "noturno";

const THEMES: Record<ThemeName, { bg: string; papel: string; texto: string; sub: string; borda: string }> = {
  bege: {
    bg: "hsl(40 35% 90%)",
    papel: "hsl(42 50% 97%)",
    texto: "hsl(28 30% 14%)",
    sub: "hsl(30 15% 40%)",
    borda: "hsl(38 26% 84%)",
  },
  sepia: {
    bg: "hsl(36 45% 82%)",
    papel: "hsl(38 55% 90%)",
    texto: "hsl(28 40% 18%)",
    sub: "hsl(30 25% 38%)",
    borda: "hsl(34 30% 72%)",
  },
  noturno: {
    bg: "hsl(28 15% 8%)",
    papel: "hsl(28 12% 12%)",
    texto: "hsl(40 25% 82%)",
    sub: "hsl(38 15% 60%)",
    borda: "hsl(28 12% 22%)",
  },
};

const SPEECH_LANG: Record<string, string> = {
  "pt-PT": "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  de: "de-DE",
};

const GOLD = "hsl(42 65% 47%)";
const GOLD_GRADIENT = "linear-gradient(135deg, #604224, #C6972A)";

// Cada capítulo é um bloco separado por linha em branco; a primeira linha é o título.
// O bloco inicial (título do livro em maiúsculas) é descartado.
function parseChapters(content: string): Chapter[] {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  while (blocks.length > 1 && blocks[0] === blocks[0].toUpperCase()) blocks.shift();
  return blocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    return { title: lines[0] ?? "", lines: lines.slice(1) };
  });
}

const isSubheading = (line: string) =>
  line.length < 60 &&
  !/^V\.?\s?\d/i.test(line) &&
  !line.includes(" - ") &&
  (/^\d+\.\s/.test(line) || /^[IVX]+\.\s/.test(line) || !/[.!?…»”")\]]$/.test(line));

const isQuote = (line: string) => /^["“«]/.test(line);

export default function LeitorPage() {
  const { productSlug, volumeSlug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { email } = useAuth();
  const product = libraryProduct(i18n.resolvedLanguage || i18n.language, productSlug ?? "");
  const volume = product?.volumes.find((item) => item.slug === volumeSlug);

  const [book, setBook] = useState<VolumeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cap, setCap] = useState(0);
  const [fonte, setFonte] = useState(19);
  const [tema, setTema] = useState<ThemeName>("bege");
  const [sumario, setSumario] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [linhaAtual, setLinhaAtual] = useState(-2);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storageKey = `fc-leitura:${productSlug}:${volumeSlug}`;

  useEffect(() => {
    if (!email || !volumeSlug) return;
    setLoading(true);
    supabase.functions.invoke("library-content", {
      body: {
        email,
        product_slug: productSlug,
        volume_slug: volumeSlug,
        language: libraryLanguage(i18n.resolvedLanguage || i18n.language),
      },
    }).then(({ data, error: requestError }) => {
      if (requestError || data?.error) setError(data?.error || "content_error");
      else setBook(data as VolumeContent);
      setLoading(false);
    });
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      if (saved.cap) setCap(saved.cap);
      if (saved.fonte) setFonte(saved.fonte);
      if (saved.tema) setTema(saved.tema);
    } catch { /* estado salvo inválido é ignorado */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, i18n.language, i18n.resolvedLanguage, productSlug, volumeSlug]);

  const chapters = useMemo(() => (book ? parseChapters(book.content) : []), [book]);
  const total = chapters.length;
  const chapter = chapters[Math.min(cap, Math.max(total - 1, 0))];

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ cap, fonte, tema }));
    } catch { /* armazenamento indisponível */ }
    if (productSlug && volumeSlug && total > 0) setVolumeProgress(productSlug, volumeSlug, ((cap + 1) / total) * 100);
  }, [cap, fonte, tema, storageKey, productSlug, volumeSlug, total]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [cap]);

  const pararLeitura = useCallback(() => {
    window.speechSynthesis?.cancel();
    setLendo(false);
    setPausado(false);
    setLinhaAtual(-2);
  }, []);

  const iniciarLeitura = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth || !chapter) return;
    synth.cancel();
    const speechLang = SPEECH_LANG[libraryLanguage(i18n.resolvedLanguage || i18n.language)] ?? "pt-BR";
    const voices = synth.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(speechLang.slice(0, 2)));
    const voice = voices.find((v) => v.lang.replace("_", "-").toLowerCase() === speechLang.toLowerCase()) ?? voices[0];
    const textos = [chapter.title, ...chapter.lines];
    textos.forEach((texto, idx) => {
      const fala = new SpeechSynthesisUtterance(texto);
      fala.lang = speechLang;
      if (voice) fala.voice = voice;
      fala.rate = 0.95;
      fala.onstart = () => {
        setLinhaAtual(idx - 1);
        document.getElementById(`leitura-linha-${idx - 1}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      if (idx === textos.length - 1) fala.onend = () => { setLendo(false); setPausado(false); setLinhaAtual(-2); };
      synth.speak(fala);
    });
    setLendo(true);
    setPausado(false);
  }, [chapter, i18n.language, i18n.resolvedLanguage]);

  const alternarLeitura = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (!lendo) return iniciarLeitura();
    if (pausado) { synth.resume(); setPausado(false); }
    else { synth.pause(); setPausado(true); }
  }, [lendo, pausado, iniciarLeitura]);

  useEffect(() => {
    pararLeitura();
  }, [cap, volumeSlug, pararLeitura]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const anterior = useCallback(() => setCap((value) => Math.max(0, value - 1)), []);
  const proximo = useCallback(() => setCap((value) => Math.min(total - 1, value + 1)), [total]);
  const fechar = useCallback(() => navigate(`/livraria/${productSlug}`), [navigate, productSlug]);

  const concluir = useCallback(() => {
    if (productSlug && volumeSlug) setVolumeProgress(productSlug, volumeSlug, 100);
    fechar();
  }, [productSlug, volumeSlug, fechar]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") anterior();
      if (event.key === "ArrowRight") proximo();
      if (event.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anterior, proximo, fechar]);

  if (!product || !volume) return <Navigate to="/livraria" replace />;

  const theme = THEMES[tema];
  const progresso = total > 0 ? ((cap + 1) / total) * 100 : 0;

  const iconButton = "w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-70";
  const realce = (index: number) =>
    index === linhaAtual ? { background: "hsl(42 65% 47% / 0.18)", borderRadius: 6 } : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: theme.bg, height: "100dvh" }}
      role="dialog"
      aria-label={`Lendo: ${volume.title}`}
    >
      <header
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: `1px solid ${theme.borda}` }}
      >
        <button onClick={() => setSumario((open) => !open)} aria-label={t("livraria.reader.toc")} className={iconButton} style={{ color: theme.sub }}>
          <List className="h-5 w-5" />
        </button>
        <div
          className="flex-1 truncate px-2 text-center font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: theme.sub }}
        >
          {chapter?.title ?? volume.title}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={alternarLeitura} aria-label={t("livraria.reader.listen")} className={iconButton} style={{ color: lendo ? GOLD : theme.sub }}>
            {!lendo ? <Volume2 className="h-5 w-5" /> : pausado ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
          {lendo && (
            <button onClick={pararLeitura} aria-label={t("livraria.reader.stopListening")} className={iconButton} style={{ color: theme.sub }}>
              <Square className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setFonte((size) => Math.max(15, size - 2))} aria-label={t("livraria.reader.decreaseFont")} className={iconButton} style={{ color: theme.sub }}>
            <AArrowDown className="h-5 w-5" />
          </button>
          <button onClick={() => setFonte((size) => Math.min(29, size + 2))} aria-label={t("livraria.reader.increaseFont")} className={iconButton} style={{ color: theme.sub }}>
            <AArrowUp className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTema((current) => (current === "bege" ? "sepia" : current === "sepia" ? "noturno" : "bege"))}
            aria-label={t("livraria.reader.changeTheme")}
            className={iconButton}
            style={{ color: theme.sub }}
          >
            <Palette className="h-5 w-5" />
          </button>
          <button onClick={fechar} aria-label={t("livraria.reader.close")} className={iconButton} style={{ color: theme.sub }}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="h-[3px] shrink-0" style={{ background: theme.borda }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progresso}%`, background: GOLD }}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin" style={{ color: GOLD }} />
          </div>
        ) : error || !book ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <BookOpen className="mb-3 h-8 w-8" style={{ color: theme.sub }} />
            <p style={{ color: theme.sub }}>{t("livraria.reader.loadError")}</p>
          </div>
        ) : (
          <article
            className="mx-auto px-6 py-10 sm:px-8"
            style={{
              maxWidth: 680,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: fonte,
              lineHeight: 1.75,
              color: theme.texto,
            }}
          >
            <h2 id="leitura-linha--1" className="font-display mb-8 font-bold" style={{ fontSize: fonte * 1.6, lineHeight: 1.2, ...realce(-1) }}>
              {chapter?.title}
            </h2>
            {chapter?.lines.map((line, index) =>
              isQuote(line) ? (
                <blockquote
                  key={index}
                  id={`leitura-linha-${index}`}
                  className="my-6 border-l-2 pl-4 italic"
                  style={{ borderColor: GOLD, color: theme.sub, ...realce(index) }}
                >
                  {line}
                </blockquote>
              ) : isSubheading(line) ? (
                <h3
                  key={index}
                  id={`leitura-linha-${index}`}
                  className="font-display mb-3 mt-8 font-semibold"
                  style={{ fontSize: fonte * 1.15, lineHeight: 1.3, ...realce(index) }}
                >
                  {line}
                </h3>
              ) : (
                <p key={index} id={`leitura-linha-${index}`} className="mb-5 text-justify" style={realce(index)}>
                  {line}
                </p>
              ),
            )}

            <div className="mb-6 mt-12 flex items-center justify-between gap-3">
              {cap > 0 ? (
                <button
                  onClick={anterior}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ border: `1px solid ${theme.borda}`, color: theme.sub }}
                >
                  <ChevronLeft className="h-4 w-4" /> {t("livraria.reader.prev")}
                </button>
              ) : (
                <span />
              )}
              {cap < total - 1 ? (
                <button
                  onClick={proximo}
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-3 font-sans text-sm font-semibold text-white transition-transform hover:-translate-y-px"
                  style={{ background: GOLD_GRADIENT, boxShadow: "0 8px 24px -8px rgba(198,151,42,0.55)" }}
                >
                  {t("livraria.reader.next")} <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={concluir}
                  className="rounded-xl px-5 py-3 font-sans text-sm font-semibold text-white transition-transform hover:-translate-y-px"
                  style={{ background: GOLD_GRADIENT, boxShadow: "0 8px 24px -8px rgba(198,151,42,0.55)" }}
                >
                  {t("livraria.reader.finish")}
                </button>
              )}
            </div>
            <p className="mb-4 text-center font-mono text-[11px]" style={{ color: theme.sub }}>
              {t("livraria.reader.chapterOf", { current: cap + 1, total })}
            </p>
          </article>
        )}
      </div>

      {sumario && book && (
        <div className="absolute inset-0 z-10 flex" style={{ top: 49 }}>
          <div
            className="h-full w-[300px] max-w-[85vw] overflow-y-auto p-4"
            style={{ background: theme.papel, borderRight: `1px solid ${theme.borda}` }}
          >
            <p className="font-display mb-1 text-lg font-bold" style={{ color: theme.texto }}>
              {volume.title}
            </p>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: theme.sub }}>
              {t("livraria.reader.chaptersCount", { count: total })}
            </p>
            {chapters.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setCap(index);
                  setSumario(false);
                }}
                className="mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                style={
                  index === cap
                    ? { background: GOLD_GRADIENT, color: "#fff", fontWeight: 600 }
                    : { color: theme.texto }
                }
              >
                <span className="mr-2 font-mono text-[10px]" style={index === cap ? undefined : { color: theme.sub }}>
                  {index + 1}
                </span>
                {item.title}
              </button>
            ))}
          </div>
          <button aria-label={t("livraria.reader.toc")} className="flex-1" onClick={() => setSumario(false)} style={{ background: "rgba(0,0,0,0.25)" }} />
        </div>
      )}
    </div>
  );
}
