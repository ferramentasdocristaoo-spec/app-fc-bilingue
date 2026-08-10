import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Check, Compass, Feather, Link2, MapPin, Users } from "lucide-react";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { getJourneySectionDetails } from "@/features/bible-journey/journey-details";
import { journeyProgressForBook, journeyProgressRepository } from "@/features/bible-journey/progress";
import type { JourneyBook } from "@/features/bible-journey/types";
import { journeyCategoryLabel } from "@/features/bible-journey/category-labels";
import "./JourneyDesign.css";
import "./JourneyTimeline.css";

export default function JornadaLivroPage() {
  const { bookSlug, testament } = useParams(); const { t, i18n } = useTranslation();
  const language = normalizeJourneyLanguage(i18n.resolvedLanguage || i18n.language);
  const [book, setBook] = useState<JourneyBook | null>();
  const [allBooks, setAllBooks] = useState<JourneyBook[]>([]);
  useEffect(() => { journeyCatalogRepository.getBook(bookSlug || "").then(setBook); journeyCatalogRepository.listBooks().then(setAllBooks); }, [bookSlug]);
  if (book === undefined) return <div className="journey-loading">{t("common.loading")}</div>;
  if (!book) return <div className="journey-loading">{t("notFound.title")}</div>;
  const overview = book.overview[language];
  const progress = journeyProgressForBook(journeyProgressRepository.getState(), book.slug, book.chapterCount);
  const bookIndex = allBooks.findIndex(item => item.slug === book.slug);
  const previousBook = bookIndex > 0 ? allBooks[bookIndex - 1] : undefined;
  const nextBook = bookIndex >= 0 ? allBooks[bookIndex + 1] : undefined;

  return <div className="journey-book-page">
    <header className="journey-book-hero"><Link to="/jornada"><ArrowLeft /></Link><div className="journey-book-emblem"><BookOpen /><span>{String(book.position).padStart(2, "0")}</span></div><div><small>{journeyCategoryLabel(book.category, language)} · {book.chapterCount} {t("journey.chapters")}</small><h1>{overview.title}</h1><p>{overview.description}</p></div><div className="journey-progress-ring"><strong>{progress.percentage}%</strong><span>{t("journey.completed")}</span></div></header>
    <main className="journey-book-content">
      <section className="overview-layout">
        <article className="overview-main"><span>{t("journey.aboutBook")}</span><p>{overview.context}</p><div className="overview-facts"><div><Feather /><span>{t("journey.author")}</span><strong>{overview.author}</strong></div><div><Calendar /><span>{t("journey.date")}</span><strong>{overview.date}</strong></div><div><Compass /><span>{t("journey.nameOrigin")}</span><strong>{overview.nameOrigin}</strong></div></div></article>
        <aside><section><span>{t("journey.themes")}</span><div className="journey-tags">{overview.themes.map(v => <b key={v}>{v}</b>)}</div></section><section><span><Users />{t("journey.characters")}</span><p>{overview.characters.join(" · ")}</p></section><section><span><Check />{t("journey.principles")}</span><ul>{overview.principles.map(v => <li key={v}>{v}</li>)}</ul></section></aside>
      </section>
      <section className="timeline-section"><header><span>{t("journey.timeline")}</span><h2>{t("journey.bookJourney")}</h2></header><div className="journey-timeline">{book.sections.map((section, index) => <article key={section.slug}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{section.startChapter}-{section.endChapter}</small><h3>{section.content[language].title}</h3><p>{section.content[language].description}</p></div></article>)}</div><div className="journey-story-grid">{book.sections.map((section, index) => { const details = getJourneySectionDetails(book, section, language); if (!details) return null; return <article key={section.slug}><header><span>{String(index + 1).padStart(2, "0")}</span><div><small>{t("journey.timeline")}</small><h3>{section.content[language].title}</h3></div><b>{section.startChapter}-{section.endChapter}</b></header><p>{details.event}</p><div className="journey-story-meta"><span><Users />{details.characters.join(" · ")}</span><span><MapPin />{details.place}</span></div><footer><Link2 /><span>{details.connection}</span></footer></article>; })}</div></section>
      <section className="chapter-map"><header><h2>{t("journey.chapterByChapter")}</h2><p>{t("journey.chapterDescription")}</p></header><div>{book.chapters.map(chapter => { const done = journeyProgressRepository.getState().chapters[`${book.slug}:${chapter.number}`]?.completed; return <Link className={done ? "done" : ""} to={`/jornada/${testament}/${book.slug}/capitulos/${chapter.number}`} key={chapter.number}><span>{chapter.number}</span><strong>{chapter.content[language].title}</strong>{done ? <Check /> : <ArrowRight />}</Link>; })}</div></section>
      <nav className="book-journey-navigation">{previousBook ? <Link to={`/jornada/${previousBook.testament}/${previousBook.slug}`}><ArrowLeft /><span><small>{String(previousBook.position).padStart(2, "0")}</small><strong>{previousBook.overview[language].title}</strong><p>{previousBook.overview[language].description}</p></span></Link> : <span />}{nextBook && <Link to={`/jornada/${nextBook.testament}/${nextBook.slug}`}><span><small>{String(nextBook.position).padStart(2, "0")}</small><strong>{nextBook.overview[language].title}</strong><p>{nextBook.overview[language].description}</p></span><ArrowRight /></Link>}</nav>
    </main>
  </div>;
}
