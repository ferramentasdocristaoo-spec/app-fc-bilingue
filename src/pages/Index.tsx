import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CalendarDays, ChevronRight, Heart, Library, Play, Quote, Sparkles, WandSparkles } from "lucide-react";
import { fetchDailyVerse, type DailyVerse } from "@/lib/daily-verse";
import { getLastRead } from "@/data/library";
import "./WorkspaceDesign.css";

interface Sermon { titulo?: string; textoBase?: string; tema?: string; status?: string; data?: string; conteudo?: string }

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
  const preparationSteps = t("workspace.steps", { returnObjects: true }) as string[];

  return <div className="workspace-home">
    <header className="workspace-welcome">
      <div><span>{date}</span><h1>{greeting}</h1><p>{t("workspace.welcome")}</p></div>
      <Link to="/oficina" className="workspace-new"><Sparkles /> {t("workspace.newMessage")}</Link>
    </header>

    <section className="preparation-hero">
      <div className="preparation-copy">
        <span className="workspace-eyebrow"><WandSparkles /> {current ? t("workspace.inPreparation") : t("workspace.nextMessage")}</span>
        <h2>{current?.titulo || t("workspace.startInspiration")}</h2>
        <p>{current?.textoBase || t("workspace.startDescription")}</p>
        {current ? <><div className="workspace-progress"><span><b>68%</b> {t("workspace.progress")}</span><div><i /></div></div><Link to="/esbocos" className="workspace-primary">{t("workspace.continue")} <ChevronRight /></Link></> : <Link to="/oficina" className="workspace-primary">{t("workspace.startJourney")} <ChevronRight /></Link>}
      </div>
      <div className="preparation-steps">
        {preparationSteps.map((label, index) => <div className={index === 0 ? "done" : index === 1 ? "current" : ""} key={label}><span>{index === 0 ? "✓" : index + 1}</span><div><strong>{label}</strong><small>{index === 0 ? t("workspace.done") : index === 1 ? t("workspace.nextStep") : t("workspace.waiting")}</small></div></div>)}
      </div>
    </section>

    <div className="workspace-heading"><div><h3>{t("workspace.yourDesk")}</h3><p>{t("workspace.deskDescription")}</p></div><Link to="/esbocos">{t("workspace.viewMessages")} <ChevronRight /></Link></div>
    <section className="workspace-grid">
      <Link to="/biblia"><span className="workspace-card-icon"><BookOpen /></span><div><small>{t("workspace.biblicalResearch")}</small><h4>{current?.textoBase || t("sidebar.biblia.title")}</h4><p>{t("workspace.researchDescription")}</p></div><ChevronRight /></Link>
      <Link to="/devocional"><span className="workspace-card-icon"><Heart /></span><div><small>{t("workspace.momentWithGod")}</small><h4>{t("dashboard.verseOfDay")}</h4><p>{verse ? `${bookNames[verse.book - 1]} ${verse.chapter}:${verse.verse}` : t("workspace.todayReflection")}</p></div><ChevronRight /></Link>
      <Link to="/livraria"><span className="workspace-card-icon"><Library /></span><div><small>{t("workspace.library")}</small><h4>{lastRead?.volumeTitle || t("sidebar.livraria.title")}</h4><p>{lastRead ? t("workspace.readingProgress", { progress: Math.round(lastRead.progress) }) : t("workspace.libraryDescription")}</p></div><ChevronRight /></Link>
    </section>

    <section className="workspace-lower">
      <article className="workspace-verse">
        <span><Quote /> {t("dashboard.verseOfDay")}</span>
        <blockquote>{verse ? `“${verse.text}”` : t("workspace.loadingWord")}</blockquote>
        {verse && <cite>{bookNames[verse.book - 1]} {verse.chapter}:{verse.verse}</cite>}
      </article>
      <article className="workspace-agenda">
        <span><CalendarDays /> {t("workspace.ministryView")}</span><h4>{t("workspace.sermonsPrepared", { count: sermons.length })}</h4>
        <div><Play /><p><strong>{current?.titulo || t("workspace.firstMessage")}</strong><small>{current ? current.status || t("workspace.draft") : t("workspace.startNow")}</small></p><Link to={current ? "/esbocos" : "/oficina"}><ChevronRight /></Link></div>
      </article>
    </section>
  </div>;
};

export default Index;
