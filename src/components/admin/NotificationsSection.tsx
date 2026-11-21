import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { BellRing, CheckCircle2, Loader2, RefreshCw, Send, TriangleAlert } from "lucide-react";
import { firebaseConfigurado } from "@/lib/firebase-config";
import { IDIOMAS_PUSH, LIMITES, PLANOS_PUSH, validarMensagem, type GrupoPlano, type Publico } from "../../../supabase/functions/push-send/publico";

/* Central de mensagens (21/11/2026), no modelo da Fome Livre: título, mensagem, link do app, público
   (todos / plano / idioma / um e-mail de teste), prévia iPhone e Android, contagem, confirmação com o
   número de pessoas e histórico. Quem envia é a função push-send (FCM HTTP v1). */

interface Props {
  creds: { _admin_email: string; _admin_password: string };
  onUnauthorized: () => void;
}

type Envio = {
  id: number; criado_em: string; criado_por: string | null; titulo: string; texto: string; link: string | null; publico_rotulo: string | null;
  pessoas: number; aparelhos: number; status: string; enviados: number; falhas: number; removidos: number; abertos: number;
};
type Status = { configurado: boolean; projeto: string | null; aparelhos: number };
type Contagem = { pessoas: number; aparelhos: number; rotulo: string };

const LINKS = [
  { valor: "/", rotulo: "Início" },
  { valor: "/biblia", rotulo: "Bíblia" },
  { valor: "/jornada", rotulo: "Jornada Bíblica" },
  { valor: "/oficina", rotulo: "Oficina de Sermões" },
  { valor: "/devocional", rotulo: "Devocional" },
  { valor: "/livraria", rotulo: "Livraria" },
  { valor: "/mural", rotulo: "Mural" },
  { valor: "outro", rotulo: "Outro caminho do app…" },
];

const ERROS: Record<string, string> = {
  nao_autorizado: "Sessão de admin expirada. Entre de novo.",
  firebase_nao_configurado: "Falta o secret FCM_SERVICE_ACCOUNT na função push-send.",
  firebase_recusou: "O Google recusou a conta de serviço (confira o secret FCM_SERVICE_ACCOUNT).",
  ninguem_inscrito: "Ninguém desse público ativou as notificações ainda.",
  publico_grande: "Público grande demais para um envio só (mais de 5000 aparelhos).",
  envio_repetido: "Essa mesma mensagem acabou de ser enviada. Espere 1 minuto para repetir.",
  link_fora_do_app: "O link precisa ser um caminho do app, começando com / (ex.: /biblia).",
  titulo_vazio: "Escreva o título.", texto_vazio: "Escreva a mensagem.",
  titulo_longo: `Título com mais de ${LIMITES.titulo} letras.`, texto_longo: `Mensagem com mais de ${LIMITES.texto} letras.`,
  publico_invalido: "Escolha o público (e um e-mail válido no teste).",
  funcao_indisponivel: "A função push-send ainda não está publicada no Supabase (ou a migração não foi rodada).",
};

const STATUS_ROTULO: Record<string, string> = { enviando: "Enviando", enviado: "Enviado", parcial: "Parcial", falhou: "Falhou" };
/** "Enviando" há mais de 10 minutos = a função parou no meio (tempo limite); os números podem estar incompletos. */
const situacao = (e: Envio) =>
  e.status === "enviando" && Date.now() - new Date(e.criado_em).getTime() > 10 * 60_000 ? "Interrompido" : STATUS_ROTULO[e.status] ?? e.status;

/** Resposta da push-send: ok + data, ou erro (+ extra com o corpo do erro, ex.: { pessoas } no 409). */
type Resposta<T> = { ok: boolean; data: T | null; erro: string; extra: Record<string, unknown> | null };

async function chamar<T>(corpo: Record<string, unknown>): Promise<Resposta<T>> {
  const { data, error } = await supabase.functions.invoke("push-send", { body: corpo });
  if (!error) return data?.ok ? { ok: true, data: data as T, erro: "", extra: null } : { ok: false, data: null, erro: String(data?.error ?? "erro"), extra: data ?? null };
  const resp = (error as { context?: Response }).context;
  if (resp && typeof resp.json === "function") {
    const j = (await resp.clone().json().catch(() => null)) as Record<string, unknown> | null;
    if (j?.error) return { ok: false, data: null, erro: String(j.error), extra: j };
    return { ok: false, data: null, erro: resp.status === 404 ? "funcao_indisponivel" : "erro", extra: null };
  }
  return { ok: false, data: null, erro: "funcao_indisponivel", extra: null };
}

const fmtData = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const NotificationsSection = ({ creds, onUnauthorized }: Props) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusErro, setStatusErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<Envio[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [linkSel, setLinkSel] = useState("/");
  const [linkOutro, setLinkOutro] = useState("");
  const [tipo, setTipo] = useState<"todos" | "plano" | "email">("email");
  const [plano, setPlano] = useState<GrupoPlano>("br");
  const [idiomas, setIdiomas] = useState<string[]>([]);
  const [emailTeste, setEmailTeste] = useState(creds._admin_email);

  const [contagem, setContagem] = useState<Contagem | null>(null);
  const [contando, setContando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Uma chave por confirmação: o servidor recusa a mesma chave duas vezes (duas abas, clique repetido).
  const chaveRef = useRef<string>("");

  const link = linkSel === "outro" ? linkOutro.trim() : linkSel;
  const publico: Publico = useMemo(() => {
    if (tipo === "email") return { tipo: "email", email: emailTeste.trim().toLowerCase() };
    const extra = idiomas.length ? { idiomas } : {};
    return tipo === "plano" ? { tipo: "plano", plano, ...extra } : { tipo: "todos", ...extra };
  }, [tipo, plano, idiomas, emailTeste]);
  const validacao = validarMensagem({ titulo, texto, link });
  const erroValidacao = validacao.ok ? null : (validacao as { erro: string }).erro;

  const credsRef = useRef(creds);
  credsRef.current = creds;
  const base = useCallback((acao: string, extra: Record<string, unknown> = {}) => ({ acao, creds: credsRef.current, ...extra }), []);

  const tratarErro = useCallback((erro: string) => {
    if (erro === "nao_autorizado") { toast.error(ERROS.nao_autorizado); onUnauthorized(); return; }
    toast.error(ERROS[erro] ?? "Não deu certo. Tente de novo.");
  }, [onUnauthorized]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [s, h] = await Promise.all([chamar<Status>(base("status")), chamar<{ envios: Envio[] }>(base("historico"))]);
    setCarregando(false);
    if (s.ok) { setStatus(s.data); setStatusErro(null); } else { setStatus(null); setStatusErro(s.erro); if (s.erro === "nao_autorizado") onUnauthorized(); }
    if (h.ok) setHistorico(h.data.envios);
  }, [base, onUnauthorized]);

  useEffect(() => { void carregar(); }, [carregar]);

  // Contagem automática ao mudar o público (meio segundo depois da última mudança).
  useEffect(() => {
    if (statusErro) return;
    if (publico.tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publico.email)) { setContagem(null); return; }
    let ativo = true;
    setContando(true);
    const id = window.setTimeout(async () => {
      const r = await chamar<Contagem>(base("contar", { publico }));
      if (!ativo) return;
      setContando(false);
      setContagem(r.ok ? r.data : null);
    }, 500);
    return () => { ativo = false; window.clearTimeout(id); };
  }, [publico, base, statusErro]);

  const enviar = async () => {
    if (!validacao.ok || !contagem) return;
    setEnviando(true);
    const r = await chamar<{ envio: number; enviados: number; falhas: number; removidos: number; status: string }>(
      base("enviar", { publico, titulo, texto, link, confirmar: contagem.pessoas, chave: chaveRef.current }),
    );
    setEnviando(false);
    setConfirmar(false);
    if (!r.ok) {
      if (r.erro === "confirmacao_diferente" && r.extra) {
        const pessoas = Number(r.extra.pessoas) || 0;
        setContagem((c) => (c ? { ...c, pessoas, aparelhos: Number(r.extra?.aparelhos) || 0 } : c));
        toast.warning(`O público mudou: agora são ${pessoas} pessoas. Confira e confirme de novo.`);
        return;
      }
      tratarErro(r.erro);
      void carregar();
      return;
    }
    toast.success(`Enviado: ${r.data.enviados} aparelho(s)${r.data.falhas ? `, ${r.data.falhas} falha(s)` : ""}${r.data.removidos ? `, ${r.data.removidos} removido(s)` : ""}.`);
    if (publico.tipo !== "email") { setTitulo(""); setTexto(""); }
    void carregar();
  };

  const alternarIdioma = (l: string) => setIdiomas((xs) => (xs.includes(l) ? xs.filter((x) => x !== l) : [...xs, l]));
  const frontPronto = firebaseConfigurado();
  const podeEnviar = validacao.ok && !!contagem && contagem.aparelhos > 0 && !contando && !!status?.configurado;

  return (
    <div className="space-y-6">
      {/* Selo do Firebase */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-2" aria-live="polite">
        {carregando ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Conferindo o Firebase…</p>
        ) : statusErro ? (
          <p className="flex items-start gap-2 text-sm text-destructive"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{ERROS[statusErro] ?? ERROS.funcao_indisponivel}</p>
        ) : status && (
          <>
            <p className={`flex items-center gap-2 text-sm font-medium ${status.configurado ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
              {status.configurado ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
              {status.configurado ? `Firebase pronto · ${status.projeto}` : "Firebase sem conta de serviço (secret FCM_SERVICE_ACCOUNT)"}
            </p>
            <p className="text-sm text-muted-foreground">{status.aparelhos} aparelho(s) com notificações ativas.</p>
          </>
        )}
        {!frontPronto && (
          <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Falta colar a config web e a chave VAPID do Firebase em src/lib/firebase-config.ts: até lá o app não mostra o convite nem o sininho.
          </p>
        )}
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => void carregar()}><RefreshCw className="h-4 w-4" />Atualizar</Button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Escrever */}
        <section className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-5">
          <h3 className="font-display text-lg font-bold text-primary">Nova mensagem</h3>
          <div className="space-y-1.5">
            <Label htmlFor="push-titulo">Título</Label>
            <Input id="push-titulo" value={titulo} maxLength={LIMITES.titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Novo livro na Jornada" />
            <p className="text-sm text-muted-foreground">{titulo.trim().length}/{LIMITES.titulo}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="push-texto">Mensagem</Label>
            <Textarea id="push-texto" value={texto} maxLength={LIMITES.texto} rows={3} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Rute já está no mapa interativo. Toque para abrir." />
            <p className="text-sm text-muted-foreground">{texto.trim().length}/{LIMITES.texto}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="push-link">Ao tocar, abre</Label>
            <select id="push-link" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={linkSel} onChange={(e) => setLinkSel(e.target.value)}>
              {LINKS.map((l) => <option key={l.valor} value={l.valor}>{l.rotulo}{l.valor !== "outro" ? ` (${l.valor})` : ""}</option>)}
            </select>
            {linkSel === "outro" && <Input aria-label="Caminho do app" value={linkOutro} onChange={(e) => setLinkOutro(e.target.value)} placeholder="/jornada/rute" />}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Público</legend>
            {([
              ["email", "Só um e-mail (teste)"],
              ["todos", "Todos com acesso"],
              ["plano", "Por plano"],
            ] as const).map(([v, r]) => (
              <label key={v} className="flex min-h-11 items-center gap-3 text-sm">
                <input type="radio" name="push-publico" value={v} checked={tipo === v} onChange={() => setTipo(v)} className="h-5 w-5 accent-primary" />{r}
              </label>
            ))}
            {tipo === "email" && <Input type="email" aria-label="E-mail de teste" value={emailTeste} onChange={(e) => setEmailTeste(e.target.value)} placeholder="email@exemplo.com" />}
            {tipo === "plano" && (
              <select aria-label="Plano" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={plano} onChange={(e) => setPlano(e.target.value as GrupoPlano)}>
                {(Object.keys(PLANOS_PUSH) as GrupoPlano[]).map((k) => <option key={k} value={k}>{PLANOS_PUSH[k]}</option>)}
              </select>
            )}
            {tipo !== "email" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Idioma do app (nenhum marcado = todos):</p>
                <div className="flex flex-wrap gap-2">
                  {IDIOMAS_PUSH.map((l) => (
                    <label key={l} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${idiomas.includes(l) ? "border-primary bg-primary/10" : "border-border"}`}>
                      <input type="checkbox" checked={idiomas.includes(l)} onChange={() => alternarIdioma(l)} className="h-4 w-4 accent-primary" />{l}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </fieldset>

          <p className="rounded-lg bg-muted p-3 text-sm" aria-live="polite" data-testid="push-contagem">
            {contando ? "Contando…" : contagem ? <>Vai para <strong>{contagem.pessoas} pessoa(s)</strong> ({contagem.aparelhos} aparelho(s)) · {contagem.rotulo}</> : "Escolha o público para ver quantas pessoas recebem."}
          </p>
          {erroValidacao && (titulo || texto || linkSel === "outro") && <p className="text-sm text-destructive">{ERROS[erroValidacao]}</p>}

          <Button className="h-12 w-full gap-2 text-base" disabled={!podeEnviar || enviando} onClick={() => { chaveRef.current = crypto.randomUUID(); setConfirmar(true); }}>
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {publico.tipo === "email" ? "Enviar teste" : "Enviar"}
          </Button>
        </section>

        {/* Prévia */}
        <section className="space-y-4" aria-label="Prévia da notificação">
          <h3 className="font-display text-lg font-bold text-primary">Prévia</h3>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">iPhone</p>
            <div className="rounded-[1.25rem] bg-zinc-200/90 p-3 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50">
              <div className="flex gap-3">
                <img src="/pwa-icon-192.png" alt="" className="h-10 w-10 rounded-[0.6rem]" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold">{titulo.trim() || "Título"}</p><span className="shrink-0 text-sm opacity-60">agora</span></div>
                  <p className="line-clamp-4 text-sm">{texto.trim() || "Mensagem"}</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Android</p>
            <div className="rounded-xl bg-white p-3 text-zinc-900 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-50">
              <p className="mb-1 flex items-center gap-2 text-sm opacity-70"><BellRing className="h-3.5 w-3.5" />Ferramentas do Cristão · app.ferramentasdocristao.com</p>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{titulo.trim() || "Título"}</p>
                  <p className="line-clamp-3 text-sm opacity-80">{texto.trim() || "Mensagem"}</p>
                </div>
                <img src="/pwa-icon-192.png" alt="" className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Ao tocar, abre: <code>{link || "/"}</code></p>
        </section>
      </div>

      {/* Histórico */}
      <section className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
        <h3 className="font-display text-lg font-bold text-primary">Histórico</h3>
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum envio ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead><TableHead>Mensagem</TableHead><TableHead>Público</TableHead>
                  <TableHead className="text-right">Pessoas</TableHead><TableHead className="text-right">Chegaram</TableHead>
                  <TableHead className="text-right">Falhas</TableHead><TableHead className="text-right">Removidos</TableHead>
                  <TableHead className="text-right">Toques</TableHead><TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{fmtData(e.criado_em)}</TableCell>
                    <TableCell className="min-w-[14rem]"><p className="font-medium">{e.titulo}</p><p className="text-sm text-muted-foreground">{e.texto}</p></TableCell>
                    <TableCell className="min-w-[10rem]">{e.publico_rotulo}</TableCell>
                    <TableCell className="text-right">{e.pessoas}</TableCell>
                    <TableCell className="text-right">{e.enviados}</TableCell>
                    <TableCell className="text-right">{e.falhas}</TableCell>
                    <TableCell className="text-right">{e.removidos}</TableCell>
                    <TableCell className="text-right">{e.abertos}</TableCell>
                    <TableCell>{situacao(e)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza? Vai para {contagem?.pessoas ?? 0} pessoa(s).</AlertDialogTitle>
            <AlertDialogDescription>
              {contagem?.rotulo}. São {contagem?.aparelhos ?? 0} aparelho(s). Notificação enviada não tem volta: não dá para apagar do celular das pessoas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={enviando} onClick={(e) => { e.preventDefault(); void enviar(); }}>
              {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Sim, enviar para {contagem?.pessoas ?? 0}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotificationsSection;
