import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { copySermonText, downloadSermonTxt, printSermon } from "@/lib/sermon-export";

interface Sermao {
  titulo: string;
  textoBase: string;
  tema: string;
  tipo: string;
  conteudo: string;
  status: string;
  data: string;
}

function readSermons(): Sermao[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("fc-sermoes") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const EsbocosPage = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const [busca, setBusca] = useState("");
  const [sermoes, setSermoes] = useState<Sermao[]>(readSermons);
  const [selecionado, setSelecionado] = useState<Sermao | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase();
    if (!q) return sermoes;
    return sermoes.filter((s) => [s.titulo, s.tema, s.textoBase, s.conteudo].some((campo) => (campo ?? "").toLocaleLowerCase().includes(q)));
  }, [busca, sermoes]);

  const statusLabel = (status: string) => (status === "finalizado" ? t("esbocos.statusFinal") : t("esbocos.statusDraft"));
  const dataLabel = (data: string) => new Date(data).toLocaleDateString(language, { day: "numeric", month: "long", year: "numeric" });

  const handleCopiar = async () => {
    if (!selecionado) return;
    if (await copySermonText(selecionado.conteudo)) toast({ title: t("esbocos.copiedNotif"), description: t("esbocos.copiedMessage") });
    else toast({ title: t("common.error"), description: t("oficina.copyFailed"), variant: "destructive" });
  };

  const handleDownloadPdf = () => {
    if (!selecionado) return;
    const linhas = selecionado.conteudo.split("\n");
    const corpo = linhas[0] === selecionado.titulo ? linhas.slice(linhas[1] === selecionado.textoBase ? 2 : 1).join("\n") : selecionado.conteudo;
    if (printSermon(selecionado.titulo || t("esbocos.defaultTitle"), selecionado.textoBase, corpo, language)) {
      toast({ title: t("esbocos.pdfButton"), description: t("oficina.exportPrintHint") });
    } else {
      toast({ title: t("common.error"), description: t("oficina.popupBlocked"), variant: "destructive" });
    }
  };

  const handleExcluir = () => {
    if (!selecionado) return;
    const novos = sermoes.filter((s) => s !== selecionado);
    localStorage.setItem("fc-sermoes", JSON.stringify(novos));
    setSermoes(novos);
    setSelecionado(null);
    setExcluindo(false);
    toast({ title: t("esbocos.deletedNotif"), description: t("esbocos.deletedMessage") });
  };

  return (
    <PageShell title={t("sidebar.esbocos.title")} lede={sermoes.length > 0 ? t("esbocos.description") : undefined}>
      {sermoes.length === 0 ? (
        <div className="ed-void">
          <h2>{t("esbocos.emptyTitle")}</h2>
          <p>{t("esbocos.emptyHint")}</p>
          <Link to="/oficina" className="ed-btn ed-btn-primary">{t("esbocos.emptyAction")}</Link>
        </div>
      ) : (
        <>
          <Input type="search" aria-label={t("esbocos.searchPlaceholder")} placeholder={t("esbocos.searchPlaceholder")} value={busca} onChange={(e) => setBusca(e.target.value)} />
          {filtrados.length === 0 ? (
            <p className="ed-empty mt-8">{t("esbocos.emptyState")}</p>
          ) : (
            <ul className="sermon-list">
              {filtrados.map((s) => (
                <li key={`${s.data}-${s.titulo}`}>
                  <button type="button" onClick={() => setSelecionado(s)}>
                    <strong>{s.titulo || t("esbocos.defaultTitle")}</strong>
                    {s.textoBase && <em>{s.textoBase}</em>}
                    <small>{statusLabel(s.status)} · {dataLabel(s.data)}{s.tema ? ` · ${s.tema}` : ""}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="ed-result-title pr-8">{selecionado?.titulo || t("esbocos.defaultTitle")}</DialogTitle>
          </DialogHeader>
          {selecionado && (
            <div className="sermon-open">
              <p className="sermon-meta">{statusLabel(selecionado.status)} · {dataLabel(selecionado.data)}{selecionado.tema ? ` · ${selecionado.tema}` : ""}</p>
              <div className="studio-export">
                <button type="button" onClick={handleCopiar}>{t("esbocos.copyButton")}</button>
                <button type="button" onClick={handleDownloadPdf}>{t("esbocos.pdfButton")}</button>
                <button type="button" onClick={() => downloadSermonTxt(selecionado.titulo, selecionado.conteudo)}>{t("esbocos.txtButton")}</button>
              </div>
              <div className="sermon-text">{selecionado.conteudo}</div>
              <button type="button" className="sermon-delete" onClick={() => setExcluindo(true)}>{t("esbocos.deleteButton")}</button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={excluindo} onOpenChange={setExcluindo}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">{t("esbocos.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("esbocos.deleteHint")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("esbocos.deleteButton")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default EsbocosPage;
