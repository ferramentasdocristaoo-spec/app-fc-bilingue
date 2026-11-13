import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { fetchDailyVerse, type DailyVerse } from "@/lib/daily-verse";
import { journeyProgressRepository } from "@/features/bible-journey/progress";
import "./HomeTrilha.css";

/* Início no modelo "Trilha" (direção B, aprovada pelo dono para a tela inicial).
   O menu vira a ordem do estudo: 1 Preparação · 2 Estudo e biblioteca · 3 Vida e comunidade.
   A etapa atual sai do estado real guardado no aparelho (Oficina e esboços); nada inventado. */

interface Sermon { titulo?: string; textoBase?: string; status?: string }
type StageKey = "prep" | "study" | "life";
type JourneySpot = { name: string; chapter: number; to: string };

const readJSON = <T,>(key: string, fallback: T): T => {
  try { return (JSON.parse(localStorage.getItem(key) || "null") as T) ?? fallback; } catch { return fallback; }
};

/** Próximo domingo (hoje, se já for domingo): a semana do pregador termina no culto. */
const nextSunday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d;
};

const Index = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [verseFailed, setVerseFailed] = useState(false);
  const [spot, setSpot] = useState<JourneySpot | null>(null);

  const { passage, stage } = useMemo(() => {
    const sermons = readJSON<Sermon[]>("fc-sermoes", []);
    const last = Array.isArray(sermons) ? sermons.at(-1) : undefined;
    const draft = readJSON<{ textoBase?: string }>("fc-oficina-atual", {});
    const text = draft.textoBase?.trim() || last?.textoBase?.trim() || "";
    const finished = !!text && last?.status === "finalizado" && last.textoBase?.trim() === text;
    return { passage: text, stage: (!text ? 1 : finished ? 3 : 2) as 1 | 2 | 3 };
  }, []);

  useEffect(() => {
    let active = true;
    setVerseFailed(false);
    fetchDailyVerse(language).then((value) => {
      if (!active) return;
      setVerse(value);
      setVerseFailed(!value);
    });
    return () => { active = false; };
  }, [language]);

  // Onde o leitor parou na Jornada. O catálogo é grande: só carrega quando há progresso.
  useEffect(() => {
    const where = journeyProgressRepository.getState().lastLocation;
    if (!where) { setSpot(null); return; }
    let active = true;
    import("@/features/bible-journey/catalog").then(async ({ journeyCatalogRepository }) => {
      const book = await journeyCatalogRepository.getBook(where.bookSlug);
      if (!active || !book) return;
      const names = t("biblia.books", { returnObjects: true }) as string[];
      setSpot({
        name: names[book.bibleBookId - 1] ?? book.slug,
        chapter: where.chapter,
        to: `/jornada/${book.testament}/${book.slug}/capitulos/${where.chapter}`,
      });
    }).catch(() => {});
    return () => { active = false; };
  }, [t, language]);

  const sunday = nextSunday().toLocaleDateString(language, { weekday: "long", day: "numeric", month: "long" });
  const bookNames = t("biblia.books", { returnObjects: true }) as string[];
  const verseRef = verse ? `${bookNames[verse.book - 1]} ${verse.chapter}:${verse.verse}` : "";

  const stages: { key: StageKey; n: 1 | 2 | 3; title: string; text: string; tools: { to: string; title: string }[]; action: { to: string; label: string } }[] = [
    {
      key: "prep", n: 1, title: t("workspace.groups.preparation"),
      text: passage ? t("home.prepDone") : t("home.prepText"),
      tools: [
        { to: "/oficina", title: t("sidebar.oficina.title") },
        { to: "/esbocos", title: t("sidebar.esbocos.title") },
        { to: "/pulpito", title: t("sidebar.pulpito.title") },
      ],
      action: passage ? { to: "/oficina", label: t("workspace.continue") } : { to: "/oficina", label: t("home.choosePassage") },
    },
    {
      key: "study", n: 2, title: t("workspace.groups.study"),
      text: t("home.studyText"),
      tools: [
        { to: "/raio-x", title: t("sidebar.raioX.title") },
        { to: "/nomes", title: t("sidebar.nomes.title") },
        { to: "/garimpo", title: t("sidebar.garimpo.title") },
        { to: "/biblia", title: t("sidebar.biblia.title") },
        { to: "/jornada", title: t("journey.title") },
        { to: "/livraria", title: t("sidebar.livraria.title") },
      ],
      action: { to: "/raio-x", label: passage ? `${t("sidebar.raioX.title")} · ${passage}` : t("sidebar.raioX.title") },
    },
    {
      key: "life", n: 3, title: t("workspace.groups.life"),
      text: t("home.lifeText"),
      tools: [
        { to: "/devocional", title: t("sidebar.devocional.title") },
        { to: "/mural", title: t("sidebar.mural.title") },
        { to: "/voz-de-deus", title: t("sidebar.voz.title") },
      ],
      action: { to: "/devocional", label: t("sidebar.devocional.title") },
    },
  ];

  const statusOf = (n: number) => (n < stage ? "done" : n === stage ? "now" : "later");

  return <div className="trilha">
    <nav className="trilha-stages" aria-label={t("home.stagesLabel")}>
      <ol>
        {stages.map((s) => {
          const status = statusOf(s.n);
          return <li key={s.key}>
            <a href={`#etapa-${s.n}`} className={`is-${status}`} aria-current={status === "now" ? "step" : undefined}
              onClick={(e) => { e.preventDefault(); document.getElementById(`etapa-${s.n}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
              <i aria-hidden>{status === "done" ? <Check strokeWidth={3} /> : s.n}</i>
              <span>{s.title}</span>
            </a>
          </li>;
        })}
      </ol>
    </nav>

    <div className="trilha-body">
      <header className="trilha-week">
        <p className="trilha-kicker">{t("home.yourWeek")}</p>
        <h1>{passage || t("home.noPassage")}</h1>
        <p className="trilha-week-meta">
          <span className="trilha-date">{t("home.forDate", { date: sunday })}</span>
          <span aria-hidden> · </span>
          <span className="trilha-pill">{t("home.stageOf", { current: stage, total: 3 })}</span>
        </p>
      </header>

      <div className="trilha-grid">
        <ol className="trilha-steps">
          {stages.map((s) => {
            const status = statusOf(s.n);
            return <li key={s.key} id={`etapa-${s.n}`} className={`trilha-step is-${status}`}>
              <span className="trilha-n" aria-hidden>{s.n}</span>
              <div className="trilha-step-main">
                <h2>
                  <span><span className="sr-only">{s.n}. </span>{s.title}</span>
                  <small className={`trilha-status is-${status}`}>{t(`home.status.${status}`)}</small>
                </h2>
                <p>{s.text}</p>
                <ul className={`trilha-tools${s.tools.length > 3 ? " is-six" : ""}`}>
                  {s.tools.map((tool) => <li key={tool.to}><Link to={tool.to}>{tool.title}</Link></li>)}
                </ul>
                {status === "now" && <Link to={s.action.to} className="trilha-btn">
                  <span>{s.action.label}</span><span aria-hidden>→</span>
                </Link>}
              </div>
            </li>;
          })}
        </ol>

        <aside className="trilha-side" aria-label={t("home.supportLabel")}>
          <section className="trilha-card">
            <p className="trilha-kicker">{t("dashboard.verseOfDay")}</p>
            {verse && <b>{verseRef}</b>}
            <p className="trilha-verse">{verse ? `“${verse.text}”` : verseFailed ? t("workspace.verseUnavailable") : t("workspace.loadingWord")}</p>
            <Link className="trilha-card-link" to={verse ? `/biblia?bookId=${verse.book}&chapter=${verse.chapter}` : "/biblia"}>{t("dashboard.readInBible")} <span aria-hidden>→</span></Link>
          </section>
          <section className="trilha-card">
            <p className="trilha-kicker">{t("journey.title")}</p>
            <b>{spot ? `${spot.name} ${spot.chapter}` : t("home.journeyStart")}</b>
            <p>{spot ? t("home.journeyWhere") : t("journey.sidebarDescription")}</p>
            <Link className="trilha-card-link" to={spot?.to ?? "/jornada"}>{spot ? t("home.journeyContinue") : t("home.journeyOpen")} <span aria-hidden>→</span></Link>
          </section>
        </aside>
      </div>
    </div>
  </div>;
};

export default Index;
