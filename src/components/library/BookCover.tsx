import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";

interface BookCoverProps {
  title: string;
  volume?: number;
  className?: string;
}

export function BookCover({ title, volume, className = "" }: BookCoverProps) {
  const { t } = useTranslation();
  return (
    <div className={`relative overflow-hidden rounded-r-lg rounded-l-sm bg-gradient-to-br from-zinc-950 via-red-950 to-amber-950 text-amber-100 shadow-xl ring-1 ring-amber-500/30 ${className}`}>
      <div className="absolute inset-y-0 left-0 w-2 bg-black/45 border-r border-amber-500/20" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-500/15 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between p-4 pl-5">
        <BookOpen className="h-5 w-5 text-amber-400" />
        <div>
          {volume && <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-amber-400">Volume {volume}</p>}
          <h3 className="font-display text-sm font-bold leading-tight">{title}</h3>
        </div>
        <p className="text-[9px] uppercase tracking-[0.18em] text-amber-200/60">{t("appName")}</p>
      </div>
    </div>
  );
}
