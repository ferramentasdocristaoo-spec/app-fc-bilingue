import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sermoesPub: { autor: string; titulo: string; tema: string; textoBase: string; resumo: string }[] = [];

const PulpitoPage = () => {
  const { t } = useTranslation();

  const clonar = (sermao: typeof sermoesPub[0]) => {
    const existing = JSON.parse(localStorage.getItem("fc-sermoes") || "[]");
    existing.push({
      titulo: `[Clonado] ${sermao.titulo}`,
      textoBase: sermao.textoBase,
      tema: sermao.tema,
      tipo: "Temático",
      conteudo: sermao.resumo,
      status: "rascunho",
      data: new Date().toISOString(),
    });
    localStorage.setItem("fc-sermoes", JSON.stringify(existing));
    alert(t("pulpito.clonedAlert"));
  };

  return (
    <PageShell title={t("sidebar.pulpito.title")} lede={t("pulpito.description")} width="wide">
      <div className="pulpit-list flex flex-col gap-3">
        {sermoesPub.length === 0 && (
          <div className="ed-void">
            <p>{t("pulpito.empty")}</p>
            <Link to="/oficina" className="ed-btn ed-btn-ghost">{t("esbocos.emptyAction")}</Link>
          </div>
        )}
        {sermoesPub.map((s, i) => (
          <div key={i} className="menu-card flex-col items-start gap-2">
            <div className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-sm text-foreground">{s.titulo}</h3>
              <span className="ed-chip">{s.tema}</span>
            </div>
            <p className="text-sm text-muted-foreground">{s.autor} • {s.textoBase}</p>
            <p className="ed-panel-body">{s.resumo}</p>
            <Button variant="outline" size="sm" className="self-end min-h-12 text-sm" onClick={() => clonar(s)}>
              {t("pulpito.cloneButton")}
            </Button>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default PulpitoPage;
