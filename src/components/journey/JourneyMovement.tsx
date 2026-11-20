import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getJourneySectionDetails } from "@/features/bible-journey/journey-details";
import { journeyPeople } from "@/features/bible-journey/genesis-interactive";
import { getJourneyInteractive } from "@/features/bible-journey/interactive";
import { journeyPlaces } from "@/features/bible-journey/places";
import { formatBibleRef } from "@/features/bible-journey/references";
import type { JourneyBook, JourneyLanguage, JourneySection } from "@/features/bible-journey/types";
import { JourneyMap } from "./JourneyMap";
import { JourneyTabernacle } from "./JourneyTabernacle";
import { JourneyCheckpointQuiz, JourneyEra, JourneyFamily } from "./JourneyStudyAids";
import { chapterRange, roman } from "./journey-utils";
import "./JourneyInteractive.css";

interface Props {
  book: JourneyBook;
  section: JourneySection;
  language: JourneyLanguage;
  testament: string;
  onProgressChange?: () => void;
}

/** Painel do movimento selecionado: etiquetas de lugar e personagens e, em Génesis, mapa, paragens, família, tempo e quiz. */
export function JourneyMovement({ book, section, language, testament, onProgressChange }: Props) {
  const { t } = useTranslation();
  const index = book.sections.findIndex(item => item.slug === section.slug);
  const content = section.content[language];
  const details = getJourneySectionDetails(book, section, language);
  const interactive = getJourneyInteractive(book.slug, section.slug);
  const [stopIndex, setStopIndex] = useState(0);
  const [figureFailed, setFigureFailed] = useState(false);
  useEffect(() => { setStopIndex(0); setFigureFailed(false); }, [section.slug]);

  const stopsRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = stopsRef.current; const active = list?.querySelector<HTMLElement>(".is-active");
    if (list && active && list.scrollWidth > list.clientWidth) list.scrollLeft = Math.max(0, active.parentElement!.offsetLeft - list.offsetLeft - list.clientWidth / 3);
  }, [stopIndex, section.slug]);
  const stops = interactive?.stops ?? [];
  const stop = stops[Math.min(stopIndex, stops.length - 1)];
  const place = stop?.placeId ? journeyPlaces[stop.placeId] : undefined;
  const stopTitle = stop ? stop.title?.[language] ?? place?.names[language] ?? "" : "";

  // Os dados gerais repetem os personagens do livro inteiro: nos livros interativos (fora Gênesis, que tem
  // personagens por movimento) usa quem aparece nas paradas deste movimento.
  const isExodus = book.slug === "exodus";
  const peopleFromStops = stops.length > 0 && book.slug !== "genesis";
  const headerPeople = peopleFromStops
    ? [...new Set(stops.flatMap(item => item.people))].filter(id => id !== "god").map(id => journeyPeople[id]?.[language] ?? id)
    : details.characters;

  return <section className="jmove" id="jornada-movimento" aria-labelledby="jmove-title">
    <header className="jmove-head">
      <span className="ed-eyebrow">{t("journey.movement")} {roman(index)} · {t("journey.chapterRange", { range: chapterRange(section.startChapter, section.endChapter) })}</span>
      <h3 id="jmove-title">{content.title}</h3>
      <p className="ed-lede">{details.event || content.description}</p>
      <dl className="jtags">
        {details.place && <div><dt>{t("journey.place")}</dt><dd>{details.place}</dd></div>}
        {headerPeople.length > 0 && <div><dt>{t("journey.people")}</dt><dd>{headerPeople.join(" · ")}</dd></div>}
      </dl>
      {!isExodus && details.connection && <p className="jmove-connection"><span>{t("journey.connection")}</span> {details.connection}</p>}
    </header>

    {interactive && stop && <>
      <div className="jstage">
        <figure className="jstage-map">
          <JourneyMap stops={stops} activeIndex={stopIndex} onSelect={setStopIndex} language={language} label={`${t("journey.mapTitle")}: ${content.title}`} />
          <figcaption>
            <span>{t("journey.mapNote")}</span>
            <span>{t("journey.mapCredit")} <Link to="/jornada/fontes">{t("journey.sources")}</Link></span>
          </figcaption>
        </figure>

        <div className="jstage-stop" aria-live="polite">
          <span className="jstage-count">{t("journey.stopOf", { n: stopIndex + 1, total: stops.length })}</span>
          <h4>{stopTitle}</h4>
          <span className="jstage-ref">{formatBibleRef(stop.ref, language)}</span>
          <p>{stop.text[language]}</p>
          <dl className="jtags jtags-small">
            {place && <div><dt>{t("journey.place")}</dt><dd>{place.names[language]} <em>· {t(`journey.confidence.${place.confidence}`)}</em></dd></div>}
            {!place && <div><dt>{t("journey.place")}</dt><dd><em>{t("journey.mapNoPlace")}</em></dd></div>}
            {stop.people.length > 0 && <div><dt>{t("journey.people")}</dt><dd>{stop.people.map(id => journeyPeople[id]?.[language] ?? id).join(" · ")}</dd></div>}
          </dl>
          <div className="jstage-nav">
            <button type="button" className="ed-btn ed-btn-ghost" disabled={stopIndex === 0} onClick={() => setStopIndex(i => Math.max(0, i - 1))}>← {t("journey.previousStop")}</button>
            <button type="button" className="ed-btn ed-btn-primary" disabled={stopIndex >= stops.length - 1} onClick={() => setStopIndex(i => Math.min(stops.length - 1, i + 1))}>{t("journey.nextStop")} →</button>
          </div>
          {interactive.figure && <figure className="jfigure">
            {figureFailed ? <div className="jfigure-missing" aria-hidden /> : <img src={interactive.figure.src} width={interactive.figure.width} height={interactive.figure.height} loading="lazy" decoding="async" alt={interactive.figure.title[language]} onError={() => setFigureFailed(true)} />}
            <figcaption>
              <strong>{interactive.figure.title[language]}</strong>
              <span>{t("journey.figureCredit", { artist: interactive.figure.artist, year: interactive.figure.year, license: t("journey.publicDomain") })} <a href={interactive.figure.sourceUrl} target="_blank" rel="noreferrer">↗</a></span>
            </figcaption>
          </figure>}
        </div>
      </div>

      <nav className="jstops" aria-label={t("journey.stopsList")}>
        <ol ref={stopsRef}>
          {stops.map((item, i) => {
            const itemPlace = item.placeId ? journeyPlaces[item.placeId] : undefined;
            return <li key={item.id}>
              <button type="button" className={i === stopIndex ? "is-active" : i < stopIndex ? "is-visited" : ""} aria-current={i === stopIndex ? "step" : undefined} onClick={() => setStopIndex(i)}>
                <span className="jstops-bar" aria-hidden />
                <span className="jstops-num">{roman(i)}</span>
                <span className="jstops-name">{item.title?.[language] ?? itemPlace?.names[language]}</span>
              </button>
            </li>;
          })}
        </ol>
      </nav>

      {interactive.tabernacle && <>
        <div className="ed-orn" aria-hidden>✦</div>
        <JourneyTabernacle figure={interactive.tabernacle.figure} parts={interactive.tabernacle.parts} language={language} />
      </>}

      <div className="ed-orn" aria-hidden>✦</div>

      <div className="jaids">
        <JourneyFamily section={interactive} language={language} />
        <JourneyEra book={book} sectionSlug={section.slug} language={language} />
        <JourneyCheckpointQuiz bookSlug={book.slug} sectionSlug={section.slug} checkpoint={interactive.checkpoint} language={language} onAnswered={onProgressChange} />
      </div>
    </>}

    <p className="jmove-read">
      <Link className="ed-btn ed-btn-ghost" to={`/jornada/${testament}/${book.slug}/capitulos/${section.startChapter}`}>{t("journey.readFrom", { n: section.startChapter })} →</Link>
    </p>
  </section>;
}
