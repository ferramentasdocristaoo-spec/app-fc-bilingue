import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { ToolError, ToolForm, ToolPromise, ToolWait } from "@/components/ToolKit";
import { useAi } from "@/hooks/use-ai";

interface NomeResultado {
  significado_geral: string;
  hebraico?: { original: string; transliteracao: string; significado: string };
  aramaico?: { original: string; transliteracao: string; significado: string };
  grego?: { original: string; transliteracao: string; significado: string };
  latim?: { original: string; transliteracao: string; significado: string };
  etimologia: string;
  historia: string;
  variacoes: string[];
}

const Lingua = ({ titulo, dados }: { titulo: string; dados: { original: string; transliteracao: string; significado: string } }) => (
  <div className="ed-result-item">
    <h4>{titulo}</h4>
    <p><span className="ed-original">{dados.original}</span> <span className="ed-sub">{dados.transliteracao}</span></p>
    <p className="ed-sub">{dados.significado}</p>
  </div>
);

const NomesPage = () => {
  const { t } = useTranslation();
  const [nome, setNome] = useState("");
  const [nomePesquisado, setNomePesquisado] = useState("");
  const [resultado, setResultado] = useState<NomeResultado | null>(null);
  const { callAi, loading, failed } = useAi();

  const pesquisar = async () => {
    if (!nome.trim()) return;
    setNomePesquisado(nome.trim());
    setResultado(null);
    const result = await callAi("nomes", { nome: nome.trim() });
    if (result && typeof result === "object") {
      setResultado(result as unknown as NomeResultado);
    } else if (typeof result === "string") {
      try { setResultado(JSON.parse(result)); } catch { setResultado(null); }
    }
  };

  return (
    <PageShell title={t("sidebar.nomes.title")} lede={t("nomes.description")}>
      <ToolForm id="nome-busca" label={t("nomes.label")} placeholder={t("nomes.placeholder")} value={nome} onChange={setNome} onSubmit={pesquisar} submitLabel={t("nomes.submit")} loading={loading} examples={t("nomes.examples", { returnObjects: true }) as string[]} />

      {!resultado && !loading && !failed && <ToolPromise items={[t("nomes.result"), t("nomes.etymology"), t("nomes.history"), t("nomes.variations")]} />}
      {loading && <ToolWait label={t("nomes.loading", { name: nomePesquisado })} />}
      {failed && !loading && <ToolError onRetry={pesquisar} />}

      {resultado && !loading && (
        <article className="ed-result">
          <header>
            <h2 className="ed-result-title">{nomePesquisado}</h2>
            <p>{resultado.significado_geral}</p>
          </header>
          <section className="ed-result-section">
            <h3>{t("nomes.result")}</h3>
            {resultado.hebraico && <Lingua titulo={t("nomes.hebrew")} dados={resultado.hebraico} />}
            {resultado.grego && <Lingua titulo={t("nomes.greek")} dados={resultado.grego} />}
            {resultado.aramaico && <Lingua titulo={t("nomes.aramaic")} dados={resultado.aramaico} />}
            {resultado.latim && <Lingua titulo={t("nomes.latin")} dados={resultado.latim} />}
          </section>
          <section className="ed-result-section"><h3>{t("nomes.etymology")}</h3><p>{resultado.etimologia}</p></section>
          <section className="ed-result-section"><h3>{t("nomes.history")}</h3><p>{resultado.historia}</p></section>
          {resultado.variacoes && resultado.variacoes.length > 0 && (
            <section className="ed-result-section"><h3>{t("nomes.variations")}</h3><p>{resultado.variacoes.join(" · ")}</p></section>
          )}
        </article>
      )}
    </PageShell>
  );
};

export default NomesPage;
