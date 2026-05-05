import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const sermoesPub: { autor: string; titulo: string; tema: string; textoBase: string; resumo: string }[] = [];

const PulpitoPage = () => {
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
    alert("Esboço clonado para sua biblioteca!");
  };

  return (
    <PageShell title="Púlpito Compartilhado">
      <div className="max-w-sm mx-auto flex flex-col gap-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Explore esboços compartilhados por outros pregadores. Encontrou algo inspirador? Clique em "Clonar Esboço" para salvar na sua biblioteca e editar.
        </p>
        {sermoesPub.map((s, i) => (
          <div key={i} className="menu-card flex-col items-start gap-2">
            <div className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-sm text-foreground">{s.titulo}</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.tema}</span>
            </div>
            <p className="text-xs text-muted-foreground">por {s.autor} • {s.textoBase}</p>
            <p className="text-sm text-foreground">{s.resumo}</p>
            <Button variant="outline" size="sm" className="self-end text-xs" onClick={() => clonar(s)}>
              Clonar Esboço
            </Button>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default PulpitoPage;
