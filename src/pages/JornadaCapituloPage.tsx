import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { getJourneySectionDetails } from "@/features/bible-journey/journey-details";
import { journeyProgressRepository } from "@/features/bible-journey/progress";
import type { JourneyBook } from "@/features/bible-journey/types";
import type { EditorialGenerationResult } from "@/features/bible-journey/editorial-generator";
import { getPublishedJourneyEditorial } from "@/features/bible-journey/published-editorial";
import { JourneyStepper } from "@/components/journey/JourneyStepper";
import { getJourneyInteractive } from "@/features/bible-journey/interactive";
import "@/components/journey/JourneyInteractive.css";
import "./JourneyDesign.css";
import "./JourneyTimeline.css";

export default function JornadaCapituloPage() {
  const { bookSlug, chapter: rawChapter, testament } = useParams(); const chapterNumber = Number(rawChapter);
  const { t, i18n } = useTranslation(); const language = normalizeJourneyLanguage(i18n.resolvedLanguage || i18n.language);
  const [book, setBook] = useState<JourneyBook | null>(); const [allBooks, setAllBooks] = useState<JourneyBook[]>([]); const [note, setNote] = useState(""); const [completed, setCompleted] = useState(false); const [published, setPublished] = useState<EditorialGenerationResult | null>(null);
  useEffect(() => { journeyCatalogRepository.getBook(bookSlug || "").then(setBook); journeyCatalogRepository.listBooks().then(setAllBooks); }, [bookSlug]);
  useEffect(() => { if (!bookSlug || !chapterNumber) return; journeyProgressRepository.openChapter(bookSlug, chapterNumber); const state = journeyProgressRepository.getState().chapters[`${bookSlug}:${chapterNumber}`]; setNote(state?.note || ""); setCompleted(Boolean(state?.completed)); }, [bookSlug, chapterNumber]);
  useEffect(() => { if (!bookSlug || !chapterNumber) return; let active = true; getPublishedJourneyEditorial(bookSlug, chapterNumber, language).then(value => { if (active) setPublished(value); }); return () => { active = false; }; }, [bookSlug, chapterNumber, language]);
  if (book === undefined) return <div className="journey-loading">{t("common.loading")}</div>;
  const chapter = book?.chapters.find(item => item.number === chapterNumber); if (!book || !chapter) return <div className="journey-loading">{t("notFound.title")}</div>;
  const content = chapter.content[language]; const section = book.sections.find(item => item.slug === chapter.sectionSlug);
  const details = section ? getJourneySectionDetails(book, section, language) : undefined;
  const previousChapter = chapterNumber > 1 ? book.chapters[chapterNumber - 2] : undefined;
  const nextChapter = chapterNumber < book.chapterCount ? book.chapters[chapterNumber] : undefined;
  const bookIndex = allBooks.findIndex(item => item.slug === book.slug);
  const previousBook = bookIndex > 0 ? allBooks[bookIndex - 1] : undefined;
  const nextBook = bookIndex >= 0 ? allBooks[bookIndex + 1] : undefined;
  const chapterProgress = Math.round((chapterNumber / book.chapterCount) * 100);
  const editorial = published ? { keyTheme: published.keyTheme, characters: published.characters, places: published.places, relatedReferences: published.relatedReferences, previousConnection: published.previousConnection, nextConnection: published.nextConnection } : content.editorial;
  const displayTitle = published?.title || content.title; const displaySummary = published?.summary || content.description; const reflectionPrompt = published?.reflectionPrompt || content.reflectionPrompt;
  const saveNote = (value: string) => { setNote(value); journeyProgressRepository.saveNote(book.slug, chapterNumber, value); };
  const toggleComplete = () => { const value = !completed; setCompleted(value); journeyProgressRepository.setCompleted(book.slug, chapterNumber, value); };
  const nomesLista = (items: string[]) => items.join(" · ");
  return <div className="chapter-journey-page">
    <header className="chapter-head">
      <Link className="ed-link chapter-back" to={`/jornada/${testament}/${book.slug}`}>← {book.overview[language].title}</Link>
      <p className="chapter-crumb"><span className="ed-num" aria-hidden>{chapterNumber}</span>{t("journey.chapterProgress", { current: chapterNumber, total: book.chapterCount })}{section ? ` · ${section.content[language].title}` : ""}</p>
      <h1>{displayTitle}</h1>
      <div className="journey-rule-bar" role="progressbar" aria-label={t("journey.chapters")} aria-valuemin={0} aria-valuemax={book.chapterCount} aria-valuenow={chapterNumber}><i style={{ width: `${chapterProgress}%` }} /></div>
    </header>
    <div className="chapter-journey-steps"><JourneyStepper compact book={book} language={language} progress={journeyProgressRepository.getState()} activeSlug={section?.slug} hrefFor={slug => `/jornada/${testament}/${book.slug}?movimento=${slug}#jornada-movimento`} />{section && getJourneyInteractive(book.slug, section.slug) && <Link className="ed-link" to={`/jornada/${testament}/${book.slug}?movimento=${section.slug}#jornada-movimento`}>{t("journey.seeOnMap")}</Link>}</div>
    <div className="chapter-layout">
      <article className="chapter-reading">
        <p className="chapter-summary">{displaySummary}</p>
        {editorial ? <section className="chapter-context">
          <span className="ed-eyebrow">{t("journey.themes")}</span>
          <h2>{editorial.keyTheme}</h2>
          <dl>
            <div><dt>{t("journey.charactersLabel")}</dt><dd>{nomesLista(editorial.characters)}</dd></div>
            <div><dt>{t("journey.placesLabel")}</dt><dd>{nomesLista(editorial.places)}</dd></div>
            {editorial.relatedReferences.length > 0 && <div><dt>{t("journey.referencesLabel")}</dt><dd className="italic">{nomesLista(editorial.relatedReferences)}</dd></div>}
          </dl>
          <p className="chapter-connection">{editorial.previousConnection}</p>
          <p className="chapter-connection">{editorial.nextConnection}</p>
        </section> : details && <section className="chapter-context">
          <span className="ed-eyebrow">{section?.content[language].title}</span>
          <p className="chapter-event">{details.event}</p>
          <dl>
            <div><dt>{t("journey.charactersLabel")}</dt><dd>{nomesLista(details.characters)}</dd></div>
            <div><dt>{t("journey.placesLabel")}</dt><dd>{details.place}</dd></div>
          </dl>
          <p className="chapter-connection">{details.connection}</p>
        </section>}
        <Link className="ed-btn ed-btn-primary" to={`/biblia?bookId=${book.bibleBookId}&chapter=${chapterNumber}`}>{t("journey.readBible")} <span aria-hidden>→</span></Link>
        <blockquote><small>{t("journey.reflect")}</small>{reflectionPrompt}</blockquote>
        <nav className="chapter-step-navigation" aria-label={t("journey.chapters")}>{previousChapter ? <Link to={`/jornada/${testament}/${book.slug}/capitulos/${previousChapter.number}`}><ArrowLeft aria-hidden /><span><small>{previousChapter.number}</small>{previousChapter.content[language].title}</span></Link> : previousBook ? <Link to={`/jornada/${previousBook.testament}/${previousBook.slug}/capitulos/${previousBook.chapterCount}`}><ArrowLeft aria-hidden /><span><small>{previousBook.overview[language].title}</small>{previousBook.chapters[previousBook.chapterCount - 1].content[language].title}</span></Link> : <span />}{nextChapter ? <Link to={`/jornada/${testament}/${book.slug}/capitulos/${nextChapter.number}`}><span><small>{nextChapter.number}</small>{nextChapter.content[language].title}</span><ArrowRight aria-hidden /></Link> : nextBook ? <Link className="next-book-step" to={`/jornada/${nextBook.testament}/${nextBook.slug}/capitulos/1`}><span><small>{nextBook.overview[language].title}</small>{nextBook.chapters[0].content[language].title}</span><ArrowRight aria-hidden /></Link> : null}</nav>
      </article>
      <aside className="chapter-notes">
        <label htmlFor="chapter-note">{t("journey.myNotes")}</label>
        <textarea id="chapter-note" value={note} onChange={e => saveNote(e.target.value)} placeholder={t("journey.notesPlaceholder")} />
        <p className="ed-hint">{t("journey.notesSaved")}</p>
        <button type="button" className={`ed-btn ${completed ? "ed-btn-primary" : "ed-btn-ghost"}`} aria-pressed={completed} onClick={toggleComplete}>{completed && <Check aria-hidden className="h-4 w-4" />}{completed ? t("journey.completedChapter") : t("journey.markComplete")}</button>
      </aside>
    </div>
  </div>;
}
