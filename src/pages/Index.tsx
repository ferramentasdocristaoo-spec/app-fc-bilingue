import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchDailyVerse, type DailyVerse } from "@/lib/daily-verse";
import { getLastRead } from "@/data/library";
import "./WorkspaceDesign.css";

interface Sermon { titulo?: string; textoBase?: string; tema?: string; status?: string; data?: string; conteudo?: string }

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const Index = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const lastRead = getLastRead(language);
  const sermons = useMemo<Sermon[]>(() => {
    try { return JSON.parse(localStorage.getItem("fc-sermoes") || "[]"); } catch { return []; }
  }, []);
  const current = sermons.at(-1);

  useEffect(() => { fetchDailyVerse(language).then(setVerse); }, [language]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("dashboard.goodMorning") : hour < 18 ? t("dashboard.goodAfternoon") : t("dashboard.goodEvening");
  const date = new Date().toLocaleDateString(language, { weekday: "long", day: "numeric", month: "long" });
  const bookNames = t("biblia.books", { returnObjects: true }) as string[];
  const verseRef = verse ? `${bookNames[verse.book - 1]} ${verse.chapter}:${verse.verse}` : "";

  // Índice da "mesa de estudo": sem ícones, numeração romana, uma linha por ferramenta.
  const desk = [
    { to: "/jornada", title: t("journey.title"), text: t("journey.sidebarDescription") },
    { to: "/biblia", title: t("sidebar.biblia.title"), text: current?.textoBase ? `${current.textoBase} · ${t("workspace.researchDescription")}` : t("workspace.researchDescription") },
    { to: "/raio-x", title: t("sidebar.raioX.title"), text: t("sidebar.raioX.description") },
    { to: "/devocional", title: t("sidebar.devocional.title"), text: t("workspace.todayReflection") },
    { to: "/livraria", title: lastRead?.volumeTitle || t("sidebar.livraria.title"), text: lastRead ? t("workspace.readingProgress", { progress: Math.round(lastRead.progress) }) : t("workspace.libraryDescription") },
    { to: "/esbocos", title: t("sidebar.esbocos.title"), text: t("workspace.sermonsPrepared", { count: sermons.length }) },
  ];

  return <div className="workspace-home">
    <header className="workspace-welcome">
      <p className="workspace-date">{date}</p>
      <h1>{greeting}.</h1>
      <p className="workspace-lede">{t("workspace.welcome")}</p>
    </header>

    <div className="workspace-today">
      <section className="workspace-current" aria-labelledby="workspace-current-title">
        <span className="ed-eyebrow">{current ? t("workspace.inPreparation") : t("workspace.nextMessage")}</span>
        <h2 id="workspace-current-title">{current?.titulo || t("workspace.startInspiration")}</h2>
        {current?.textoBase
          ? <p className="workspace-ref">{current.textoBase}</p>
          : <p className="workspace-current-text">{t("workspace.startDescription")}</p>}
        {current && <p className="workspace-meta">{current.status || t("workspace.draft")} · {t("workspace.sermonsPrepared", { count: sermons.length })}</p>}
        <div className="workspace-actions">
          {current
            ? <Link to="/esbocos" className="ed-btn ed-btn-primary">{t("workspace.continue")} <span aria-hidden>→</span></Link>
            : <Link to="/oficina" className="ed-btn ed-btn-primary">{t("workspace.startJourney")} <span aria-hidden>→</span></Link>}
          <Link to="/oficina" className="ed-btn ed-btn-ghost">{t("workspace.newMessage")}</Link>
        </div>
      </section>

      <aside className="workspace-verse" aria-label={t("dashboard.verseOfDay")}>
        <span className="ed-eyebrow">{t("dashboard.verseOfDay")}</span>
        <blockquote>{verse ? `“${verse.text}”` : t("workspace.loadingWord")}</blockquote>
        {verse && <cite>{verseRef}</cite>}
        <Link to="/biblia" className="ed-link">{t("dashboard.readInBible")}</Link>
        {lastRead && <Link to="/livraria" className="workspace-continue">
          <span className="workspace-spine" aria-hidden />
          <span>
            <small>{t("dashboard.continueReading")}</small>
            <strong>{lastRead.volumeTitle}</strong>
            <em>{t("workspace.readingProgress", { progress: Math.round(lastRead.progress) })}</em>
          </span>
        </Link>}
      </aside>
    </div>

    <section className="workspace-index" aria-labelledby="workspace-desk-title">
      <header>
        <h3 id="workspace-desk-title">{t("workspace.yourDesk")}</h3>
        <p>{t("workspace.deskDescription")}</p>
      </header>
      <ol>
        {desk.map((item, index) => <li key={item.to}>
          <Link to={item.to}>
            <span className="ed-num">{ROMAN[index]}</span>
            <span><strong>{item.title}</strong><small>{item.text}</small></span>
            <span className="workspace-go" aria-hidden>→</span>
          </Link>
        </li>)}
      </ol>
    </section>
  </div>;
};

export default Index;
