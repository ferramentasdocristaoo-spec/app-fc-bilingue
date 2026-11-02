import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { JourneyBook, JourneyLanguage, JourneyProgressState } from "@/features/bible-journey/types";
import { journeyCheckpointRepository } from "@/features/bible-journey/checkpoints";
import { roman, sectionProgress } from "./journey-utils";

interface Props {
  book: JourneyBook;
  language: JourneyLanguage;
  progress: JourneyProgressState;
  activeSlug?: string;
  /** Na página do livro: seleciona o movimento. */
  onSelect?: (slug: string) => void;
  /** Na página do capítulo: cada etapa vira link. */
  hrefFor?: (slug: string) => string;
  compact?: boolean;
}

/** Linha do tempo editorial dos movimentos: romanos, filete de progresso, atual em vinho. */
export function JourneyStepper({ book, language, progress, activeSlug, onSelect, hrefFor, compact }: Props) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLOListElement>(null);
  // No celular a linha rola na horizontal: traz o movimento atual para a vista (sem mexer na rolagem da página).
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>(".is-active");
    if (list && active && list.scrollWidth > list.clientWidth) list.scrollLeft = Math.max(0, active.parentElement!.offsetLeft - list.offsetLeft - 16);
  }, [activeSlug]);
  return <nav className={`jstep${compact ? " jstep-compact" : ""}`} aria-label={t("journey.movementsLabel")}>
    <ol ref={listRef}>
      {book.sections.map((section, index) => {
        const p = sectionProgress(progress, book.slug, section);
        const active = section.slug === activeSlug;
        const checkpoint = journeyCheckpointRepository.get(book.slug, section.slug);
        const state = p.done === p.total ? "is-done" : p.done > 0 ? "is-started" : "";
        const body = <>
          <span className="jstep-bar" aria-hidden><i style={{ width: `${p.percentage}%` }} /></span>
          <span className="jstep-num">{roman(index)}</span>
          <span className="jstep-title">{section.content[language].title}</span>
          {!compact && <span className="jstep-meta">
            {p.done > 0 ? t("journey.movementProgress", { done: p.done, total: p.total }) : t("journey.chapterRange", { range: section.startChapter === section.endChapter ? section.startChapter : `${section.startChapter}–${section.endChapter}` })}
            {checkpoint?.correct && <span className="jstep-check" title={t("journey.checkpointDone")} aria-label={t("journey.checkpointDone")}> ✓</span>}
          </span>}
        </>;
        const className = `jstep-item ${state} ${active ? "is-active" : ""}`.trim();
        return <li key={section.slug}>
          {hrefFor
            ? <Link className={className} to={hrefFor(section.slug)} aria-current={active ? "step" : undefined}>{body}</Link>
            : <button type="button" className={className} aria-current={active ? "step" : undefined} aria-pressed={active} onClick={() => onSelect?.(section.slug)}>{body}</button>}
        </li>;
      })}
    </ol>
  </nav>;
}
