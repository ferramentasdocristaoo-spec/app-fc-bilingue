import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, CheckCircle2, Map, Sparkles } from "lucide-react";
import PageShell from "@/components/PageShell";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { journeyProgressForBook, journeyProgressRepository } from "@/features/bible-journey/progress";
import type { JourneyBook } from "@/features/bible-journey/types";
import { journeyCategoryLabel } from "@/features/bible-journey/category-labels";
import "./JourneyDesign.css";

export default function JornadaPage() {
  const { t, i18n } = useTranslation();
  const language = normalizeJourneyLanguage(i18n.resolvedLanguage || i18n.language);
  const [books, setBooks] = useState<JourneyBook[]>([]);
  useEffect(() => { journeyCatalogRepository.listBooks().then(setBooks); }, []);

  return <PageShell title={t("journey.title")}>
    <div className="journey-home">
      <section className="journey-hero">
        <div><span><Sparkles />{t("journey.eyebrow")}</span><h2>{t("journey.heroTitle")}</h2><p>{t("journey.heroDescription")}</p></div>
        <div className="journey-total"><strong>66</strong><span>{t("journey.books")}</span><i /><strong>1.189</strong><span>{t("journey.chapters")}</span></div>
      </section>
      <section className="testament-grid">
        <article><div className="testament-icon"><Map /></div><span>01</span><h3>{t("journey.oldTestament")}</h3><p>{t("journey.oldDescription")}</p><small>39 {t("journey.books")}</small></article>
        <article><div className="testament-icon"><BookOpen /></div><span>02</span><h3>{t("journey.newTestament")}</h3><p>{t("journey.newDescription")}</p><small>27 {t("journey.books")}</small></article>
      </section>
      <header className="journey-section-head"><div><h3>{t("journey.title")}</h3><p>{books.length}/66 {t("journey.books")}</p></div></header>
      <section className="journey-book-grid">
        {books.map((book) => {
          const overview = book.overview[language];
          const progress = journeyProgressForBook(journeyProgressRepository.getState(), book.slug, book.chapterCount);
          return <Link to={`/jornada/${book.testament}/${book.slug}`} key={book.slug}>
            <div className="journey-book-art"><BookOpen /><span>{String(book.position).padStart(2, "0")}</span></div>
            <div className="journey-book-copy"><small>{journeyCategoryLabel(book.category, language)}</small><h3>{overview.title}</h3><p>{overview.description}</p><div className="journey-book-progress"><span>{progress.percentage}%</span><div><i style={{ width: `${progress.percentage}%` }} /></div></div></div>
            {progress.percentage === 100 ? <CheckCircle2 /> : <ArrowRight />}
          </Link>;
        })}
      </section>
    </div>
  </PageShell>;
}
