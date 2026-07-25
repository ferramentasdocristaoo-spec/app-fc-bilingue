import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Library, Loader2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { BookCover } from "@/components/library/BookCover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LIBRARY_PRODUCT_SLUG, libraryProduct } from "@/data/library";

export default function LivrariaPage() {
  const { i18n } = useTranslation();
  const { email } = useAuth();
  const product = libraryProduct(i18n.resolvedLanguage || i18n.language);
  const [access, setAccess] = useState<boolean | null>(null);
  const progress = Number(localStorage.getItem(`library-progress:${LIBRARY_PRODUCT_SLUG}`) || 0);

  useEffect(() => {
    if (!email) return setAccess(false);
    supabase.rpc("has_library_access", { _email: email, _product_slug: LIBRARY_PRODUCT_SLUG })
      .then(({ data, error }) => setAccess(!error && data === true));
  }, [email]);

  return (
    <PageShell title="Livraria">
      <div className="mb-6 max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-primary"><Library className="h-5 w-5" /><span className="font-semibold">Coleções de estudo e leitura</span></div>
        <p className="text-sm text-muted-foreground">A compra de uma coleção dá acesso a todos os volumes em qualquer idioma disponível.</p>
      </div>

      <article className="max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid gap-6 p-5 sm:grid-cols-[150px_1fr]">
          <BookCover title={product.title} className="mx-auto h-52 w-36 sm:mx-0" />
          <div className="flex flex-col justify-center">
            <span className="mb-2 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">8 volumes • 1 produto</span>
            <h2 className="font-display text-2xl font-bold">{product.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Uma coleção completa para compreender os principais acontecimentos e personagens do livro de Apocalipse.</p>
            {progress > 0 && <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progresso</span><span>{progress}%</span></div><Progress value={progress} className="h-2" /></div>}
            <div className="mt-5">
              {access === null ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : access ? (
                <Button asChild><Link to={`/livraria/${product.slug}`}>{progress ? "Continuar leitura" : "Abrir coleção"}</Link></Button>
              ) : (
                <Button variant="outline" className="gap-2" disabled><Lock className="h-4 w-4" />Produto bloqueado</Button>
              )}
            </div>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
