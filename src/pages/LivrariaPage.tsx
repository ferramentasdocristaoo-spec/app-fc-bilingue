import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { BookCover } from "@/components/library/BookCover";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getProductProgress, libraryProducts } from "@/data/library";

export default function LivrariaPage() {
  const { t, i18n } = useTranslation();
  const { email } = useAuth();
  const products = libraryProducts(i18n.resolvedLanguage || i18n.language);
  // "erro" é diferente de "sem acesso": sem internet ninguém pode ler que não comprou o que comprou.
  const [access, setAccess] = useState<Record<string, boolean | "erro" | null>>({});
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!email) {
      setAccess(Object.fromEntries(products.map((p) => [p.slug, false])));
      return;
    }
    setAccess({});
    products.forEach((product) => {
      supabase.rpc("has_library_access", { _email: email, _product_slug: product.slug })
        .then(({ data, error }) =>
          setAccess((prev) => ({ ...prev, [product.slug]: error ? "erro" : data === true })),
          () => setAccess((prev) => ({ ...prev, [product.slug]: "erro" })),
        );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, tentativa]);

  return (
    <PageShell title={t("livraria.title")} lede={t("livraria.headerDescription")} width="wide">
      <div className="library-shelf">
        {products.map((product) => {
          const progress = getProductProgress(product.slug);
          const hasAccess = access[product.slug];
          const singleVolume = product.volumes.length === 1;
          const target = singleVolume ? `/livraria/${product.slug}/${product.volumes[0].slug}` : `/livraria/${product.slug}`;
          return (
            <article key={product.slug} className="library-item">
              <BookCover title={product.title} />
              <div>
                <span className="ed-eyebrow">{t("livraria.badge", { count: product.volumes.length })}</span>
                <h2 className="ed-result-title">{product.title}</h2>
                <p className="ed-panel-body">{product.description}</p>
                {progress > 0 && <p className="library-progress">{t("livraria.percentRead", { progress })}</p>}
                <div className="library-action">
                  {hasAccess === undefined || hasAccess === null ? (
                    <span className="ed-wait-lines inline-block w-40" role="status" aria-label={t("common.loading")}><i style={{ margin: 0, height: 44, width: "100%" }} /></span>
                  ) : hasAccess === "erro" ? (
                    <>
                      <p className="library-progress">{t("livraria.accessError")}</p>
                      <button type="button" className="ed-btn ed-btn-ghost mt-2" onClick={() => setTentativa((value) => value + 1)}>{t("common.retry")}</button>
                    </>
                  ) : hasAccess ? (
                    <Link className="ed-btn ed-btn-primary" to={target}>{progress ? t("livraria.continueReading") : singleVolume ? t("livraria.readNow") : t("livraria.openCollection")}</Link>
                  ) : (
                    <p className="library-progress">{t("livraria.lockedHint")}</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
