import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { journeyProgressForBook, journeyProgressRepository } from "@/features/bible-journey/progress";
import type { JourneyBook } from "@/features/bible-journey/types";
import { journeyCategoryLabel } from "@/features/bible-journey/category-labels";
import { JourneyStepper } from "@/components/journey/JourneyStepper";
import { JourneyMovement } from "@/components/journey/JourneyMovement";
import { defaultSectionSlug } from "@/components/journey/journey-utils";
import "./JourneyDesign.css";

export default function JornadaLivroPage() {
  const { bookSlug, testament } = useParams(); const { t, i18n } = useTranslation();
  const language = normalizeJourneyLanguage(i18n.resolvedLanguage || i18n.language);
  const [book, setBook] = useState<JourneyBook | null>();
  const [allBooks, setAllBooks] = useState<JourneyBook[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [, setRevision] = useState(0); // re-render quando o quiz muda o progresso guardado
  useEffect(() => { journeyCatalogRepository.getBook(bookSlug || "").then(setBook); journeyCatalogRepository.listBooks().then(setAllBooks); }, [bookSlug]);
  const { hash } = useLocation();
  // Vindo do capítulo ("Ver no mapa"): o livro carrega de forma assíncrona, por isso o salto à âncora é manual.
  useEffect(() => { if (book && hash === "#jornada-movimento") document.getElementById("jornada-movimento")?.scrollIntoView({ block: "start" }); }, [book, hash]);
  if (book === undefined) return <div className="journey-loading">{t("common.loading")}</div>;
  if (!book) return <div className="journey-loading">{t("notFound.title")}</div>;
  const overview = book.overview[language];
  const progressState = journeyProgressRepository.getState();
  const progress = journeyProgressForBook(progressState, book.slug, book.chapterCount);
  const isDone = (number: number) => Boolean(progressState.chapters[`${book.slug}:${number}`]?.completed);
  // "Atual" = primeiro capítulo ainda não concluído, só quando já há progresso.
  const currentChapter = progress.completed > 0 ? book.chapters.find(chapter => !isDone(chapter.number))?.number : undefined;
  const bookIndex = allBooks.findIndex(item => item.slug === book.slug);
  const previousBook = bookIndex > 0 ? allBooks[bookIndex - 1] : undefined;
  const nextBook = bookIndex >= 0 ? allBooks[bookIndex + 1] : undefined;
  const requestedSlug = searchParams.get("movimento");
  const activeSection = book.sections.find(item => item.slug === requestedSlug) ?? book.sections.find(item => item.slug === defaultSectionSlug(book, progressState)) ?? book.sections[0];
  const selectSection = (slug: string) => {
    const next = new URLSearchParams(searchParams); next.set("movimento", slug);
    setSearchParams(next, { replace: true });
  };
  const testamentLabel = book.testament === "old-testament" ? t("journey.oldTestament") : t("journey.newTestament");

  return <div className="journey-book-page">
    <main className="journey-book-content">
      <Link to="/jornada" className="ed-link journey-back">← {t("journey.title")}</Link>

      <header className="journey-opener">
        <div className="journey-bignum" aria-hidden>{String(book.position).padStart(2, "0")}</div>
        <div className="journey-opener-title">
          <span className="ed-eyebrow">{testamentLabel} · {journeyCategoryLabel(book.category, language)}</span>
          <h1>{overview.title}</h1>
          <p className="ed-lede">{overview.description}</p>
        </div>
        <div className="journey-opener-meta">
          <strong>{progress.completed} / {progress.total}</strong>
          <span>{t("journey.chapters")}</span>
          <div className="journey-rule-bar" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.completed}><i style={{ width: `${progress.percentage}%` }} /></div>
        </div>
      </header>

      <section className="journey-about" aria-label={t("journey.aboutBook")}>
        <div>
          <p className="ed-prose journey-dropcap">{overview.context}</p>
          {overview.principles.length > 0 && <>
            <h2 className="ed-eyebrow journey-principles-title">{t("journey.principles")}</h2>
            <ul className="journey-principles">{overview.principles.map(v => <li key={v}>{v}</li>)}</ul>
          </>}
        </div>
        <dl className="journey-margin-note">
          <dt>{t("journey.author")}</dt><dd>{overview.author}</dd>
          <dt>{t("journey.date")}</dt><dd>{overview.date}</dd>
          <dt>{t("journey.nameOrigin")}</dt><dd>{overview.nameOrigin}</dd>
          {overview.themes.length > 0 && <><dt>{t("journey.themes")}</dt><dd>{overview.themes.join(" · ")}</dd></>}
          {overview.characters.length > 0 && <><dt>{t("journey.characters")}</dt><dd>{overview.characters.join(", ")}</dd></>}
        </dl>
      </section>

      <div className="ed-orn" aria-hidden>✦</div>

      <section aria-labelledby="journey-movements-title">
        <h2 id="journey-movements-title" className="journey-h2">{t("journey.bookJourney")}</h2>
        <JourneyStepper book={book} language={language} progress={progressState} activeSlug={activeSection?.slug} onSelect={selectSection} />
        {activeSection && <JourneyMovement book={book} section={activeSection} language={language} testament={testament || book.testament} onProgressChange={() => setRevision(value => value + 1)} />}
      </section>

      <div className="ed-orn" aria-hidden>✦</div>

      <section aria-labelledby="journey-chapters-title">
        <h2 id="journey-chapters-title" className="journey-h2">{t("journey.chapterByChapter")}</h2>
        <p className="journey-h2-sub">{t("journey.chapterDescription")}</p>
        <ol className="journey-chapters">
          {book.chapters.map(chapter => {
            const done = isDone(chapter.number);
            const now = chapter.number === currentChapter;
            return <li key={chapter.number}>
              <Link className={done ? "done" : now ? "now" : undefined} aria-current={now ? "step" : undefined} to={`/jornada/${testament}/${book.slug}/capitulos/${chapter.number}`}>
                <b>{chapter.number}</b>
                <span>{chapter.content[language].title}</span>
                {done && <i aria-label={t("journey.completedChapter")}>✓</i>}
              </Link>
            </li>;
          })}
        </ol>
      </section>

      <nav className="journey-book-nav" aria-label={t("journey.title")}>
        {previousBook ? <Link to={`/jornada/${previousBook.testament}/${previousBook.slug}`}>
          <small>← {String(previousBook.position).padStart(2, "0")}</small>
          <strong>{previousBook.overview[language].title}</strong>
        </Link> : <span />}
        {nextBook && <Link to={`/jornada/${nextBook.testament}/${nextBook.slug}`} className="is-next">
          <small>{String(nextBook.position).padStart(2, "0")} →</small>
          <strong>{nextBook.overview[language].title}</strong>
        </Link>}
      </nav>
    </main>
  </div>;
}
