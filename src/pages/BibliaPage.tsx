import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PageShell from "@/components/PageShell";

const VERSIONS_BY_LANG: Record<string, { id: string; name: string }[]> = {
  "pt-PT": [
    { id: "OL", name: "OL - O Livro (Português Europeu)" },
    { id: "NVIPT", name: "NVI-PT - Nova Versão Internacional" },
  ],
  "en": [
    { id: "KJV", name: "KJV - King James Version" },
    { id: "NKJV", name: "NKJV - New King James Version" },
    { id: "NIV2011", name: "NIV - New International Version" },
    { id: "ESV", name: "ESV - English Standard Version" },
    { id: "NLT", name: "NLT - New Living Translation" },
    { id: "WEB", name: "WEB - World English Bible" },
    { id: "ASV", name: "ASV - American Standard Version" },
    { id: "YLT", name: "YLT - Young's Literal Translation" },
    { id: "MSG", name: "MSG - The Message" },
  ],
  "es": [
    { id: "RV1960", name: "RVR60 - Reina-Valera 1960" },
    { id: "RV2004", name: "RVG - Reina Valera Gómez 2004" },
    { id: "NVI", name: "NVI - Nueva Versión Internacional" },
    { id: "BTX3", name: "BTX3 - Biblia Textual 3ª Edición" },
    { id: "NTV", name: "NTV - Nueva Traducción Viviente" },
    { id: "PDT", name: "PDT - Palabra de Dios para Todos" },
    { id: "LBLA", name: "LBLA - La Biblia de las Américas" },
  ],
  "fr": [
    { id: "FRLSG", name: "LSG - Louis Segond 1910" },
    { id: "NBS", name: "NBS - Nouvelle Bible Segond" },
    { id: "FRPDV17", name: "PDV - Parole de Vie 2017" },
    { id: "BDS", name: "BDS - Bible du Semeur" },
    { id: "FRDBY", name: "DBY - Bible de Darby" },
  ],
  "it": [
    { id: "NR06", name: "NR06 - Nuova Riveduta 2006" },
  ],
};

const DEFAULT_VERSION_BY_LANG: Record<string, string> = {
  "pt-PT": "OL",
  "en": "KJV",
  "es": "RV1960",
  "fr": "FRLSG",
  "it": "NR06",
};

function normalizeBibleLanguage(language: string): keyof typeof VERSIONS_BY_LANG {
  const normalized = language.toLowerCase();

  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("it")) return "it";
  return "pt-PT";
}

const BOOKS = [
  { id: 1, name: "Gênesis", chapters: 50 },
  { id: 2, name: "Êxodo", chapters: 40 },
  { id: 3, name: "Levítico", chapters: 27 },
  { id: 4, name: "Números", chapters: 36 },
  { id: 5, name: "Deuteronômio", chapters: 34 },
  { id: 6, name: "Josué", chapters: 24 },
  { id: 7, name: "Juízes", chapters: 21 },
  { id: 8, name: "Rute", chapters: 4 },
  { id: 9, name: "1 Samuel", chapters: 31 },
  { id: 10, name: "2 Samuel", chapters: 24 },
  { id: 11, name: "1 Reis", chapters: 22 },
  { id: 12, name: "2 Reis", chapters: 25 },
  { id: 13, name: "1 Crônicas", chapters: 29 },
  { id: 14, name: "2 Crônicas", chapters: 36 },
  { id: 15, name: "Esdras", chapters: 10 },
  { id: 16, name: "Neemias", chapters: 13 },
  { id: 17, name: "Ester", chapters: 10 },
  { id: 18, name: "Jó", chapters: 42 },
  { id: 19, name: "Salmos", chapters: 150 },
  { id: 20, name: "Provérbios", chapters: 31 },
  { id: 21, name: "Eclesiastes", chapters: 12 },
  { id: 22, name: "Cantares", chapters: 8 },
  { id: 23, name: "Isaías", chapters: 66 },
  { id: 24, name: "Jeremias", chapters: 52 },
  { id: 25, name: "Lamentações", chapters: 5 },
  { id: 26, name: "Ezequiel", chapters: 48 },
  { id: 27, name: "Daniel", chapters: 12 },
  { id: 28, name: "Oséias", chapters: 14 },
  { id: 29, name: "Joel", chapters: 3 },
  { id: 30, name: "Amós", chapters: 9 },
  { id: 31, name: "Obadias", chapters: 1 },
  { id: 32, name: "Jonas", chapters: 4 },
  { id: 33, name: "Miquéias", chapters: 7 },
  { id: 34, name: "Naum", chapters: 3 },
  { id: 35, name: "Habacuque", chapters: 3 },
  { id: 36, name: "Sofonias", chapters: 3 },
  { id: 37, name: "Ageu", chapters: 2 },
  { id: 38, name: "Zacarias", chapters: 14 },
  { id: 39, name: "Malaquias", chapters: 4 },
  { id: 40, name: "Mateus", chapters: 28 },
  { id: 41, name: "Marcos", chapters: 16 },
  { id: 42, name: "Lucas", chapters: 24 },
  { id: 43, name: "João", chapters: 21 },
  { id: 44, name: "Atos", chapters: 28 },
  { id: 45, name: "Romanos", chapters: 16 },
  { id: 46, name: "1 Coríntios", chapters: 16 },
  { id: 47, name: "2 Coríntios", chapters: 13 },
  { id: 48, name: "Gálatas", chapters: 6 },
  { id: 49, name: "Efésios", chapters: 6 },
  { id: 50, name: "Filipenses", chapters: 4 },
  { id: 51, name: "Colossenses", chapters: 4 },
  { id: 52, name: "1 Tessalonicenses", chapters: 5 },
  { id: 53, name: "2 Tessalonicenses", chapters: 3 },
  { id: 54, name: "1 Timóteo", chapters: 6 },
  { id: 55, name: "2 Timóteo", chapters: 4 },
  { id: 56, name: "Tito", chapters: 3 },
  { id: 57, name: "Filemom", chapters: 1 },
  { id: 58, name: "Hebreus", chapters: 13 },
  { id: 59, name: "Tiago", chapters: 5 },
  { id: 60, name: "1 Pedro", chapters: 5 },
  { id: 61, name: "2 Pedro", chapters: 3 },
  { id: 62, name: "1 João", chapters: 5 },
  { id: 63, name: "2 João", chapters: 1 },
  { id: 64, name: "3 João", chapters: 1 },
  { id: 65, name: "Judas", chapters: 1 },
  { id: 66, name: "Apocalipse", chapters: 22 },
];

interface Verse {
  pk: number;
  verse: number;
  text: string;
}

const BibliaPage = () => {
  const { t, i18n } = useTranslation();
  const lang = normalizeBibleLanguage(i18n.resolvedLanguage || i18n.language);
  const versions = VERSIONS_BY_LANG[lang];
  const [version, setVersion] = useState(() => DEFAULT_VERSION_BY_LANG[lang]);
  const [bookId, setBookId] = useState(1);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const verseRefs = useRef<Record<number, HTMLParagraphElement | null>>({});

  // Reset version to language default when language changes
  useEffect(() => {
    setVersion(DEFAULT_VERSION_BY_LANG[lang]);
    setVerses([]);
  }, [lang]);

  const bookNames = t("biblia.books", { returnObjects: true }) as string[];
  const currentBook = BOOKS.find((b) => b.id === bookId)!;

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/bible-proxy?version=${version}&bookId=${bookId}&chapter=${chapter}`);
      if (!res.ok) throw new Error("Erro ao buscar capítulo");
      const data = await res.json();
      setVerses(data);
    } catch {
      toast({ title: t("biblia.error"), description: t("biblia.errorMessage"), variant: "destructive" });
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [version, bookId, chapter]);

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  const goToPrevChapter = () => {
    if (chapter > 1) {
      setChapter((c) => c - 1);
    } else {
      const prevBook = BOOKS.find((b) => b.id === bookId - 1);
      if (prevBook) {
        setBookId(prevBook.id);
        setChapter(prevBook.chapters);
      }
    }
  };

  const goToNextChapter = () => {
    if (chapter < currentBook.chapters) {
      setChapter((c) => c + 1);
    } else {
      const nextBook = BOOKS.find((b) => b.id === bookId + 1);
      if (nextBook) {
        setBookId(nextBook.id);
        setChapter(1);
      }
    }
  };

  return (
    <PageShell title={t("sidebar.biblia.title")}>
      {/* Selectors */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={String(bookId)} onValueChange={(v) => { setBookId(Number(v)); setChapter(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("biblia.bookLabel")} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {BOOKS.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{bookNames[b.id - 1] || b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(chapter)} onValueChange={(v) => { setChapter(Number(v)); setSelectedVerse(null); }}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder={t("biblia.chapterLabel")} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {Array.from({ length: currentBook.chapters }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{t("biblia.chapterFormat", { chapter: i + 1 })}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {verses.length > 0 && (
          <Select value={selectedVerse ? String(selectedVerse) : ""} onValueChange={(v) => {
            const num = Number(v);
            setSelectedVerse(num);
            verseRefs.current[num]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={t("biblia.verseLabel")} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {verses.map((v) => (
                <SelectItem key={v.verse} value={String(v.verse)}>{t("biblia.verseFormat", { verse: v.verse })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={version} onValueChange={setVersion}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder={t("biblia.versionLabel")} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chapter title */}
      <h2 className="text-xl font-bold text-foreground mb-4">
        {bookNames[bookId - 1] || currentBook.name} {chapter}
      </h2>

      {/* Verses */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : verses.length > 0 ? (
        <div className="space-y-2 mb-6">
          {verses.map((v) => (
            <p
              key={v.pk}
              ref={(el) => { verseRefs.current[v.verse] = el; }}
              className={`leading-relaxed text-foreground rounded px-1 transition-colors ${selectedVerse === v.verse ? "bg-primary/15" : ""}`}
            >
              <span className="font-bold text-primary mr-1 text-xs align-super">{v.verse}</span>
              <span dangerouslySetInnerHTML={{ __html: v.text }} />
            </p>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t("biblia.emptyState")}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={goToPrevChapter} disabled={bookId === 1 && chapter === 1}>
          <ChevronLeft className="w-4 h-4 mr-1" /> {t("biblia.previousButton")}
        </Button>
        <span className="text-xs text-muted-foreground">{bookNames[bookId - 1] || currentBook.name} {chapter}</span>
        <Button variant="outline" size="sm" onClick={goToNextChapter} disabled={bookId === 66 && chapter === currentBook.chapters}>
          {t("biblia.nextButton")} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </PageShell>
  );
};

export default BibliaPage;
