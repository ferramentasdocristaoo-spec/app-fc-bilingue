import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { journeyCheckpointRepository } from "@/features/bible-journey/checkpoints";
import { formatGenesisRef } from "@/features/bible-journey/references";
import { genesisInteractive, journeyPeople, type FamilyNode, type JourneyCheckpoint, type JourneyInteractiveSection } from "@/features/bible-journey/genesis-interactive";
import type { JourneyBook, JourneyLanguage } from "@/features/bible-journey/types";
import { roman } from "./journey-utils";

const personName = (id: string, language: JourneyLanguage) => journeyPeople[id]?.[language] ?? id;

/* ---------- Família (árvore em filetes) ---------- */
function FamilyBranch({ node, language }: { node: FamilyNode; language: JourneyLanguage }) {
  return <li>
    <span className={node.highlight ? "jfam-name is-line" : "jfam-name"}>{personName(node.person, language)}</span>
    {node.spouses?.length ? <span className="jfam-spouse"> + {node.spouses.map(id => personName(id, language)).join(", ")}</span> : null}
    {node.children?.length ? <ul>{node.children.map(child => <FamilyBranch key={child.person} node={child} language={language} />)}</ul> : null}
  </li>;
}

export function JourneyFamily({ section, language }: { section: JourneyInteractiveSection; language: JourneyLanguage }) {
  const { t } = useTranslation();
  if (!section.family) return null;
  return <section className="jaid" aria-labelledby="jfam-title">
    <span className="ed-eyebrow">{t("journey.family")}</span>
    <h3 id="jfam-title">{t("journey.familyTitle")}</h3>
    <ul className="jfam"><FamilyBranch node={section.family.root} language={language} /></ul>
    <p className="jaid-note">{formatGenesisRef(section.family.ref, language)}{section.family.abridged ? ` · ${t("journey.familyAbridged")}` : ""}</p>
  </section>;
}

/* ---------- Tempo (faixa: história primordial sem números → patriarcas com datas tradicionais) ---------- */
export function JourneyEra({ book, sectionSlug, language }: { book: JourneyBook; sectionSlug: string; language: JourneyLanguage }) {
  const { t } = useTranslation();
  const primeval = book.sections.filter(section => !genesisInteractive[section.slug]?.era.length);
  const dated = book.sections.filter(section => genesisInteractive[section.slug]?.era.length);
  const activeDated = dated.some(section => section.slug === sectionSlug);
  const marks = dated.flatMap(section => genesisInteractive[section.slug].era);
  return <section className="jaid" aria-labelledby="jera-title">
    <span className="ed-eyebrow">{t("journey.time")}</span>
    <h3 id="jera-title">{t("journey.timeTitle")}</h3>
    <div className="jera">
      <div className={`jera-zone is-primeval${activeDated ? "" : " is-active"}`}>
        <small>{t("journey.timePrimeval")}</small>
        <ol>{primeval.map(section => {
          const index = book.sections.findIndex(item => item.slug === section.slug);
          return <li key={section.slug} className={section.slug === sectionSlug ? "is-active" : ""} title={section.content[language].title}><i />{roman(index)}</li>;
        })}</ol>
      </div>
      <div className={`jera-zone is-dated${activeDated ? " is-active" : ""}`}>
        <small>{t("journey.timePatriarchs")}</small>
        <ol>{marks.map(mark => <li key={mark.year} className={activeDated ? "is-active" : ""}><i /><span>{t("journey.yearBC", { year: Math.abs(mark.year ?? 0) })}</span><em>{mark.label[language]}</em></li>)}</ol>
      </div>
      <div className="jera-next" aria-hidden>→ {t("journey.nextBook")}</div>
    </div>
    <p className="jaid-note">{activeDated ? t("journey.timeNote") : t("journey.timePrimevalNote")}</p>
  </section>;
}

/* ---------- Ponto de paragem (quiz curto) ---------- */
export function JourneyCheckpointQuiz({ bookSlug, sectionSlug, checkpoint, language, onAnswered }: { bookSlug: string; sectionSlug: string; checkpoint: JourneyCheckpoint; language: JourneyLanguage; onAnswered?: () => void }) {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<number | undefined>(() => journeyCheckpointRepository.get(bookSlug, sectionSlug)?.choice);
  useEffect(() => { setChoice(journeyCheckpointRepository.get(bookSlug, sectionSlug)?.choice); }, [bookSlug, sectionSlug]);
  const answered = choice !== undefined;
  const correct = choice === checkpoint.answer;
  const pick = (index: number) => {
    if (answered) return;
    setChoice(index);
    journeyCheckpointRepository.answer(bookSlug, sectionSlug, index, index === checkpoint.answer);
    onAnswered?.();
  };
  const retry = () => { journeyCheckpointRepository.reset(bookSlug, sectionSlug); setChoice(undefined); onAnswered?.(); };
  const name = `jq-${bookSlug}-${sectionSlug}`;
  return <section className="jaid jquiz" aria-labelledby={`${name}-title`}>
    <span className="ed-eyebrow">{t("journey.checkpoint")}</span>
    <h3 id={`${name}-title`}>{t("journey.checkpointTitle")}</h3>
    <fieldset>
      <legend>{checkpoint.question[language]} <small>{formatGenesisRef(checkpoint.ref, language)}</small></legend>
      {checkpoint.options[language].map((option, index) => {
        const state = !answered ? "" : index === checkpoint.answer ? " is-right" : index === choice ? " is-wrong" : " is-muted";
        return <label key={option} className={`jquiz-option${state}`}>
          <input type="radio" name={name} value={index} checked={choice === index} disabled={answered && choice !== index} onChange={() => pick(index)} />
          <span>{option}</span>
        </label>;
      })}
    </fieldset>
    <div aria-live="polite">
      {answered && <p className={`jquiz-feedback ${correct ? "is-right" : "is-wrong"}`}>
        <strong>{correct ? t("journey.checkpointRight") : t("journey.checkpointWrong")}</strong> {checkpoint.explanation[language]}
      </p>}
    </div>
    {answered && <button type="button" className="ed-link jquiz-retry" onClick={retry}>{t("journey.checkpointRetry")}</button>}
  </section>;
}
