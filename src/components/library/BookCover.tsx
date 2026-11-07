import { useTranslation } from "react-i18next";

interface BookCoverProps {
  title: string;
  volume?: number;
  className?: string;
}

/** Capa encadernada: couro oxblood, filete dourado, sem ícone nem brilho. */
export function BookCover({ title, volume, className = "" }: BookCoverProps) {
  const { t } = useTranslation();
  return (
    <div className={`book-cover ${className}`}>
      <div className="book-cover-frame">
        {volume ? <p className="book-cover-volume">{t("livraria.volume", { number: volume })}</p> : <span aria-hidden className="book-cover-orn">✦</span>}
        <p className="book-cover-title">{title}</p>
        <span aria-hidden className="book-cover-orn">✦</span>
      </div>
    </div>
  );
}
