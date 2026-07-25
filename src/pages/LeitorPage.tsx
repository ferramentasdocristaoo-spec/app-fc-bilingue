import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { libraryProduct } from "@/data/library";

export default function LeitorPage() {
  const { productSlug, volumeSlug } = useParams();
  const { i18n } = useTranslation();
  const product = libraryProduct(i18n.resolvedLanguage || i18n.language);
  const volume = product.volumes.find((item) => item.slug === volumeSlug);
  if (productSlug !== product.slug || !volume) return <Navigate to="/livraria" replace />;

  return (
    <div className="min-h-full bg-[#f4efe5] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-300/60 bg-[#f4efe5]/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <Button variant="ghost" size="sm" asChild><Link to={`/livraria/${product.slug}`}><ArrowLeft className="mr-2 h-4 w-4" />Coleção</Link></Button>
        <span className="max-w-[50vw] truncate text-sm font-semibold">{volume.title}</span>
        <span className="text-xs text-muted-foreground">{volume.number}/8</span>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <BookOpen className="mx-auto mb-5 h-12 w-12 text-primary" />
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">Volume {volume.number}</p>
        <h1 className="font-display text-3xl font-bold">{volume.title}</h1>
        <div className="mx-auto my-8 h-px w-24 bg-primary/40" />
        <p className="leading-8 text-stone-600 dark:text-stone-300">O leitor está preparado. O conteúdo deste volume aparecerá aqui assim que os ficheiros de texto forem adicionados à pasta do projeto.</p>
      </main>
    </div>
  );
}
