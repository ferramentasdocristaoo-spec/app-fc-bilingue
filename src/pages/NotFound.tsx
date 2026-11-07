import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="ed-notfound">
      <span className="ed-num" aria-hidden>404</span>
      <h1>{t("notFound.title")}</h1>
      <p className="ed-lede">{t("notFound.description")}</p>
      <Link to="/" className="ed-btn ed-btn-primary">{t("notFound.button")}</Link>
    </div>
  );
};

export default NotFound;
