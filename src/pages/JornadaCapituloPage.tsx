import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, BookOpen, Check, Link2, MapPin, StickyNote, Users } from "lucide-react";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { getJourneySectionDetails } from "@/features/bible-journey/journey-details";
import { journeyProgressRepository } from "@/features/bible-journey/progress";
import type { JourneyBook } from "@/features/bible-journey/types";
import type { EditorialGenerationResult } from "@/features/bible-journey/editorial-generator";
import { getPublishedJourneyEditorial } from "@/features/bible-journey/published-editorial";
import "./JourneyDesign.css";

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
  return <div className="chapter-journey-page"><header><Link to={`/jornada/${testament}/${book.slug}`}><ArrowLeft /></Link><div><small>{book.overview[language].title} · {section?.content[language].title}</small><h1>{displayTitle}</h1><i><b style={{ width: `${chapterProgress}%` }} /></i></div><span>{chapterNumber}/{book.chapterCount}</span></header><main><article className="chapter-reading"><span>{t("journey.chapterOverview")}</span><h2>{displayTitle}</h2><p>{displaySummary}</p>
{editorial ? <section className="chapter-editorial"><span>{t("journey.themes")}</span><h3>{editorial.keyTheme}</h3><div className="chapter-editorial-meta"><p><Users />{editorial.characters.join(" · ")}</p><p><MapPin />{editorial.places.join(" · ")}</p></div><div className="chapter-editorial-references">{editorial.relatedReferences.map(reference => <b key={reference}>{reference}</b>)}</div><div className="chapter-editorial-connections"><p><ArrowLeft />{editorial.previousConnection}</p><p>{editorial.nextConnection}<ArrowRight /></p></div></section> : details && <section className="chapter-context"><small>{section?.content[language].title}</small><p>{details.event}</p><div><span><Users />{details.characters.join(" · ")}</span><span><MapPin />{details.place}</span></div><footer><Link2 />{details.connection}</footer></section>}<Link to={`/biblia?bookId=${book.bibleBookId}&chapter=${chapterNumber}`}><BookOpen />{t("journey.readBible")}<ArrowRight /></Link><blockquote><small>{t("journey.reflect")}</small>{reflectionPrompt}</blockquote>
<nav className="chapter-step-navigation">{previousChapter ? <Link to={`/jornada/${testament}/${book.slug}/capitulos/${previousChapter.number}`}><ArrowLeft /><span><small>{previousChapter.number}</small>{previousChapter.content[language].title}</span></Link> : previousBook ? <Link to={`/jornada/${previousBook.testament}/${previousBook.slug}/capitulos/${previousBook.chapterCount}`}><ArrowLeft /><span><small>{previousBook.overview[language].title}</small>{previousBook.chapters[previousBook.chapterCount - 1].content[language].title}</span></Link> : <span />}{nextChapter ? <Link to={`/jornada/${testament}/${book.slug}/capitulos/${nextChapter.number}`}><span><small>{nextChapter.number}</small>{nextChapter.content[language].title}</span><ArrowRight /></Link> : nextBook ? <Link className="next-book-step" to={`/jornada/${nextBook.testament}/${nextBook.slug}/capitulos/1`}><span><small>{nextBook.overview[language].title}</small>{nextBook.chapters[0].content[language].title}</span><ArrowRight /></Link> : null}</nav>
</article><aside><label><StickyNote />{t("journey.myNotes")}</label><textarea value={note} onChange={e => saveNote(e.target.value)} placeholder={t("journey.notesPlaceholder")} /><button className={completed ? "completed" : ""} onClick={toggleComplete}><Check />{completed ? t("journey.completedChapter") : t("journey.markComplete")}</button></aside></main></div>;
}
