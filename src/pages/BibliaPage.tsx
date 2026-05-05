import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PageShell from "@/components/PageShell";

const VERSIONS = [
  { id: "ACF11", name: "ACF - Almeida Corrigida Fiel" },
  { id: "ARA", name: "ARA - Almeida Revista e Atualizada" },
  { id: "ARC09", name: "ARC - Almeida Revista e Corrigida" },
  { id: "ALM21", name: "AS21 - Almeida Século 21" },
  { id: "KJA", name: "KJA - King James Atualizada" },
  { id: "NAA", name: "NAA - Nova Almeida Atualizada" },
  { id: "NBV07", name: "NBV - Nova Bíblia Viva" },
  { id: "NTLH", name: "NTLH - Nova Tradução Ling. de Hoje" },
  { id: "NVIPT", name: "NVI - Nova Versão Internacional" },
  { id: "NVT", name: "NVT - Nova Versão Transformadora" },
  { id: "TB10", name: "TB - Tradução Brasileira" },
  { id: "VFL", name: "VFL - Versão Fácil de Ler" },
  { id: "MENS", name: "A Mensagem" },
  { id: "CNBB", name: "CNBB - Bíblia CNBB" },
  { id: "OL", name: "OL - O Livro" },
  { id: "NTJud", name: "NT Judaico" },
];

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
  const { t } = useTranslation();
  const [version, setVersion] = useState("ARA");
  const [bookId, setBookId] = useState(1);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const verseRefs = useRef<Record<number, HTMLParagraphElement | null>>({});

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
            {VERSIONS.map((v) => (
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
