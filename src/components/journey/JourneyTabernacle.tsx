import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatBibleRef } from "@/features/bible-journey/references";
import type { JourneyFigure, TabernaclePart } from "@/features/bible-journey/genesis-interactive";
import type { JourneyLanguage } from "@/features/bible-journey/types";

/** Gravura do Tabernáculo com pontos, planta da tenda por dentro e o texto de cada parte. */
export function JourneyTabernacle({ figure, parts, language }: { figure: JourneyFigure; parts: TabernaclePart[]; language: JourneyLanguage }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const part = parts[index];
  const planParts = parts.filter(item => item.plan);
  const go = (delta: number) => setIndex(i => Math.min(parts.length - 1, Math.max(0, i + delta)));

  return <section className="jtab" aria-labelledby="jtab-title">
    <span className="ed-eyebrow">{t("journey.tabernacle.kicker")}</span>
    <h3 id="jtab-title">{t("journey.tabernacle.title")}</h3>
    <p className="ed-lede">{t("journey.tabernacle.intro")}</p>

    <div className="jstage">
      <div>
        <figure className="jtab-figure">
          <div className="jtab-image">
            {failed ? <div className="jfigure-missing" aria-hidden /> : <img src={figure.src} width={figure.width} height={figure.height} loading="lazy" decoding="async" alt={figure.title[language]} onError={() => setFailed(true)} />}
            {!failed && parts.map((item, i) => item.x === undefined ? null : <button key={item.id} type="button" className={`jtab-pin${i === index ? " is-active" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-pressed={i === index} aria-label={item.name[language]} title={item.name[language]} onClick={() => setIndex(i)}>{i + 1}</button>)}
          </div>
          <figcaption>
            <strong>{figure.title[language]}</strong>
            <span>{t("journey.tabernacle.credit")} <Link to="/jornada/fontes">{t("journey.sources")}</Link></span>
          </figcaption>
        </figure>

        <figure className="jtab-plan">
          <figcaption><strong>{t("journey.tabernacle.planTitle")}</strong></figcaption>
          <svg viewBox="0 0 600 220" role="group" aria-label={t("journey.tabernacle.planTitle")}>
            <rect className="jtab-room" x="2" y="2" width="596" height="216" />
            <line className="jtab-veil" x1="400" y1="2" x2="400" y2="218" />
            <text className="jtab-label" x="170" y="116" textAnchor="middle">{t("journey.tabernacle.holyPlace")}</text>
            <text className="jtab-label" x="500" y="40" textAnchor="middle">{t("journey.tabernacle.mostHoly")}</text>
            <text className="jtab-small" x="408" y="210">{t("journey.tabernacle.veil")}</text>
            <text className="jtab-small" x="12" y="210">← {t("journey.tabernacle.entrance")}</text>
            {planParts.map(item => {
              const i = parts.indexOf(item);
              const { x, y } = item.plan!;
              return <g key={item.id} className={`jtab-spot${i === index ? " is-active" : ""}`} role="button" tabIndex={0} aria-pressed={i === index} aria-label={item.name[language]} onClick={() => setIndex(i)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setIndex(i); } }}>
                <circle cx={x} cy={y} r="24" className="jtab-hit" />
                <circle cx={x} cy={y} r="15" className="jtab-dot" />
                <text x={x} y={y + 5} textAnchor="middle" className="jtab-num">{i + 1}</text>
              </g>;
            })}
          </svg>
          <figcaption>{t("journey.tabernacle.planNote")}</figcaption>
        </figure>
      </div>

      <div className="jstage-stop" aria-live="polite">
        <span className="jstage-count">{t("journey.tabernacle.partOf", { n: index + 1, total: parts.length })}</span>
        <h4>{part.name[language]}</h4>
        <span className="jstage-ref">{part.refs.map(ref => formatBibleRef(ref, language)).join(" · ")}</span>
        <p>{part.text[language]}</p>
        <div className="jstage-nav">
          <button type="button" className="ed-btn ed-btn-ghost" disabled={index === 0} onClick={() => go(-1)}>← {t("journey.previousStop")}</button>
          <button type="button" className="ed-btn ed-btn-primary" disabled={index >= parts.length - 1} onClick={() => go(1)}>{t("journey.tabernacle.next")} →</button>
        </div>
      </div>
    </div>

    <nav className="jstops" aria-label={t("journey.tabernacle.title")}>
      <ol>
        {parts.map((item, i) => <li key={item.id}>
          <button type="button" className={i === index ? "is-active" : i < index ? "is-visited" : ""} aria-current={i === index ? "step" : undefined} onClick={() => setIndex(i)}>
            <span className="jstops-bar" aria-hidden />
            <span className="jstops-num">{i + 1}</span>
            <span className="jstops-name">{item.name[language]}</span>
          </button>
        </li>)}
      </ol>
    </nav>
  </section>;
}
