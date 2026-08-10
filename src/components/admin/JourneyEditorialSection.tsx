import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Clock3, Cloud, CloudCog, ExternalLink, Loader2, Plus, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { generateChapterEditorial, getJourneyAiUsage } from "@/features/bible-journey/editorial-generator";
import type { EditorialGenerationResult, JourneyAiUsage } from "@/features/bible-journey/editorial-generator";
import {
  enqueueEditorialRange, fetchEditorialScripture, getEditorialQueueState, JOURNEY_LANGUAGES,
  removeEditorialQueueItem, saveEditorialQueueState, updateEditorialQueueItem,
  type EditorialQueueItem, type EditorialQueueState,
} from "@/features/bible-journey/editorial-queue";
import type { JourneyBook, JourneyLanguage } from "@/features/bible-journey/types";
import { listJourneyEditorialHistory, listPublishedJourneyEditorials, publishJourneyEditorial, restoreJourneyEditorialHistory, unpublishJourneyEditorial, type AdminCredentials, type EditorialHistorySummary, type PublishedEditorialSummary } from "@/features/bible-journey/published-editorial";
import { hasEditorialErrors, validateEditorialResult } from "@/features/bible-journey/editorial-validation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteJourneyEditorialDraft, listJourneyEditorialDrafts, saveJourneyEditorialDraft } from "@/features/bible-journey/editorial-drafts";

const languageLabels: Record<JourneyLanguage, string> = { "pt-PT": "Português", en: "Inglês", es: "Espanhol", fr: "Francês", it: "Italiano", de: "Alemão" };
const statusLabels = { pending: "Pendente", generating: "Gerando", generated: "Gerado", reviewed: "Revisado", published: "Publicado", failed: "Falhou" } as const;

const JourneyEditorialSection = ({ credentials }: { credentials: AdminCredentials }) => {
  const [books, setBooks] = useState<JourneyBook[]>([]);
  const [bookSlug, setBookSlug] = useState("genesis");
  const [language, setLanguage] = useState<JourneyLanguage>("pt-PT");
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(3);
  const [queue, setQueue] = useState<EditorialQueueState>(() => getEditorialQueueState());
  const [selectedId, setSelectedId] = useState<string>();
  const [usage, setUsage] = useState<JourneyAiUsage>();
  const [regenerateItem, setRegenerateItem] = useState<EditorialQueueItem>();
  const [publishedItems, setPublishedItems] = useState<PublishedEditorialSummary[]>([]);
  const [unpublishItem, setUnpublishItem] = useState<PublishedEditorialSummary>();
  const [historyItems, setHistoryItems] = useState<EditorialHistorySummary[]>([]);
  const [restoreItem, setRestoreItem] = useState<EditorialHistorySummary>();
  const [cloudStatus, setCloudStatus] = useState<"loading" | "saving" | "synced" | "error">("loading");
  const [batchConfirm, setBatchConfirm] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; current: string }>();
  const batchCancelled = useRef(false);

  useEffect(() => { journeyCatalogRepository.listBooks().then(setBooks); }, []);
  useEffect(() => { getJourneyAiUsage(credentials).then(setUsage).catch(() => setUsage(undefined)); }, [credentials]);
  useEffect(() => { listPublishedJourneyEditorials(credentials).then(setPublishedItems).catch(() => setPublishedItems([])); }, [credentials]);
  useEffect(() => { listJourneyEditorialHistory(credentials).then(setHistoryItems).catch(() => setHistoryItems([])); }, [credentials]);
  useEffect(() => {
    listJourneyEditorialDrafts(credentials).then(drafts => {
      setQueue(current => {
        const merged = new Map(current.items.map(item => [item.id, item]));
        for (const draft of drafts) {
          const local = merged.get(draft.id);
          if (!local || new Date(draft.updatedAt).getTime() > new Date(local.updatedAt).getTime()) merged.set(draft.id, draft);
        }
        return saveEditorialQueueState({ version: 1, items: [...merged.values()] });
      });
      setCloudStatus("synced");
    }).catch(() => setCloudStatus("error"));
  }, [credentials]);
  const selectedBook = books.find(book => book.slug === bookSlug);
  const selected = queue.items.find(item => item.id === selectedId) || queue.items[0];
  useEffect(() => {
    if (!selected || selected.status === "generating") return;
    setCloudStatus("saving");
    const timer = window.setTimeout(() => {
      saveJourneyEditorialDraft(credentials, selected).then(() => setCloudStatus("synced")).catch(() => setCloudStatus("error"));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [credentials, selected]);
  const validationIssues = useMemo(() => selected?.result ? validateEditorialResult(selected.result) : [], [selected?.result]);
  const validationHasErrors = hasEditorialErrors(validationIssues);
  const stats = useMemo(() => ({
    total: queue.items.length,
    pending: queue.items.filter(item => item.status === "pending").length,
    generated: queue.items.filter(item => item.status === "generated").length,
    reviewed: queue.items.filter(item => item.status === "reviewed" || item.status === "published").length,
    failed: queue.items.filter(item => item.status === "failed").length,
  }), [queue]);

  const commitQueue = (next: EditorialQueueState) => { setQueue(saveEditorialQueueState(next)); };
  const addRange = () => {
    if (!selectedBook) return;
    const next = enqueueEditorialRange(queue, selectedBook, language, start, end);
    const added = next.items.length - queue.items.length;
    commitQueue(next);
    Promise.all(next.items.slice(queue.items.length).map(item => saveJourneyEditorialDraft(credentials, item))).then(() => setCloudStatus("synced")).catch(() => setCloudStatus("error"));
    if (added) setSelectedId(next.items[next.items.length - added].id);
    toast.success(added ? `${added} capítulo(s) adicionado(s) à fila.` : "Esses capítulos já estão na fila.");
  };

  const generate = async (item: EditorialQueueItem, silent = false): Promise<boolean> => {
    setQueue(current => saveEditorialQueueState(updateEditorialQueueItem(current, item.id, { status: "generating", error: undefined })));
    try {
      const scriptureText = await fetchEditorialScripture(item);
      const book = books.find(candidate => candidate.slug === item.bookSlug);
      const chapter = book?.chapters[item.chapter - 1];
      const result = await generateChapterEditorial({
        bookName: item.bookName, chapter: item.chapter, language: item.language, scriptureText,
        previousChapterTitle: item.chapter > 1 ? book?.chapters[item.chapter - 2]?.content[item.language].title : undefined,
        nextChapterTitle: book && item.chapter < book.chapterCount ? book.chapters[item.chapter]?.content[item.language].title : undefined,
      }, credentials);
      const generatedItem = { ...item, status: "generated" as const, result, error: undefined, updatedAt: new Date().toISOString() };
      setQueue(current => saveEditorialQueueState(updateEditorialQueueItem(current, item.id, generatedItem)));
      saveJourneyEditorialDraft(credentials, generatedItem).catch(() => setCloudStatus("error"));
      if (!silent) getJourneyAiUsage(credentials).then(setUsage).catch(() => undefined);
      if (!silent) toast.success("Conteúdo gerado e guardado localmente.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar o conteúdo.";
      setQueue(current => saveEditorialQueueState(updateEditorialQueueItem(current, item.id, { status: "failed", error: message })));
      if (!silent) toast.error(message);
      return false;
    }
  };

  const runBatch = async () => {
    const allowed = Math.min(5, usage?.remaining ?? 5);
    const items = queue.items.filter(item => item.status === "pending").slice(0, allowed);
    if (!items.length) return toast.error("Não há capítulos pendentes disponíveis para o lote.");
    batchCancelled.current = false;
    setBatchProgress({ done: 0, total: items.length, current: "Preparando" });
    let successes = 0;
    for (let index = 0; index < items.length; index += 1) {
      if (batchCancelled.current) break;
      const item = items[index];
      setSelectedId(item.id);
      setBatchProgress({ done: index, total: items.length, current: `${item.bookName} ${item.chapter}` });
      if (await generate(item, true)) successes += 1;
      setBatchProgress({ done: index + 1, total: items.length, current: `${item.bookName} ${item.chapter}` });
    }
    const interrupted = batchCancelled.current;
    setBatchProgress(undefined);
    getJourneyAiUsage(credentials).then(setUsage).catch(() => undefined);
    toast.success(interrupted ? `Lote interrompido. ${successes} capítulo(s) gerado(s).` : `Lote concluído: ${successes} capítulo(s) gerado(s).`);
  };

  const publish = async (item: EditorialQueueItem) => {
    if (!item.result || item.status !== "reviewed") return;
    if (hasEditorialErrors(validateEditorialResult(item.result))) return toast.error("Corrija os problemas editoriais antes de publicar.");
    try {
      await publishJourneyEditorial(credentials, { bookSlug: item.bookSlug, chapter: item.chapter, language: item.language, result: item.result });
      setQueue(current => saveEditorialQueueState(updateEditorialQueueItem(current, item.id, { status: "published", error: undefined })));
      listPublishedJourneyEditorials(credentials).then(setPublishedItems).catch(() => undefined);
      listJourneyEditorialHistory(credentials).then(setHistoryItems).catch(() => undefined);
      toast.success("Capítulo publicado na Jornada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao publicar.");
    }
  };

  const editResult = (item: EditorialQueueItem, field: keyof EditorialGenerationResult, value: string | string[]) => {
    if (!item.result) return;
    const nextResult = { ...item.result, [field]: value } as EditorialGenerationResult;
    setQueue(current => saveEditorialQueueState(updateEditorialQueueItem(current, item.id, {
      result: nextResult,
      status: "generated",
      error: undefined,
    })));
  };

  const editList = (item: EditorialQueueItem, field: "characters" | "places" | "relatedReferences", value: string) => {
    editResult(item, field, value.split(/[,\n]/).map(entry => entry.trim()).filter(Boolean));
  };

  const approve = (item: EditorialQueueItem) => {
    if (!item.result || hasEditorialErrors(validateEditorialResult(item.result))) return toast.error("Corrija os campos obrigatórios antes de aprovar.");
    commitQueue(updateEditorialQueueItem(queue, item.id, { status: "reviewed" }));
    toast.success("Conteúdo aprovado para publicação.");
  };

  const unpublish = async (item: PublishedEditorialSummary) => {
    try {
      await unpublishJourneyEditorial(credentials, item);
      setPublishedItems(current => current.filter(entry => !(entry.bookSlug === item.bookSlug && entry.chapter === item.chapter && entry.language === item.language)));
      setQueue(current => saveEditorialQueueState(updateEditorialQueueItem(current, `${item.bookSlug}:${item.chapter}:${item.language}`, { status: "reviewed" })));
      listJourneyEditorialHistory(credentials).then(setHistoryItems).catch(() => undefined);
      toast.success("Publicação retirada do ar; o rascunho local foi preservado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao retirar publicação."); }
  };

  const restore = async (item: EditorialHistorySummary) => {
    try {
      await restoreJourneyEditorialHistory(credentials, item.id);
      const [publications, history] = await Promise.all([listPublishedJourneyEditorials(credentials), listJourneyEditorialHistory(credentials)]);
      setPublishedItems(publications); setHistoryItems(history);
      toast.success("Versão restaurada e publicada novamente.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao restaurar versão."); }
  };

  const removeDraft = (item: EditorialQueueItem) => {
    commitQueue(removeEditorialQueueItem(queue, item.id)); setSelectedId(undefined);
    deleteJourneyEditorialDraft(credentials, item.id).then(() => setCloudStatus("synced")).catch(() => setCloudStatus("error"));
  };

  return <div className="space-y-6">
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3"><Sparkles className="h-5 w-5 text-primary mt-0.5" /><div><h3 className="font-display text-lg font-bold">Produção editorial da Jornada</h3><p className="text-sm text-muted-foreground mt-1">Crie a fila, gere com base no texto bíblico e revise antes de publicar. Os rascunhos são sincronizados com segurança.</p></div></div>
        <div className={`shrink-0 flex items-center gap-1.5 text-xs ${cloudStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}>{cloudStatus === "synced" ? <CloudCog className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}{cloudStatus === "loading" ? "Carregando" : cloudStatus === "saving" ? "Salvando" : cloudStatus === "synced" ? "Sincronizado" : "Falha na nuvem"}</div>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Object.entries(stats).map(([key, value]) => <div key={key} className="rounded-xl border bg-card p-4"><p className="text-2xl font-bold text-primary">{value}</p><p className="text-xs text-muted-foreground">{{ total: "Na fila", pending: "Pendentes", generated: "Gerados", reviewed: "Revisados", failed: "Com falha" }[key]}</p></div>)}
    </div>
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h3 className="font-semibold">Adicionar capítulos</h3>
      <div className="grid md:grid-cols-[2fr_1fr_100px_100px_auto] gap-3 items-end">
        <div className="space-y-1.5"><Label>Livro</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={bookSlug} onChange={e => { setBookSlug(e.target.value); setStart(1); setEnd(1); }}>{books.map(book => <option key={book.slug} value={book.slug}>{book.position}. {book.overview["pt-PT"].title}</option>)}</select></div>
        <div className="space-y-1.5"><Label>Idioma</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={language} onChange={e => setLanguage(e.target.value as JourneyLanguage)}>{JOURNEY_LANGUAGES.map(lang => <option key={lang} value={lang}>{languageLabels[lang]}</option>)}</select></div>
        <div className="space-y-1.5"><Label>Do capítulo</Label><Input type="number" min={1} max={selectedBook?.chapterCount} value={start} onChange={e => setStart(Number(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>Até</Label><Input type="number" min={1} max={selectedBook?.chapterCount} value={end} onChange={e => setEnd(Number(e.target.value))} /></div>
        <Button onClick={addRange} className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-3"><div><p className="text-sm font-medium">Produção em lote</p><p className="text-xs text-muted-foreground">Gera até 5 capítulos pendentes por vez; todos continuam exigindo revisão individual.</p></div>{batchProgress ? <div className="flex items-center gap-3"><span className="text-sm"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />{batchProgress.done}/{batchProgress.total} · {batchProgress.current}</span><Button size="sm" variant="destructive" onClick={() => { batchCancelled.current = true; }}>Interromper</Button></div> : <Button variant="outline" disabled={!queue.items.some(item => item.status === "pending") || usage?.remaining === 0} onClick={() => setBatchConfirm(true)}>Gerar próximos 5</Button>}</div>
    </div>
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between"><div><h3 className="font-semibold">Conteúdos publicados</h3><p className="text-xs text-muted-foreground mt-1">{publishedItems.length} capítulo(s) disponível(is) para os alunos</p></div></div>
      {!publishedItems.length ? <p className="p-6 text-sm text-muted-foreground text-center">Ainda não há capítulos publicados pelo painel.</p> : <div className="divide-y max-h-72 overflow-auto">{publishedItems.map(item => {
        const book = books.find(entry => entry.slug === item.bookSlug);
        return <div key={`${item.bookSlug}:${item.chapter}:${item.language}`} className="p-4 flex items-center justify-between gap-3"><div><p className="font-medium">{book?.overview[item.language].title || item.bookSlug} {item.chapter} · {item.title}</p><p className="text-xs text-muted-foreground">{languageLabels[item.language]} · atualizado em {new Date(item.updatedAt).toLocaleDateString("pt-PT")}</p></div><div className="flex gap-2"><Button asChild size="icon" variant="ghost"><a href={`/jornada/${book?.testament || "old-testament"}/${item.bookSlug}/capitulos/${item.chapter}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button><Button size="sm" variant="outline" onClick={() => setUnpublishItem(item)}>Retirar do ar</Button></div></div>;
      })}</div>}
    </div>
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Histórico editorial</h3><p className="text-xs text-muted-foreground mt-1">Últimas publicações, atualizações, retiradas e restaurações</p></div>
      {!historyItems.length ? <p className="p-6 text-sm text-muted-foreground text-center">O histórico começará na próxima publicação.</p> : <div className="divide-y max-h-72 overflow-auto">{historyItems.map(item => {
        const labels = { published: "Publicado", updated: "Atualizado", unpublished: "Retirado", restored: "Restaurado" };
        const book = books.find(entry => entry.slug === item.bookSlug);
        return <div key={item.id} className="p-4 flex items-center justify-between gap-3"><div><p className="font-medium">{book?.overview[item.language].title || item.bookSlug} {item.chapter} · {item.title}</p><p className="text-xs text-muted-foreground"><Badge variant="secondary" className="mr-2">{labels[item.action]}</Badge>{new Date(item.createdAt).toLocaleString("pt-PT")}</p></div><Button size="sm" variant="outline" onClick={() => setRestoreItem(item)}>Restaurar versão</Button></div>;
      })}</div>}
    </div>
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Fila editorial</h3></div>
        <div className="max-h-[620px] overflow-auto divide-y">
          {!queue.items.length && <p className="p-6 text-sm text-muted-foreground text-center">Adicione um intervalo de capítulos para começar.</p>}
          {queue.items.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full p-4 text-left hover:bg-muted/60 transition ${selected?.id === item.id ? "bg-primary/10" : ""}`}><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{item.bookName} {item.chapter}</p><p className="text-xs text-muted-foreground">{languageLabels[item.language]} · fonte {item.sourceVersion}</p></div><Badge variant={item.status === "failed" ? "destructive" : "secondary"}>{statusLabels[item.status]}</Badge></div></button>)}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-5 min-h-[420px]">
        {!selected ? <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3"><BookOpen className="h-10 w-10" /><p>Selecione um capítulo da fila.</p></div> : <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-primary">{languageLabels[selected.language]}</p><h3 className="font-display text-2xl font-bold">{selected.bookName} {selected.chapter}</h3><p className="text-xs text-muted-foreground">Texto-base: {selected.sourceVersion}</p>{usage && <p className="text-xs text-muted-foreground mt-1">Gerações com IA hoje: <strong>{usage.used}/{usage.limit}</strong> · {usage.remaining} restantes</p>}</div><div className="flex gap-2"><Button variant="outline" size="icon" onClick={() => removeDraft(selected)}><Trash2 className="h-4 w-4" /></Button><Button onClick={() => selected.result ? setRegenerateItem(selected) : generate(selected)} disabled={selected.status === "generating" || usage?.remaining === 0} className="gap-2">{selected.status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{selected.result ? "Gerar novamente" : "Gerar capítulo"}</Button></div></div>
          {selected.error && <div className="rounded-lg bg-destructive/10 text-destructive p-3 text-sm flex gap-2"><TriangleAlert className="h-4 w-4 shrink-0" />{selected.error}</div>}
          {!selected.result ? (
            <div className="rounded-xl border border-dashed p-10 text-center"><Clock3 className="h-8 w-8 mx-auto text-muted-foreground mb-3" /><p className="font-medium">Aguardando geração</p><p className="text-sm text-muted-foreground mt-1">A IA usará o capítulo bíblico completo como fonte.</p></div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">Edite livremente. Qualquer alteração devolve o capítulo ao estado <strong>Gerado</strong> e exige uma nova aprovação.</div>
              <div className={`rounded-lg border p-3 text-sm ${validationHasErrors ? "border-destructive/40 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                <p className="font-medium">{validationIssues.length ? `${validationIssues.length} verificação(ões) editorial(is)` : "Conteúdo pronto para aprovação"}</p>
                {validationIssues.length > 0 && <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{validationIssues.map((issue, index) => <li key={`${issue.field}:${index}`}><strong>{issue.severity === "error" ? "Corrigir" : "Conferir"}:</strong> {issue.message}</li>)}</ul>}
              </div>
              <div className="space-y-1.5"><Label>Título</Label><Input value={selected.result.title} onChange={event => editResult(selected, "title", event.target.value)} /></div>
              <div className="space-y-1.5"><Label>Resumo</Label><Textarea rows={4} value={selected.result.summary} onChange={event => editResult(selected, "summary", event.target.value)} /></div>
              <div className="space-y-1.5"><Label>Tema central</Label><Input value={selected.result.keyTheme} onChange={event => editResult(selected, "keyTheme", event.target.value)} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Personagens</Label><Textarea key={`${selected.id}:characters:${selected.updatedAt}`} rows={3} defaultValue={selected.result.characters.join(", ")} onBlur={event => editList(selected, "characters", event.target.value)} placeholder="Separe por vírgulas" /></div>
                <div className="space-y-1.5"><Label>Lugares</Label><Textarea key={`${selected.id}:places:${selected.updatedAt}`} rows={3} defaultValue={selected.result.places.join(", ")} onBlur={event => editList(selected, "places", event.target.value)} placeholder="Separe por vírgulas" /></div>
              </div>
              <div className="space-y-1.5"><Label>Referências relacionadas</Label><Input key={`${selected.id}:references:${selected.updatedAt}`} defaultValue={selected.result.relatedReferences.join(", ")} onBlur={event => editList(selected, "relatedReferences", event.target.value)} /></div>
              <div className="space-y-1.5"><Label>Pergunta para reflexão</Label><Textarea rows={3} value={selected.result.reflectionPrompt} onChange={event => editResult(selected, "reflectionPrompt", event.target.value)} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Ligação com o capítulo anterior</Label><Textarea rows={3} value={selected.result.previousConnection} onChange={event => editResult(selected, "previousConnection", event.target.value)} /></div>
                <div className="space-y-1.5"><Label>Ligação com o próximo capítulo</Label><Textarea rows={3} value={selected.result.nextConnection} onChange={event => editResult(selected, "nextConnection", event.target.value)} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2"><Button className="gap-2" variant="outline" disabled={selected.status === "published" || validationHasErrors} onClick={() => approve(selected)}><Check className="h-4 w-4" />{selected.status === "reviewed" || selected.status === "published" ? "Revisado" : "Aprovar revisão"}</Button><Button disabled={selected.status !== "reviewed" || validationHasErrors} onClick={() => publish(selected)}>Publicar na Jornada</Button></div>
            </div>
          )}
        </div>}
      </div>
    </div>
    <AlertDialog open={Boolean(regenerateItem)} onOpenChange={open => { if (!open) setRegenerateItem(undefined); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Gerar este capítulo novamente?</AlertDialogTitle><AlertDialogDescription>O conteúdo atual será substituído. Se o texto-base não mudou, o servidor poderá reutilizar o cache sem consumir uma nova geração.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { const item = regenerateItem; setRegenerateItem(undefined); if (item) generate(item); }}>Confirmar regeneração</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={batchConfirm} onOpenChange={setBatchConfirm}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Iniciar geração em lote?</AlertDialogTitle><AlertDialogDescription>Serão gerados até 5 capítulos pendentes em sequência, respeitando a cota diária. Cada resultado ficará como rascunho e precisará ser revisado antes da publicação.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { setBatchConfirm(false); runBatch(); }}>Iniciar lote</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={Boolean(unpublishItem)} onOpenChange={open => { if (!open) setUnpublishItem(undefined); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Retirar este capítulo do ar?</AlertDialogTitle><AlertDialogDescription>Os alunos deixarão de ver a versão publicada. O conteúdo da sua fila local será preservado para correção e nova publicação.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { const item = unpublishItem; setUnpublishItem(undefined); if (item) unpublish(item); }}>Retirar do ar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={Boolean(restoreItem)} onOpenChange={open => { if (!open) setRestoreItem(undefined); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Restaurar esta versão?</AlertDialogTitle><AlertDialogDescription>A versão selecionada voltará a ser a publicação visível para os alunos. A publicação atual permanecerá registrada no histórico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { const item = restoreItem; setRestoreItem(undefined); if (item) restore(item); }}>Restaurar e publicar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
};

export default JourneyEditorialSection;
