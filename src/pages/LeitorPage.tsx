import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, List, Pause, Play, Square, Volume2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/hooks/use-theme";
import { libraryLanguage, libraryProduct, setLastRead, setVolumeProgress } from "@/data/library";
import { useAuth } from "@/hooks/use-auth";
import { fetchLibraryVolume } from "@/lib/content-api";
import { toast } from "@/hooks/use-toast";

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

// Mesmos papéis do "Livro de Estudo": papel/tinta/dourado; a noite é o marinho da marca, com tinta quente.
const THEMES: Record<ThemeName, { bg: string; papel: string; texto: string; sub: string; borda: string; acento: string }> = {
  bege: { bg: "hsl(40 47% 94%)", papel: "hsl(40 50% 97%)", texto: "hsl(216 45% 16%)", sub: "hsl(218 17% 33%)", borda: "hsl(41 39% 80%)", acento: "hsl(40 58% 28%)" },
  sepia: { bg: "hsl(37 48% 85%)", papel: "hsl(38 55% 90%)", texto: "hsl(28 40% 15%)", sub: "hsl(28 28% 28%)", borda: "hsl(34 30% 68%)", acento: "hsl(30 62% 24%)" },
  noturno: { bg: "hsl(216 53% 8%)", papel: "hsl(216 48% 11%)", texto: "hsl(41 32% 84%)", sub: "hsl(41 12% 70%)", borda: "hsl(216 36% 22%)", acento: "hsl(41 55% 67%)" },
};

const PREFS_KEY = "fc-leitura-prefs";
const MIN_FONT = 15;
const MAX_FONT = 29;

const SPEECH_LANG: Record<string, string> = {
  "pt-PT": "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  de: "de-DE",
};

const READER_SERIF = "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif";

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
  const { theme: appTheme } = useTheme();
  const product = libraryProduct(i18n.resolvedLanguage || i18n.language, productSlug ?? "");
  const volume = product?.volumes.find((item) => item.slug === volumeSlug);

  const [book, setBook] = useState<VolumeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [cap, setCap] = useState(0);
  // Tamanho e fundo valem para todos os livros; sem escolha salva, o fundo acompanha o tema do app.
  const [fonte, setFonte] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}").fonte ?? 19; } catch { return 19; }
  });
  const [tema, setTema] = useState<ThemeName>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}").tema;
      if (saved && saved in THEMES) return saved;
    } catch { /* preferências inválidas são ignoradas */ }
    return appTheme === "dark" ? "noturno" : "bege";
  });
  const [sumario, setSumario] = useState(false);
  const tocCloseRef = useRef<HTMLButtonElement>(null);
  const tocOpenRef = useRef<HTMLButtonElement>(null);
  const [lendo, setLendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [linhaAtual, setLinhaAtual] = useState(-2);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storageKey = `fc-leitura:${productSlug}:${volumeSlug}`;

  useEffect(() => {
    if (!email || !volumeSlug) return;
    setLoading(true);
    setError("");
    fetchLibraryVolume({
      email,
      productSlug: productSlug ?? "",
      volumeSlug,
      language: libraryLanguage(i18n.resolvedLanguage || i18n.language),
    }).then(({ data, error: requestError }) => {
      if (requestError || !data) setError(requestError || "content_error");
      else setBook(data as VolumeContent);
      setLoading(false);
    });
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      if (saved.cap) setCap(saved.cap);
    } catch { /* estado salvo inválido é ignorado */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, i18n.language, i18n.resolvedLanguage, productSlug, volumeSlug, tentativa]);

  const chapters = useMemo(() => (book ? parseChapters(book.content) : []), [book]);
  const total = chapters.length;
  const chapter = chapters[Math.min(cap, Math.max(total - 1, 0))];

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ cap }));
      localStorage.setItem(PREFS_KEY, JSON.stringify({ fonte, tema }));
    } catch { /* armazenamento indisponível */ }
    if (productSlug && volumeSlug && total > 0) {
      setVolumeProgress(productSlug, volumeSlug, ((cap + 1) / total) * 100);
      setLastRead(productSlug, volumeSlug, cap + 1, total);
    }
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
    if (!chapter) return;
    if (!synth) {
      toast({ title: t("common.error"), description: t("livraria.reader.noSpeech"), variant: "destructive" });
      return;
    }
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
  }, [chapter, i18n.language, i18n.resolvedLanguage, t]);

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
      if (event.key === "Escape") {
        // Esc fecha o que está por cima primeiro; só depois sai da leitura.
        if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
        if (sumario) { setSumario(false); tocOpenRef.current?.focus(); return; }
        fechar();
      }
      if (sumario) return;
      if (event.key === "ArrowLeft") anterior();
      if (event.key === "ArrowRight") proximo();
      // proteção do conteúdo: copiar, selecionar tudo, recortar, salvar e imprimir
      if ((event.ctrlKey || event.metaKey) && ["c", "a", "x", "s", "p"].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };
    const bloquear = (event: Event) => event.preventDefault();
    window.addEventListener("keydown", onKey);
    document.addEventListener("copy", bloquear);
    document.addEventListener("cut", bloquear);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("copy", bloquear);
      document.removeEventListener("cut", bloquear);
    };
  }, [anterior, proximo, fechar, sumario]);

  useEffect(() => {
    if (sumario) tocCloseRef.current?.focus();
  }, [sumario]);

  if (!product || !volume) return <Navigate to="/livraria" replace />;

  const theme = THEMES[tema];
  const progresso = total > 0 ? ((cap + 1) / total) * 100 : 0;

  const iconButton = "flex h-11 w-11 shrink-0 items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]";
  const proximoCap = chapters[cap + 1];
  const anteriorCap = chapters[cap - 1];
  const realce = (index: number) =>
    index === linhaAtual ? { background: `color-mix(in srgb, ${theme.acento} 16%, transparent)`, boxShadow: `-8px 0 0 color-mix(in srgb, ${theme.acento} 16%, transparent), 8px 0 0 color-mix(in srgb, ${theme.acento} 16%, transparent)` } : undefined;
  const nomesTema: Record<ThemeName, string> = { bege: t("livraria.reader.themePaper"), sepia: t("livraria.reader.themeSepia"), noturno: t("livraria.reader.themeNight") };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col select-none"
      style={{ background: theme.bg, color: theme.texto, height: "100dvh", WebkitTouchCallout: "none", outlineColor: theme.acento } as React.CSSProperties}
      role="dialog"
      aria-label={volume.title}
      onContextMenu={(event) => event.preventDefault()}
    >
      <header className="flex shrink-0 items-center gap-1 px-1 sm:px-3" style={{ borderBottom: `1px solid ${theme.borda}`, paddingTop: "env(safe-area-inset-top)" }}>
        <button onClick={fechar} aria-label={t("livraria.reader.close")} title={t("livraria.reader.close")} className={iconButton} style={{ color: theme.sub }}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate font-display text-[1.0625rem] font-semibold leading-tight">{volume.title}</p>
          {total > 0 && <p className="truncate font-body text-[0.8125rem] leading-tight" style={{ color: theme.sub }}>{t("livraria.reader.chapterOf", { current: cap + 1, total })}</p>}
        </div>
        <button ref={tocOpenRef} onClick={() => setSumario((open) => !open)} aria-label={t("livraria.reader.toc")} aria-expanded={sumario} title={t("livraria.reader.toc")} className={iconButton} style={{ color: theme.sub }}>
          <List className="h-5 w-5" />
        </button>
        <button onClick={alternarLeitura} aria-label={!lendo ? t("livraria.reader.listen") : pausado ? t("livraria.reader.resume") : t("livraria.reader.pause")} title={t("livraria.reader.listen")} className={iconButton} style={{ color: lendo ? theme.acento : theme.sub }}>
          {!lendo ? <Volume2 className="h-5 w-5" /> : pausado ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
        <Popover>
          <PopoverTrigger aria-label={t("livraria.reader.appearance")} title={t("livraria.reader.appearance")} className={`${iconButton} font-display text-xl font-semibold`} style={{ color: theme.sub }}>
            Aa
          </PopoverTrigger>
          <PopoverContent align="end" className="z-[110] w-72 rounded-sm p-4" style={{ background: theme.papel, color: theme.texto, borderColor: theme.borda }}>
            <p className="mb-2 font-body text-[0.8125rem] font-medium" style={{ color: theme.sub }}>{t("livraria.reader.size")}</p>
            <div className="mb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.borda}` }}>
              <button onClick={() => setFonte((size: number) => Math.max(MIN_FONT, size - 2))} disabled={fonte <= MIN_FONT} aria-label={t("livraria.reader.decreaseFont")} className="h-12 w-16 font-display text-lg font-semibold disabled:opacity-30">A−</button>
              <span className="font-body text-sm tabular-nums" aria-live="polite" style={{ color: theme.sub }}>{fonte} px</span>
              <button onClick={() => setFonte((size: number) => Math.min(MAX_FONT, size + 2))} disabled={fonte >= MAX_FONT} aria-label={t("livraria.reader.increaseFont")} className="h-12 w-16 font-display text-2xl font-semibold disabled:opacity-30">A+</button>
            </div>
            <p className="mb-2 font-body text-[0.8125rem] font-medium" id="leitor-fundo" style={{ color: theme.sub }}>{t("livraria.reader.background")}</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="leitor-fundo">
              {(Object.keys(THEMES) as ThemeName[]).map((nome) => (
                <button
                  key={nome}
                  role="radio"
                  aria-checked={tema === nome}
                  onClick={() => setTema(nome)}
                  className="flex h-14 flex-col items-center justify-center rounded-sm font-body text-[0.8125rem] font-medium"
                  style={{ background: THEMES[nome].bg, color: THEMES[nome].texto, border: tema === nome ? `2px solid ${theme.acento}` : `1px solid ${THEMES[nome].borda}` }}
                >
                  {nomesTema[nome]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </header>

      {email && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className="absolute whitespace-nowrap font-body"
              style={{
                left: `${(index % 3) * 34 + 4}%`,
                top: `${Math.floor(index / 3) * 30 + 12}%`,
                transform: "rotate(-28deg)",
                fontSize: 13,
                letterSpacing: "0.08em",
                color: theme.texto,
                opacity: 0.035,
              }}
            >
              {email}
            </span>
          ))}
        </div>
      )}

      <div className="h-[2px] shrink-0" style={{ background: theme.borda }} role="progressbar" aria-label={t("livraria.progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso)}>
        <div className="h-full transition-all duration-300" style={{ width: `${progresso}%`, background: theme.acento }} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="mx-auto w-full max-w-[640px] px-6 py-12 sm:px-8" role="status" aria-label={t("common.loading")}>
            <div className="ed-wait-lines" style={{ color: theme.texto }} aria-hidden>
              {Array.from({ length: 10 }).map((_, index) => <i key={index} style={{ background: `color-mix(in srgb, ${theme.texto} 10%, transparent)` }} />)}
            </div>
          </div>
        ) : error || !book ? (
          <div className="mx-auto flex h-full max-w-md flex-col justify-center px-8">
            <p className="font-display text-2xl font-semibold">{t("livraria.reader.loadError")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => setTentativa((value) => value + 1)} className="min-h-11 rounded px-5 font-body text-sm font-medium" style={{ background: theme.texto, color: theme.papel }}>{t("common.retry")}</button>
              <button onClick={fechar} className="min-h-11 rounded px-5 font-body text-sm font-medium" style={{ border: `1px solid ${theme.sub}`, color: theme.texto }}>{t("livraria.back")}</button>
            </div>
          </div>
        ) : (
          <article
            lang={libraryLanguage(i18n.resolvedLanguage || i18n.language)}
            className="mx-auto px-6 pb-16 pt-10 sm:px-8 sm:pt-16"
            style={{ maxWidth: `calc(${fonte * 33}px + 4rem)`, fontFamily: READER_SERIF, fontSize: fonte, lineHeight: 1.7 }}
          >
            <h2 id="leitura-linha--1" className="font-display mb-10 font-semibold" style={{ fontSize: fonte * 1.9, lineHeight: 1.1, textWrap: "balance", ...realce(-1) } as React.CSSProperties}>
              {chapter?.title}
            </h2>
            {chapter?.lines.map((line, index) =>
              isQuote(line) ? (
                <blockquote
                  key={index}
                  id={`leitura-linha-${index}`}
                  className="my-8 pl-5 italic"
                  style={{ borderLeft: `2px solid ${theme.acento}`, ...realce(index) }}
                >
                  {line}
                </blockquote>
              ) : isSubheading(line) ? (
                <h3
                  key={index}
                  id={`leitura-linha-${index}`}
                  className="font-display mb-3 mt-10 font-semibold"
                  style={{ fontSize: fonte * 1.35, lineHeight: 1.25, ...realce(index) }}
                >
                  {line}
                </h3>
              ) : (
                <p key={index} id={`leitura-linha-${index}`} className="mb-5 text-left" style={{ hyphens: "auto", WebkitHyphens: "auto", ...realce(index) }}>
                  {line}
                </p>
              ),
            )}

            <nav className="mt-16 pt-6 font-body" style={{ borderTop: `1px solid ${theme.borda}` }} aria-label={t("livraria.reader.chapterOf", { current: cap + 1, total })}>
              {cap < total - 1 ? (
                <button onClick={proximo} className="flex w-full items-center justify-between gap-4 rounded px-5 py-4 text-left transition-opacity hover:opacity-90" style={{ background: theme.texto, color: theme.papel }}>
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] leading-snug opacity-80">{t("livraria.reader.next")}</span>
                    <span className="block truncate font-display text-xl font-semibold leading-snug">{proximoCap?.title}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0" />
                </button>
              ) : (
                <button onClick={concluir} className="min-h-[52px] w-full rounded px-5 py-3 text-base font-medium transition-opacity hover:opacity-90" style={{ background: theme.texto, color: theme.papel }}>
                  {t("livraria.reader.finish")}
                </button>
              )}
              {anteriorCap && (
                <button onClick={anterior} className="mt-2 flex min-h-11 w-full items-center gap-2 text-left text-sm font-medium" style={{ color: theme.sub }}>
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{anteriorCap.title}</span>
                </button>
              )}
            </nav>
          </article>
        )}
      </div>

      {lendo && (
        <div className="flex shrink-0 items-center gap-2 px-4 py-2 font-body" style={{ background: theme.papel, borderTop: `1px solid ${theme.borda}`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }} role="status">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{pausado ? t("livraria.reader.pausedLabel") : t("livraria.reader.listening")}</span>
          <button onClick={alternarLeitura} className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium" style={{ color: theme.acento }}>
            {pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{pausado ? t("livraria.reader.resume") : t("livraria.reader.pause")}
          </button>
          <button onClick={pararLeitura} className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium" style={{ color: theme.sub }}>
            <Square className="h-3.5 w-3.5" />{t("livraria.reader.stop")}
          </button>
        </div>
      )}

      {sumario && book && (
        <div className="absolute inset-0 z-10 flex">
          <nav className="flex h-full w-[340px] max-w-[88vw] flex-col" aria-label={t("livraria.reader.toc")} style={{ background: theme.papel, borderRight: `1px solid ${theme.borda}`, paddingTop: "env(safe-area-inset-top)" }}>
            <div className="flex items-start justify-between gap-2 py-3 pl-5 pr-1" style={{ borderBottom: `1px solid ${theme.borda}` }}>
              <div className="min-w-0 pt-1">
                <p className="font-display text-xl font-semibold leading-tight">{volume.title}</p>
                <p className="mt-1 font-body text-[0.8125rem]" style={{ color: theme.sub }}>{t("livraria.reader.chaptersCount", { count: total })}</p>
              </div>
              <button ref={tocCloseRef} onClick={() => setSumario(false)} aria-label={t("common.close")} className={iconButton} style={{ color: theme.sub }}><X className="h-5 w-5" /></button>
            </div>
            <ol className="flex-1 overflow-y-auto px-2 py-2">
              {chapters.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => { setCap(index); setSumario(false); }}
                    aria-current={index === cap ? "true" : undefined}
                    className="grid min-h-11 w-full grid-cols-[28px_1fr] items-baseline px-3 py-2.5 text-left text-[1rem] leading-snug"
                    style={{ fontFamily: READER_SERIF, fontWeight: index === cap ? 600 : 400, boxShadow: index === cap ? `inset 2px 0 0 ${theme.acento}` : undefined }}
                  >
                    <span className="font-brand text-[0.8125rem]" style={{ color: theme.acento }}>{index + 1}</span>
                    <span>{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <button aria-label={t("common.close")} tabIndex={-1} className="flex-1" onClick={() => setSumario(false)} style={{ background: "rgba(0,0,0,0.3)" }} />
        </div>
      )}
    </div>
  );
}
