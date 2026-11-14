import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { ToolError } from "@/components/ToolKit";
import { fetchVerse, type DailyVerse } from "@/lib/daily-verse";

// Promessas (numeração de livros da bolls.life). O texto vem da Bíblia do idioma do leitor.
const PROMESSAS = [
  { book: 24, chapter: 29, verse: 11 }, // Jeremias 29:11
  { book: 50, chapter: 4, verse: 13 },  // Filipenses 4:13
  { book: 19, chapter: 23, verse: 1 },  // Salmos 23:1
  { book: 23, chapter: 41, verse: 10 }, // Isaías 41:10
  { book: 23, chapter: 40, verse: 31 }, // Isaías 40:31
  { book: 43, chapter: 8, verse: 32 },  // João 8:32
  { book: 24, chapter: 33, verse: 3 },  // Jeremias 33:3
  { book: 45, chapter: 8, verse: 28 },  // Romanos 8:28
  { book: 19, chapter: 46, verse: 1 },  // Salmos 46:1
  { book: 19, chapter: 37, verse: 5 },  // Salmos 37:5
];

const VozDeDeusPage = () => {
  const { t, i18n } = useTranslation();
  const [promessa, setPromessa] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const last = useRef(-1);
  const bookNames = t("biblia.books", { returnObjects: true }) as string[];

  const sortear = async () => {
    // Nunca repete a promessa anterior.
    let index = Math.floor(Math.random() * PROMESSAS.length);
    if (index === last.current) index = (index + 1) % PROMESSAS.length;
    last.current = index;
    setLoading(true);
    setFailed(false);
    const verse = await fetchVerse(i18n.resolvedLanguage || i18n.language, PROMESSAS[index]);
    setPromessa(verse);
    setFailed(!verse);
    setLoading(false);
  };

  return (
    <PageShell title={t("sidebar.voz.title")} lede={t("voz.description")} width="wide">
      {!failed && (
        <button type="button" onClick={sortear} disabled={loading} className="ed-btn ed-btn-primary">
          {promessa ? t("voz.again") : t("voz.button")}
        </button>
      )}
      {loading && <p className="ed-wait" role="status">{t("common.loading")}</p>}
      {failed && !loading && <ToolError onRetry={sortear}>{t("workspace.verseUnavailable")}</ToolError>}
      {promessa && !loading && !failed && (
        <figure className="ed-verse ed-verse-large">
          <blockquote>“{promessa.text}”</blockquote>
          <figcaption>{bookNames[promessa.book - 1]} {promessa.chapter}:{promessa.verse}</figcaption>
        </figure>
      )}
    </PageShell>
  );
};

export default VozDeDeusPage;
