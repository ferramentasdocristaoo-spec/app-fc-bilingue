import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ArrowRight, Map, List, BookOpen } from "lucide-react";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { journeyProgressForBook, journeyProgressRepository } from "@/features/bible-journey/progress";
import type { JourneyBook, TestamentSlug } from "@/features/bible-journey/types";
import { journeyCategoryLabel } from "@/features/bible-journey/category-labels";
import { useJourneyBookTitle } from "@/components/journey/use-book-title";
import { sectionProgress } from "@/components/journey/journey-utils";
import "./JourneyDesign.css";
import "./JornadaTrilha.css";

interface CategoryGroup {
  category: string;
  books: JourneyBook[];
}

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

// Mesmas chaves do catálogo e de `journeyCategoryLabel` (antes havia chaves soltas, que apareciam cruas: "poetry-wisdom").
const CATEGORIAS_TRILHA = [
  "pentateuch",
  "historical",
  "wisdom",
  "major_prophet",
  "minor_prophet",
  "gospel",
  "history",
  "pauline",
  "general",
  "apocalyptic",
];

// Capa do cartão do livro em destaque (antes era sempre o tabernáculo do Êxodo, mesmo para Gênesis).
const CAPAS: Record<string, string> = {
  genesis: "/jornada/genesis/dore-001-criacao-da-luz.webp",
  exodo: "/jornada/exodo/tabernaculo-cima-v2.webp",
};

export default function JornadaPage() {
  const { t, i18n } = useTranslation();
  const language = normalizeJourneyLanguage(i18n.resolvedLanguage || i18n.language);
  const bookTitle = useJourneyBookTitle(language);
  const [books, setBooks] = useState<JourneyBook[]>([]);
  const [viewMode, setViewMode] = useState<"trilha" | "lista">("trilha");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("pentateuch");

  useEffect(() => {
    journeyCatalogRepository.listBooks().then(setBooks);
  }, []);

  const progressState = journeyProgressRepository.getState();

  const testaments = useMemo(
    () => [
      {
        slug: "old-testament" as const,
        numeral: "I",
        title: t("journey.oldTestament"),
        description: t("journey.oldDescription"),
        groups: groupByCategory(books, "old-testament"),
      },
      {
        slug: "new-testament" as const,
        numeral: "II",
        title: t("journey.newTestament"),
        description: t("journey.newDescription"),
        groups: groupByCategory(books, "new-testament"),
      },
    ],
    [books, t]
  );

  // Livro em destaque para a Trilha (padrão Êxodo ou o primeiro com progresso)
  const livroDestaque = useMemo(() => {
    const exodo = books.find((b) => b.slug === "exodo");
    if (exodo) return exodo;
    if (books.length > 0) return books[0];
    return {
      slug: "exodo",
      bibleBookId: 2,
      position: 2,
      chapterCount: 40,
      testament: "old-testament" as const,
      category: "pentateuch",
      overview: {
        [language]: {
          title: t("journey.exodusFallbackTitle"),
          description: t("journey.exodusFallbackDescription"),
        },
      },
    } as unknown as JourneyBook;
  }, [books, language, t]);

  const progressoLivro = livroDestaque
    ? journeyProgressForBook(progressState, livroDestaque.slug, livroDestaque.chapterCount)
    : { completed: 0, total: 40 };
  // Movimento atual = primeiro com capítulos por concluir (antes o texto era fixo: "movimento 3", "25 paragens").
  const secoes = livroDestaque?.sections ?? [];
  const idxMovimento = secoes.findIndex((secao) => {
    const p = sectionProgress(progressState, livroDestaque!.slug, secao);
    return p.done < p.total;
  });
  const movimentoAtual = idxMovimento === -1 ? Math.max(secoes.length, 1) : idxMovimento + 1;
  const capaLivro = livroDestaque ? CAPAS[livroDestaque.coverKey ?? livroDestaque.slug] : undefined;

  return (
    <div className="jornada-trilha">
      {/* Cabeçalho com link voltar e alternador Trilha / Lista */}
      <header className="jornada-head">
        <Link to="/" className="jornada-back-link">
          <ChevronLeft />
          <span>{t("journey.title")}</span>
        </Link>

        <button
          type="button"
          className="jornada-view-toggle"
          onClick={() => setViewMode((m) => (m === "trilha" ? "lista" : "trilha"))}
        >
          {viewMode === "trilha" ? (
            <>
              <List size={16} className="inline mr-1" /> {t("journey.listView")}
            </>
          ) : (
            <>
              <Map size={16} className="inline mr-1" /> {t("journey.trailView")}
            </>
          )}
        </button>
      </header>

      {/* Faixa das 3 etapas arredondada (Etapa 2 Estudo e Biblioteca ativa) */}
      <nav className="jornada-stages" aria-label={t("home.stagesLabel")}>
        <ol>
          <li>
            <Link to="/oficina">
              <i>1</i>
              <span>{t("workspace.groups.preparation")}</span>
            </Link>
          </li>
          <li>
            <Link to="/jornada" className="is-active" aria-current="step">
              <i>2</i>
              <span>{t("workspace.groups.study")}</span>
            </Link>
          </li>
          <li>
            <Link to="/devocional">
              <i>3</i>
              <span>{t("workspace.groups.life")}</span>
            </Link>
          </li>
        </ol>
      </nav>

      {/* ----------------- MODO TRILHA COM MAPA ARREDONDADO ----------------- */}
      {viewMode === "trilha" && livroDestaque && (
        <div>
          <div className="jornada-grid">
            {/* Mapa Interativo da Jornada */}
            <div className="jornada-map-card">
              <svg className="jornada-map-svg" viewBox="0 0 350 270" preserveAspectRatio="none">
                <path
                  d="M0 60 C60 50 90 80 120 75 C150 70 160 35 200 25 L200 0 L0 0Z"
                  fill="#dfe6e4"
                  stroke="#9fb0ad"
                />
                <path
                  d="M140 270 L175 165 L205 110 L215 90 L230 120 L215 185 L200 270Z"
                  fill="#dfe6e4"
                  stroke="#9fb0ad"
                />
                <path
                  d="M60 270 C70 215 80 160 95 100"
                  stroke="#9fb0ad"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M95 110 C130 125 170 125 200 135 C215 155 230 190 250 205 C270 180 285 135 300 110 C305 90 310 75 312 62"
                  stroke="#583f14"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                  fill="none"
                />
                <g fill="#16243b">
                  <circle cx="95" cy="110" r="6" />
                  <circle cx="200" cy="135" r="6" />
                  <circle cx="250" cy="205" r="7" />
                  <circle cx="300" cy="110" r="6" />
                  <circle cx="312" cy="62" r="6" />
                </g>
                <circle cx="250" cy="205" r="14" fill="none" stroke="#583f14" strokeWidth="2.5" />
              </svg>

              <span className="jornada-map-label" style={{ left: "22px", top: "118px" }}>
                {t("journey.mapEgypt")}
              </span>
              <span className="jornada-map-label" style={{ left: "120px", top: "146px" }}>
                {t("journey.mapRedSea")}
              </span>
              <span className="jornada-map-label" style={{ left: "200px", top: "226px" }}>
                {t("journey.mapSinai")}
              </span>
              <span className="jornada-map-label" style={{ left: "196px", top: "76px" }}>
                {t("journey.mapKadesh")}
              </span>
              <span className="jornada-map-label" style={{ left: "270px", top: "24px" }}>
                {t("journey.mapNebo")}
              </span>
            </div>

            {/* Painel lateral: abas de categorias + cartão do livro + continuar */}
            <div className="jornada-sidebar">
              {/* Abas roláveis dos grupos */}
              <div className="jornada-group-tabs">
                {CATEGORIAS_TRILHA.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`jornada-group-pill ${categoriaAtiva === cat ? "is-active" : ""}`}
                    onClick={() => setCategoriaAtiva(cat)}
                  >
                    {journeyCategoryLabel(cat, language)}
                  </button>
                ))}
              </div>

              {/* Cartão do Livro Atual */}
              <div className="jornada-book-card">
                {capaLivro && (
                  <img
                    src={capaLivro}
                    alt={bookTitle(livroDestaque)}
                    className="jornada-book-cover"
                    onError={(e) => {
                      // Fallback suave
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                )}
                <div>
                  <div className="jornada-book-kicker">
                    {journeyCategoryLabel(livroDestaque.category, language)} · {t("journey.bookNumber", { number: livroDestaque.position })}
                  </div>
                  <h3 className="jornada-book-title">{bookTitle(livroDestaque)}</h3>
                  <p className="jornada-book-desc">{livroDestaque.overview[language].description}</p>
                  {secoes.length > 0 && (
                    <p className="jornada-book-stats">
                      {t("journey.bookStats", { movements: secoes.length, chapters: livroDestaque.chapterCount })}
                    </p>
                  )}
                </div>
              </div>

              {/* Botão de Continuar Jornada */}
              <Link
                to={`/jornada/${livroDestaque.testament}/${livroDestaque.slug}`}
                className="jornada-continue-btn"
              >
                <span>
                  {progressoLivro.completed > 0
                    ? t("journey.continueMovement", { number: movimentoAtual })
                    : t("journey.startJourney")}
                </span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODO LISTA COMPLETA (TOC) ----------------- */}
      {viewMode === "lista" && (
        <div className="journey-home mt-6">
          <header className="journey-opening">
            <p className="journey-count">
              <strong>66</strong> {t("journey.books")} <span aria-hidden>·</span>{" "}
              <strong>1.189</strong> {t("journey.chapters")}
            </p>
            <nav className="journey-testament-jump" aria-label={t("journey.title")}>
              {testaments.map((testament) => (
                <a key={testament.slug} href={`#${testament.slug}`}>
                  {testament.title}
                </a>
              ))}
            </nav>
          </header>

          {testaments.map((testament) => {
            const count = testament.groups.reduce((total, group) => total + group.books.length, 0);
            return (
              <section
                className="journey-toc"
                id={testament.slug}
                key={testament.slug}
                aria-labelledby={`${testament.slug}-title`}
              >
                <header className="journey-toc-head">
                  <span className="ed-num">{testament.numeral}</span>
                  <div>
                    <h2 id={`${testament.slug}-title`}>{testament.title}</h2>
                    <p>{testament.description}</p>
                  </div>
                  <small>
                    {count} {t("journey.books")}
                  </small>
                </header>

                {testament.groups.map((group) => (
                  <div
                    className="journey-toc-group"
                    key={`${testament.slug}-${group.category}-${group.books[0]?.slug}`}
                  >
                    <h3 className="ed-eyebrow">{journeyCategoryLabel(group.category, language)}</h3>
                    <ol>
                      {group.books.map((book) => {
                        const overview = book.overview[language];
                        const progress = journeyProgressForBook(
                          progressState,
                          book.slug,
                          book.chapterCount
                        );
                        const status =
                          progress.completed === 0
                            ? `${book.chapterCount} ${t("journey.chapters")}`
                            : progress.completed === progress.total
                            ? "✓"
                            : `${progress.completed}/${progress.total}`;
                        return (
                          <li key={book.slug}>
                            <Link
                              to={`/jornada/${book.testament}/${book.slug}`}
                              className={progress.completed > 0 ? "has-progress" : undefined}
                            >
                              <span className="ed-num">{String(book.position).padStart(2, "0")}</span>
                              <span className="journey-toc-copy">
                                <strong>{bookTitle(book)}</strong>
                                <span>{overview.description}</span>
                              </span>
                              <span className="journey-toc-status">{status}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}

      <p className="journey-sources-link mt-8">
        <Link className="ed-link" to="/jornada/fontes">
          {t("journey.sources")}
        </Link>
      </p>
    </div>
  );
}
