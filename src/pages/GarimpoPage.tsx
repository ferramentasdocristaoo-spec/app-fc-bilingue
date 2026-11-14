import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { ToolError, ToolForm, ToolWait } from "@/components/ToolKit";
import { useAi } from "@/hooks/use-ai";

interface GarimpoResult {
  tema: string;
  resumo: string;
  versiculos: { referencia: string; texto: string; aplicacao: string }[];
}

const GarimpoPage = () => {
  const { t } = useTranslation();
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<GarimpoResult | null>(null);
  const { callAi, loading, failed } = useAi();

  const categoriasSugeridas = [
    t("garimpo.suggestionAnxiety"), t("garimpo.suggestionFaith"), t("garimpo.suggestionStrength"),
    t("garimpo.suggestionLove"), t("garimpo.suggestionPeace"), t("mural.categoryFamily"),
    t("garimpo.suggestionForgiveness"), t("garimpo.suggestionHope"), t("garimpo.suggestionWisdom"), t("garimpo.suggestionGratitude"),
  ];

  const pesquisar = async (categoria: string) => {
    setBusca(categoria);
    setResultado(null);
    const result = await callAi("garimpo", { categoria });
    if (result && typeof result === "object") {
      setResultado(result as unknown as GarimpoResult);
    }
  };

  return (
    <PageShell title={t("sidebar.garimpo.title")} lede={t("garimpo.description")} width="tool">
      <ToolForm id="garimpo-busca" label={t("garimpo.label")} placeholder={t("garimpo.placeholder")} value={busca} onChange={setBusca} onSubmit={() => pesquisar(busca)} submitLabel={t("garimpo.submit")} loading={loading} examples={!resultado ? categoriasSugeridas : undefined} examplesLabel={t("garimpo.suggestions")} />

      {loading && <ToolWait label={t("garimpo.loading", { theme: busca })} />}
      {failed && !loading && <ToolError onRetry={() => pesquisar(busca)} />}

      {resultado && !loading && (
        <article className="ed-result">
          <header>
            <h2 className="ed-result-title">{resultado.tema}</h2>
            <p>{resultado.resumo}</p>
          </header>
          <section className="ed-result-section">
            <h3>{t("garimpo.results")}</h3>
            {resultado.versiculos.map((v, i) => (
              <div key={i} className="ed-result-item">
                <h4>{v.referencia}</h4>
                <p className="italic">“{v.texto}”</p>
                <p className="ed-sub">{v.aplicacao}</p>
              </div>
            ))}
          </section>
          <button type="button" className="ed-btn ed-btn-ghost" onClick={() => { setResultado(null); setBusca(""); }}>{t("garimpo.newSearch")}</button>
        </article>
      )}
    </PageShell>
  );
};

export default GarimpoPage;
