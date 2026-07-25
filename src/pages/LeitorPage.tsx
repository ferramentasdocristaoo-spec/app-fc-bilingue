import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { libraryLanguage, libraryProduct } from "@/data/library";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface VolumeContent {
  title: string;
  content: string;
  language: string;
  word_count: number;
}

export default function LeitorPage() {
  const { productSlug, volumeSlug } = useParams();
  const { i18n } = useTranslation();
  const { email } = useAuth();
  const product = libraryProduct(i18n.resolvedLanguage || i18n.language);
  const volume = product.volumes.find((item) => item.slug === volumeSlug);
  const [book, setBook] = useState<VolumeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email || !volumeSlug) return;
    setLoading(true);
    supabase.functions.invoke("library-content", {
      body: {
        email,
        product_slug: product.slug,
        volume_slug: volumeSlug,
        language: libraryLanguage(i18n.resolvedLanguage || i18n.language),
      },
    }).then(({ data, error: requestError }) => {
      if (requestError || data?.error) setError(data?.error || "content_error");
      else setBook(data as VolumeContent);
      setLoading(false);
    });
  }, [email, i18n.language, i18n.resolvedLanguage, product.slug, volumeSlug]);

  if (productSlug !== product.slug || !volume) return <Navigate to="/livraria" replace />;

  return (
    <div className="min-h-full bg-[#f4efe5] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-300/60 bg-[#f4efe5]/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <Button variant="ghost" size="sm" asChild><Link to={`/livraria/${product.slug}`}><ArrowLeft className="mr-2 h-4 w-4" />Coleção</Link></Button>
        <span className="max-w-[50vw] truncate text-sm font-semibold">{volume.title}</span>
        <span className="text-xs text-muted-foreground">{volume.number}/8</span>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16">
        {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : error || !book ? (
          <div className="text-center"><BookOpen className="mx-auto mb-5 h-12 w-12 text-primary" /><p>Não foi possível abrir este conteúdo.</p></div>
        ) : (
          <>
            <div className="text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">Volume {volume.number}</p>
              <h1 className="font-display text-3xl font-bold">{book.title}</h1>
              <p className="mt-3 text-xs text-stone-500">{book.word_count.toLocaleString()} palavras</p>
              <div className="mx-auto my-8 h-px w-24 bg-primary/40" />
            </div>
            <article className="space-y-5 text-[1.08rem] leading-8">
              {book.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">{paragraph.trim()}</p>
              ))}
            </article>
          </>
        )}
      </main>
    </div>
  );
}
