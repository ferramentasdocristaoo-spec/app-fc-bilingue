import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { copySermonText, downloadSermonTxt, printSermon } from "@/lib/sermon-export";
import {
  continuarNaOficina,
  criarCopiaSeguranca,
  lerCopiaSeguranca,
  partesDoTexto,
  pedirArmazenamentoPersistente,
  readSermoes,
  restaurarCopiaSeguranca,
  type Sermao,
} from "@/lib/oficina-store";
import { textoParaPartes } from "@/lib/sermon-parts";
import { montarDadosPdf } from "@/lib/pdf/dados-pdf";
import { baixarSermaoPdf, prepararPdf } from "@/lib/pdf/sermon-pdf-browser";

/** Lê o arquivo como texto (FileReader serve também em navegadores sem File.text, como iPhones antigos). */
function lerArquivoTexto(arquivo: File): Promise<string> {
  if (typeof arquivo.text === "function") return arquivo.text();
  return new Promise((ok, falha) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(String(leitor.result ?? ""));
    leitor.onerror = () => falha(leitor.error);
    leitor.readAsText(arquivo);
  });
}

const EsbocosPage = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const [busca, setBusca] = useState("");
  const [sermoes, setSermoes] = useState<Sermao[]>(readSermoes);
  const [selecionado, setSelecionado] = useState<Sermao | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const navigate = useNavigate();
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const labels = {
    introduction: t("oficina.introduction"),
    application: t("oficina.application"),
    conclusion: t("oficina.conclusion"),
  };

  // Os esboços vivem no aparelho: pede ao navegador para não apagá-los sozinho.
  useEffect(() => {
    void pedirArmazenamentoPersistente();
  }, []);

  useEffect(() => {
    if (selecionado) prepararPdf(language);
  }, [selecionado, language]);

  const handleContinuar = () => {
    if (!selecionado) return;
    continuarNaOficina(selecionado, {
      introduction: t("oficina.introduction"),
      application: t("oficina.application"),
      conclusion: t("oficina.conclusion"),
    });
    navigate("/oficina");
  };

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

  const imprimirReserva = (sermao: Sermao) => {
    const linhas = sermao.conteudo.split("\n");
    const corpo = linhas[0] === sermao.titulo ? linhas.slice(linhas[1] === sermao.textoBase ? 2 : 1).join("\n") : sermao.conteudo;
    if (!printSermon(sermao.titulo || t("esbocos.defaultTitle"), sermao.textoBase, corpo, language)) {
      toast({ title: t("common.error"), description: t("oficina.popupBlocked"), variant: "destructive" });
    }
  };

  const handleDownloadPdf = async () => {
    if (!selecionado || gerandoPdf) return;
    const s = selecionado;
    const partes = s.partes?.length ? s.partes : partesDoTexto(s.conteudo, labels, s.titulo, s.textoBase) ?? textoParaPartes(s.conteudo, labels, s.titulo, s.textoBase);
    setGerandoPdf(true);
    try {
      const entrega = await baixarSermaoPdf(montarDadosPdf({ titulo: s.titulo, passagem: s.textoBase, partes, data: s.data, idioma: language, t }));
      if (entrega === "baixado") toast({ title: t("oficina.pdfReady"), description: t("oficina.pdfSaved") });
    } catch (erro) {
      console.error("PDF do esboço:", erro);
      toast({ title: t("common.error"), description: t("oficina.pdfFailed"), variant: "destructive" });
      imprimirReserva(s);
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleCopiaSeguranca = () => {
    const copia = criarCopiaSeguranca();
    if (!copia.sermoes.length) {
      toast({ title: t("esbocos.backupTitle"), description: t("esbocos.backupEmpty") });
      return;
    }
    const blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `esbocos-${copia.exportadoEm.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    toast({ title: t("esbocos.backupTitle"), description: t("esbocos.backupDone", { count: copia.sermoes.length }) });
  };

  const handleRestaurar = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    const importados = lerCopiaSeguranca(await lerArquivoTexto(arquivo));
    if (!importados) {
      toast({ title: t("common.error"), description: t("esbocos.restoreInvalid"), variant: "destructive" });
      return;
    }
    const r = restaurarCopiaSeguranca(importados);
    setSermoes(r.lista);
    void pedirArmazenamentoPersistente();
    toast({ title: t("esbocos.backupTitle"), description: t("esbocos.restoreDone", { novos: r.novos, atualizados: r.atualizados, iguais: r.iguais }) });
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
    <PageShell title={t("sidebar.esbocos.title")} lede={sermoes.length > 0 ? t("esbocos.description") : undefined} width="wide">
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

      <section className="ed-backup" aria-labelledby="backup-titulo">
        <h2 id="backup-titulo">{t("esbocos.backupTitle")}</h2>
        <p>{t("esbocos.backupHint")}</p>
        <div className="ed-backup-acoes">
          <button type="button" className="ed-btn ed-btn-primary" onClick={handleCopiaSeguranca}>{t("esbocos.backupButton")}</button>
          <button type="button" className="ed-btn ed-btn-ghost" onClick={() => arquivoRef.current?.click()}>{t("esbocos.restoreButton")}</button>
          <input
            ref={arquivoRef}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="restaurar-arquivo"
            onChange={(e) => {
              void handleRestaurar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="ed-result-title pr-8">{selecionado?.titulo || t("esbocos.defaultTitle")}</DialogTitle>
          </DialogHeader>
          {selecionado && (
            <div className="sermon-open">
              <p className="sermon-meta">{statusLabel(selecionado.status)} · {dataLabel(selecionado.data)}{selecionado.tema ? ` · ${selecionado.tema}` : ""}</p>
              <button type="button" className="ed-btn ed-btn-primary mt-4" onClick={handleContinuar}>{t("esbocos.editButton")}</button>
              <div className="studio-export">
                <button type="button" onClick={handleCopiar}>{t("esbocos.copyButton")}</button>
                <button type="button" onClick={handleDownloadPdf} disabled={gerandoPdf} aria-busy={gerandoPdf}>{gerandoPdf ? t("oficina.pdfPreparing") : t("esbocos.pdfButton")}</button>
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
