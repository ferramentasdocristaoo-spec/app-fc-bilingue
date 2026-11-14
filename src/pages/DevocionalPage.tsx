import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { ToolError, ToolForm, ToolPromise, ToolWait } from "@/components/ToolKit";
import { useAi } from "@/hooks/use-ai";

interface DevocionalResult {
  titulo: string;
  leitura: string;
  versiculo_chave: string;
  meditacao: string;
  oracao: string;
}

const DevocionalPage = () => {
  const { t } = useTranslation();
  const [tema, setTema] = useState("");
  const [resultado, setResultado] = useState<DevocionalResult | null>(null);
  const { callAi, loading, failed } = useAi();

  const gerar = async () => {
    setResultado(null);
    const result = await callAi("devocional", { tema });
    if (result && typeof result === "object") {
      setResultado(result as unknown as DevocionalResult);
    }
  };

  return (
    <PageShell title={t("sidebar.devocional.title")} lede={t("devocional.description")} width="tool">
      <ToolForm id="devocional-tema" label={t("devocional.label")} placeholder={t("devocional.placeholder")} value={tema} onChange={setTema} onSubmit={gerar} submitLabel={t("devocional.submit")} loading={loading} optional
        examples={[t("garimpo.suggestionGratitude"), t("garimpo.suggestionPeace"), t("garimpo.suggestionForgiveness")]} />

      {!resultado && !loading && !failed && <ToolPromise items={[t("devocional.reading"), t("devocional.meditation"), t("devocional.prayer")]} />}
      {loading && <ToolWait label={t("devocional.loading")} />}
      {failed && !loading && <ToolError onRetry={gerar} />}

      {resultado && !loading && (
        <article className="ed-result">
          <header><h2 className="ed-result-title">{resultado.titulo}</h2></header>
          <section className="ed-result-section">
            <h3>{t("devocional.reading")}</h3>
            <p>{resultado.leitura}</p>
            <figure className="ed-verse" style={{ border: 0, paddingBottom: 0 }}><blockquote>“{resultado.versiculo_chave}”</blockquote></figure>
          </section>
          <section className="ed-result-section"><h3>{t("devocional.meditation")}</h3><p>{resultado.meditacao}</p></section>
          <section className="ed-result-section"><h3>{t("devocional.prayer")}</h3><p className="italic">{resultado.oracao}</p></section>
        </article>
      )}
    </PageShell>
  );
};

export default DevocionalPage;
