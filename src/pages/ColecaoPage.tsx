import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { BookCover } from "@/components/library/BookCover";
import "./JourneyDesign.css";
import { getVolumeProgress, libraryProduct } from "@/data/library";

export default function ColecaoPage() {
  const { productSlug } = useParams();
  const { t, i18n } = useTranslation();
  const product = libraryProduct(i18n.resolvedLanguage || i18n.language, productSlug ?? "");
  if (!product) return <Navigate to="/livraria" replace />;

  return (
    <PageShell title={product.title} lede={product.slug === "apocalipse-revelado" ? t("livraria.orderNote") : undefined} width="wide">
      <Link to="/livraria" className="ed-link journey-back">← {t("livraria.back")}</Link>
      <ul className="library-volumes">
        {product.volumes.map((volume) => {
          const progress = getVolumeProgress(product.slug, volume.slug);
          return (
            <li key={volume.slug}>
              <Link to={`/livraria/${product.slug}/${volume.slug}`} aria-label={volume.title}>
                <BookCover title={volume.title} volume={volume.number} />
              </Link>
              {volume.ref && <p className="library-ref">{volume.ref}</p>}
              {progress > 0 && <p className="library-progress">{progress >= 100 ? t("livraria.finished") : t("livraria.percentRead", { progress: Math.round(progress) })}</p>}
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
