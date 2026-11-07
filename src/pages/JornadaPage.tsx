import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { journeyProgressForBook, journeyProgressRepository } from "@/features/bible-journey/progress";
import type { JourneyBook, TestamentSlug } from "@/features/bible-journey/types";
import { journeyCategoryLabel } from "@/features/bible-journey/category-labels";
import "./JourneyDesign.css";

interface CategoryGroup { category: string; books: JourneyBook[] }

/** Agrupa os livros de um testamento por categoria, mantendo a ordem canônica. */
const groupByCategory = (books: JourneyBook[], testament: TestamentSlug): CategoryGroup[] => {
  const groups: CategoryGroup[] = [];
  books
    .filter((book) => book.testament === testament)
    .sort((a, b) => a.position - b.position)
    .forEach((book) => {
      const last = groups.at(-1);
      if (last && last.category === book.category) last.books.push(book);
      else groups.push({ category: book.category, books: [book] });
    });
  return groups;
};

export default function JornadaPage() {
  const { t, i18n } = useTranslation();
  const language = normalizeJourneyLanguage(i18n.resolvedLanguage || i18n.language);
  const [books, setBooks] = useState<JourneyBook[]>([]);
  useEffect(() => { journeyCatalogRepository.listBooks().then(setBooks); }, []);

  const progressState = journeyProgressRepository.getState();
  const testaments = useMemo(() => [
    { slug: "old-testament" as const, numeral: "I", title: t("journey.oldTestament"), description: t("journey.oldDescription"), groups: groupByCategory(books, "old-testament") },
    { slug: "new-testament" as const, numeral: "II", title: t("journey.newTestament"), description: t("journey.newDescription"), groups: groupByCategory(books, "new-testament") },
  ], [books, t]);

  return <PageShell title={t("journey.heroTitle")} lede={t("journey.heroDescription")}>
    <div className="journey-home">
      <header className="journey-opening">
        <p className="journey-count"><strong>66</strong> {t("journey.books")} <span aria-hidden>·</span> <strong>1.189</strong> {t("journey.chapters")}</p>
        <nav className="journey-testament-jump" aria-label={t("journey.title")}>
          {testaments.map((testament) => <a key={testament.slug} href={`#${testament.slug}`}>{testament.title}</a>)}
        </nav>
      </header>

      {testaments.map((testament) => {
        const count = testament.groups.reduce((total, group) => total + group.books.length, 0);
        return <section className="journey-toc" id={testament.slug} key={testament.slug} aria-labelledby={`${testament.slug}-title`}>
          <header className="journey-toc-head">
            <span className="ed-num">{testament.numeral}</span>
            <div>
              <h2 id={`${testament.slug}-title`}>{testament.title}</h2>
              <p>{testament.description}</p>
            </div>
            <small>{count} {t("journey.books")}</small>
          </header>

          {testament.groups.map((group) => <div className="journey-toc-group" key={`${testament.slug}-${group.category}-${group.books[0].slug}`}>
            <h3 className="ed-eyebrow">{journeyCategoryLabel(group.category, language)}</h3>
            <ol>
              {group.books.map((book) => {
                const overview = book.overview[language];
                const progress = journeyProgressForBook(progressState, book.slug, book.chapterCount);
                const status = progress.completed === 0
                  ? `${book.chapterCount} ${t("journey.chapters")}`
                  : progress.completed === progress.total ? "✓" : `${progress.completed}/${progress.total}`;
                return <li key={book.slug}>
                  <Link to={`/jornada/${book.testament}/${book.slug}`} className={progress.completed > 0 ? "has-progress" : undefined}>
                    <span className="ed-num">{String(book.position).padStart(2, "0")}</span>
                    <span className="journey-toc-copy">
                      <strong>{overview.title}</strong>
                      <span>{overview.description}</span>
                    </span>
                    <span className="journey-toc-status">{status}</span>
                  </Link>
                </li>;
              })}
            </ol>
          </div>)}
        </section>;
      })}
    </div>
    <p className="journey-sources-link"><Link className="ed-link" to="/jornada/fontes">{t("journey.sources")}</Link></p>
  </PageShell>;
}
