import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { ToolError, ToolForm, ToolPromise, ToolWait } from "@/components/ToolKit";
import { useAi } from "@/hooks/use-ai";

interface RaioXResult {
  referencia: string;
  versoes: { sigla: string; texto: string }[];
  palavras_chave: { palavra: string; original: string; transliteracao: string; significado: string }[];
  contexto_historico: string;
  contexto_literario: string;
  aplicacao: string;
}

const RaioXPage = () => {
  const { t } = useTranslation();
  const [referencia, setReferencia] = useState("");
  const [refPesquisada, setRefPesquisada] = useState("");
  const [resultado, setResultado] = useState<RaioXResult | null>(null);
  const { callAi, loading, failed } = useAi();
  const books = t("biblia.books", { returnObjects: true }) as string[];
  const exemplos = [`${books[42]} 3:16`, `${books[18]} 23:1`, `${books[44]} 8:28`];

  const buscar = async () => {
    if (!referencia.trim()) return;
    setRefPesquisada(referencia.trim());
    setResultado(null);
    const result = await callAi("raio-x", { referencia: referencia.trim() });
    if (result && typeof result === "object") setResultado(result as unknown as RaioXResult);
  };

  return (
    <PageShell title={t("sidebar.raioX.title")} lede={t("raioX.description")}>
      <ToolForm id="raio-x-ref" label={t("raioX.label")} placeholder={t("raioX.placeholder")} value={referencia} onChange={setReferencia} onSubmit={buscar} submitLabel={t("raioX.submit")} loading={loading} examples={exemplos} />

      {!resultado && !loading && !failed && <ToolPromise items={[t("raioX.comparative"), t("raioX.keywords"), t("raioX.historical"), t("raioX.literary"), t("raioX.theological")]} />}
      {loading && <ToolWait label={t("raioX.loading", { reference: refPesquisada })} />}
      {failed && !loading && <ToolError onRetry={buscar} />}

      {resultado && !loading && (
        <article className="ed-result">
          <header><h2 className="ed-result-title">{resultado.referencia}</h2></header>
          <section className="ed-result-section">
            <h3>{t("raioX.comparative")}</h3>
            {resultado.versoes.map((v, i) => (
              <div key={i} className="ed-result-item">
                <h4>{v.sigla}</h4>
                <p className="italic">“{v.texto}”</p>
              </div>
            ))}
          </section>
          <section className="ed-result-section">
            <h3>{t("raioX.keywords")}</h3>
            {resultado.palavras_chave.map((p, i) => (
              <div key={i} className="ed-result-item">
                <h4>{p.palavra}</h4>
                <p><span className="ed-original">{p.original}</span> <span className="ed-sub">{p.transliteracao}</span></p>
                <p className="ed-sub">{p.significado}</p>
              </div>
            ))}
          </section>
          <section className="ed-result-section"><h3>{t("raioX.historical")}</h3><p>{resultado.contexto_historico}</p></section>
          <section className="ed-result-section"><h3>{t("raioX.literary")}</h3><p>{resultado.contexto_literario}</p></section>
          <section className="ed-result-section"><h3>{t("raioX.theological")}</h3><p>{resultado.aplicacao}</p></section>
        </article>
      )}
    </PageShell>
  );
};

export default RaioXPage;
