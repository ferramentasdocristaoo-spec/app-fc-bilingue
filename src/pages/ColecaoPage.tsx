import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/components/PageShell";
import { BookCover } from "@/components/library/BookCover";
import { libraryProduct } from "@/data/library";

export default function ColecaoPage() {
  const { productSlug } = useParams();
  const { i18n } = useTranslation();
  const product = libraryProduct(i18n.resolvedLanguage || i18n.language);
  if (productSlug !== product.slug) return <Navigate to="/livraria" replace />;

  return (
    <PageShell title={product.title}>
      <Link to="/livraria" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Voltar à Livraria</Link>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {product.volumes.map((volume) => (
          <Link key={volume.slug} to={`/livraria/${product.slug}/${volume.slug}`} className="group">
            <BookCover title={volume.title} volume={volume.number} className="aspect-[2/3] w-full transition group-hover:-translate-y-1 group-hover:shadow-2xl" />
            <h2 className="mt-3 text-sm font-semibold leading-tight group-hover:text-primary">{volume.title}</h2>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
