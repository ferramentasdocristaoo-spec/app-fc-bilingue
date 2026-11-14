import { useId } from "react";
import type { AppLanguage } from "@/i18n/geo-language";

interface FlagProps {
  code: AppLanguage;
  className?: string;
}

/**
 * Bandeiras dos 6 idiomas, desenhadas aqui em SVG simplificado e recortadas em círculo.
 * Sem emoji (o Windows não mostra emoji de bandeira), sem biblioteca nem chamada externa.
 * Decorativas: o nome do idioma vai no aria-label do botão que as envolve.
 * Inglês: EUA (maior público de língua inglesa do app e bandeira já usada no seletor);
 * Espanhol: Espanha (convenção dos seletores de idioma; a do México tem brasão ilegível em 24 px).
 */
export const Flag = ({ code, className }: FlagProps) => {
  const clipId = useId();
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}><circle cx="12" cy="12" r="12" /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{shapes(code)}</g>
      <circle cx="12" cy="12" r="11.5" className="flag-ring" />
    </svg>
  );
};

function shapes(code: AppLanguage) {
  switch (code) {
    case "pt-PT":
      return (
        <>
          <rect width="9.6" height="24" fill="#046A38" />
          <rect x="9.6" width="14.4" height="24" fill="#DA291C" />
          {/* Esfera armilar + escudo, só sugeridos. */}
          <circle cx="9.6" cy="12" r="4.3" fill="none" stroke="#FFE900" strokeWidth="1.5" />
          <rect x="7.75" y="9.5" width="3.7" height="5" rx="1" fill="#DA291C" />
          <rect x="8.45" y="10.2" width="2.3" height="3.6" rx="0.6" fill="#FFFFFF" />
        </>
      );
    case "en":
      return (
        <>
          <rect width="24" height="24" fill="#FFFFFF" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} y={(i * 2 * 24) / 13} width="24" height={24 / 13} fill="#B31942" />
          ))}
          <rect width="10.4" height={(7 * 24) / 13} fill="#0A3161" />
          {/* Estrelas sugeridas por pontos (a 24 px não há como desenhar 50). */}
          {[[2.4, 2.6], [5.2, 2.6], [8, 2.6], [3.8, 5.3], [6.6, 5.3], [2.4, 8], [5.2, 8], [8, 8], [3.8, 10.7], [6.6, 10.7]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.65" fill="#FFFFFF" />
          ))}
        </>
      );
    case "es":
      return (
        <>
          <rect width="24" height="6" fill="#AA151B" />
          <rect y="6" width="24" height="12" fill="#F1BF00" />
          <rect y="18" width="24" height="6" fill="#AA151B" />
          {/* Brasão só sugerido. */}
          <rect x="6" y="9.2" width="4.2" height="5.6" rx="1.2" fill="#AA151B" />
          <rect x="7" y="10.2" width="2.2" height="3.6" rx="0.6" fill="#F1BF00" />
        </>
      );
    case "fr":
      return (
        <>
          <rect width="8" height="24" fill="#0055A4" />
          <rect x="8" width="8" height="24" fill="#FFFFFF" />
          <rect x="16" width="8" height="24" fill="#EF4135" />
        </>
      );
    case "it":
      return (
        <>
          <rect width="8" height="24" fill="#009246" />
          <rect x="8" width="8" height="24" fill="#FFFFFF" />
          <rect x="16" width="8" height="24" fill="#CE2B37" />
        </>
      );
    case "de":
      return (
        <>
          <rect width="24" height="8" fill="#000000" />
          <rect y="8" width="24" height="8" fill="#DD0000" />
          <rect y="16" width="24" height="8" fill="#FFCE00" />
        </>
      );
  }
}
