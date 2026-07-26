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
import { getProductProgress, libraryProducts } from "@/data/library";

export default function LivrariaPage() {
  const { t, i18n } = useTranslation();
  const { email } = useAuth();
  const products = libraryProducts(i18n.resolvedLanguage || i18n.language);
  const [access, setAccess] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    if (!email) {
      setAccess(Object.fromEntries(products.map((p) => [p.slug, false])));
      return;
    }
    products.forEach((product) => {
      supabase.rpc("has_library_access", { _email: email, _product_slug: product.slug })
        .then(({ data, error }) =>
          setAccess((prev) => ({ ...prev, [product.slug]: !error && data === true })),
        );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <PageShell title={t("livraria.title")}>
      <div className="mb-6 max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-primary"><Library className="h-5 w-5" /><span className="font-semibold">{t("livraria.header")}</span></div>
        <p className="text-sm text-muted-foreground">{t("livraria.headerDescription")}</p>
      </div>

      <div className="flex flex-col gap-6">
        {products.map((product) => {
          const progress = getProductProgress(product.slug);
          const hasAccess = access[product.slug];
          return (
            <article key={product.slug} className="max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="grid gap-6 p-5 sm:grid-cols-[150px_1fr]">
                <BookCover title={product.title} className="mx-auto h-52 w-36 sm:mx-0" />
                <div className="flex flex-col justify-center">
                  <span className="mb-2 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{t("livraria.badge", { count: product.volumes.length })}</span>
                  <h2 className="font-display text-2xl font-bold">{product.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
                  {progress > 0 && <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{t("livraria.progress")}</span><span>{progress}%</span></div><Progress value={progress} className="h-2" /></div>}
                  <div className="mt-5">
                    {hasAccess === undefined || hasAccess === null ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : hasAccess ? (
                      <Button asChild><Link to={`/livraria/${product.slug}`}>{progress ? t("livraria.continueReading") : t("livraria.openCollection")}</Link></Button>
                    ) : (
                      <Button variant="outline" className="gap-2" disabled><Lock className="h-4 w-4" />{t("livraria.locked")}</Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
