import { useState, useMemo } from "react";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Search, Copy, Download, FileText, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Sermao {
  titulo: string;
  textoBase: string;
  tema: string;
  tipo: string;
  conteudo: string;
  status: string;
  data: string;
}

const EsbocosPage = () => {
  const [busca, setBusca] = useState("");
  const [sermoes, setSermoes] = useState<Sermao[]>(() =>
    JSON.parse(localStorage.getItem("fc-sermoes") || "[]")
  );
  const [selecionado, setSelecionado] = useState<Sermao | null>(null);

  const filtrados = useMemo(() => {
    if (!busca) return sermoes;
    const q = busca.toLowerCase();
    return sermoes.filter(
      (s) => s.titulo.toLowerCase().includes(q) || s.tema.toLowerCase().includes(q) || s.conteudo.toLowerCase().includes(q)
    );
  }, [busca, sermoes]);

  const handleCopiar = () => {
    if (!selecionado) return;
    navigator.clipboard.writeText(selecionado.conteudo);
    toast({ title: "Copiado!", description: "Sermão copiado para a área de transferência." });
  };

  const handleDownloadTxt = () => {
    if (!selecionado) return;
    const blob = new Blob([selecionado.conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selecionado.titulo || "sermao"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!selecionado) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${selecionado.titulo}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.7; color: #333; }
        h1 { text-align: center; color: #5C3D2E; }
        pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 14px; }
      </style></head>
      <body><h1>${selecionado.titulo}</h1><pre>${selecionado.conteudo}</pre></body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleExcluir = (index: number) => {
    const novos = sermoes.filter((_, i) => i !== index);
    localStorage.setItem("fc-sermoes", JSON.stringify(novos));
    setSermoes(novos);
    setSelecionado(null);
    toast({ title: "Excluído", description: "Sermão removido com sucesso." });
  };

  return (
    <PageShell title="Meus Esboços">
      <div className="max-w-sm mx-auto flex flex-col gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aqui ficam todos os sermões que você salvou na Oficina. Toque em um esboço para visualizar, copiar, exportar ou excluir.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar sermões..." className="pl-10" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {filtrados.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhum esboço encontrado.</p>
        ) : (
          filtrados.map((s, i) => (
            <div
              key={i}
              className="menu-card flex-col items-start gap-2 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelecionado(s)}
            >
              <div className="flex items-center justify-between w-full">
                <h3 className="font-semibold text-sm text-foreground">{s.titulo || "Sem título"}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "finalizado" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{s.textoBase} • {s.tema}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.data).toLocaleDateString("pt-BR")}</p>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary font-display">{selecionado?.titulo || "Sem título"}</DialogTitle>
          </DialogHeader>
          {selecionado && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{selecionado.textoBase}</span>
                <span>•</span>
                <span>{selecionado.tema}</span>
                <span>•</span>
                <span>{new Date(selecionado.data).toLocaleDateString("pt-BR")}</span>
              </div>
              <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-4">
                {selecionado.conteudo}
              </pre>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopiar}>
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTxt}>
                  <FileText className="w-3.5 h-3.5" /> TXT
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const idx = sermoes.indexOf(selecionado);
                  if (idx >= 0) handleExcluir(idx);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default EsbocosPage;
