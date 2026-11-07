import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { journeyPublicDomainFigures } from "@/features/bible-journey/interactive";
import "./JourneyDesign.css";

const FONTS = ["Cormorant Garamond", "Source Serif 4", "Inter", "Cinzel"];
const external = { target: "_blank", rel: "noreferrer" };

/** Fontes e licenças do material da Jornada. As gravuras vêm dos próprios dados, para a lista não ficar desatualizada. */
export default function JornadaFontesPage() {
  const { t, i18n } = useTranslation();
  const language = normalizeJourneyLanguage(i18n.resolvedLanguage || i18n.language);
  const figures = journeyPublicDomainFigures();
  return <div className="journey-book-page">
    <div className="journey-book-content journey-sources">
      <Link to="/jornada" className="ed-link journey-back">← {t("journey.title")}</Link>
      <h1>{t("journey.sources")}</h1>
      <p className="ed-lede">{t("journey.sourcesPage.intro")}</p>

      <section>
        <h2>{t("journey.sourcesPage.maps")}</h2>
        <dl>
          <dt><a href="https://github.com/openbibleinfo/Bible-Geocoding-Data" {...external}>OpenBible.info, Bible Geocoding Data</a></dt>
          <dd>{t("journey.sourcesPage.openBible")} <em>CC BY 4.0</em></dd>
          <dt><a href="https://www.naturalearthdata.com/about/terms-of-use/" {...external}>Natural Earth</a></dt>
          <dd>{t("journey.sourcesPage.naturalEarth")} <em>{t("journey.publicDomain")}</em></dd>
        </dl>
      </section>

      <section>
        <h2>{t("journey.sourcesPage.engravings")}</h2>
        <p>{t("journey.sourcesPage.engravingsNote")}</p>
        <p>{t("journey.sourcesPublicDomain")}</p>
        <ul>
          {figures.map(figure => <li key={figure.src}><a href={figure.sourceUrl} {...external}>{figure.title[language]}</a></li>)}
        </ul>
      </section>

      <section>
        <h2>{t("journey.sourcesPage.tabernacle")}</h2>
        <p>{t("journey.sourcesPage.tabernacleNote")}</p>
      </section>

      <section>
        <h2>{t("journey.sourcesPage.texts")}</h2>
        <p>{t("journey.sourcesPage.textsNote")}</p>
      </section>

      <section>
        <h2>{t("journey.sourcesPage.bible")}</h2>
        <p>{t("journey.sourcesPage.bibleNote")} <a href="https://bolls.life" {...external}>bolls.life</a></p>
      </section>

      <section>
        <h2>{t("journey.sourcesPage.fonts")}</h2>
        <p>{FONTS.join(" · ")} · <em>SIL Open Font License 1.1</em></p>
      </section>
    </div>
  </div>;
}
