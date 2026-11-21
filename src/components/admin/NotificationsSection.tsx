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
import { BellRing, CheckCircle2, Languages, Loader2, RefreshCw, Send, TriangleAlert } from "lucide-react";
import { firebaseConfigurado } from "@/lib/firebase-config";
import { IDIOMAS_PUSH, LIMITES, PLANOS_PUSH, rotuloPublico, validarMensagem, type GrupoPlano, type Publico } from "../../../supabase/functions/push-send/publico";
import { chaveCache, IDIOMA_ORIGEM, type Traducoes, type Versao } from "../../../supabase/functions/push-send/traducao";
import { chaveDoItem, chaveOrigem, erroDoItem, idiomasTraduzidos, NOME_IDIOMA, OUTROS, planoDeEnvio, type ItemEnvio } from "./notificacoes-idiomas";

/* Central de mensagens (21/11/2026), no modelo da Fome Livre: título, mensagem, link do app, público
   (todos / plano / um e-mail de teste), prévia iPhone e Android, contagem, confirmação com o
   número de pessoas e histórico. Quem envia é a função push-send (FCM HTTP v1).
   Idiomas (21/11, pedido do dono): escreve em pt-BR, marca os idiomas de saída, "Traduzir" (Claude Haiku
   no servidor, ação traduzir do push-send) gera versões editáveis; um envio por idioma, cada pessoa recebe
   no idioma do app. pt-BR sai como foi escrito. Ver notificacoes-idiomas.ts. */

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
  sem_idiomas: "Marque pelo menos um idioma além do português para traduzir.",
  traducao_sem_chave: "A tradução ainda não está ligada (falta o secret ANTHROPIC_API_KEY na função push-send).",
  traducao_falhou: "A tradução não respondeu.",
  traducao_ocupada: "O serviço de tradução está ocupado agora.",
  traducao_vazia: "A tradução voltou vazia.", traducao_invalida: "A tradução voltou num formato inesperado.",
  traducao_incompleta: "A tradução voltou faltando algum idioma.", traducao_recusada: "O serviço de tradução recusou este texto.",
  traducao_cortada: "A tradução veio cortada.",
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
  const [emailTeste, setEmailTeste] = useState(creds._admin_email);

  // Idiomas de saída: o dono escreve em pt-BR e marca para quem vai. Cada idioma é um envio separado.
  const [marcados, setMarcados] = useState<string[]>([IDIOMA_ORIGEM]);
  const [outrosEmPt, setOutrosEmPt] = useState(false);
  const [versoes, setVersoes] = useState<Record<string, Versao>>({});
  const [traduzidoDe, setTraduzidoDe] = useState<string | null>(null);
  const [traduzindo, setTraduzindo] = useState(false);
  const [erroTraducao, setErroTraducao] = useState<string | null>(null);
  const cacheTraducao = useRef(new Map<string, Traducoes>());
  const [previa, setPrevia] = useState<string>(IDIOMA_ORIGEM);
  const [testeIdioma, setTesteIdioma] = useState<string>(IDIOMA_ORIGEM);

  const [contagens, setContagens] = useState<Record<string, Contagem> | null>(null);
  const [contando, setContando] = useState(false);
  const [recontar, setRecontar] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Uma chave por confirmação: o servidor recusa a mesma chave duas vezes (duas abas, clique repetido).
  // A chave e a lista do que já saiu valem para ESTA mensagem (mesmos textos, públicos e link): se o envio
  // para no meio, confirmar de novo manda só os idiomas que faltam, e o servidor recusa repetir a mesma chave.
  const chaveRef = useRef<string>(crypto.randomUUID());
  const [jaFoi, setJaFoi] = useState<string[]>([]);

  const link = linkSel === "outro" ? linkOutro.trim() : linkSel;
  const origem: Versao = useMemo(() => ({ titulo, texto }), [titulo, texto]);
  const paraTraduzir = idiomasTraduzidos(marcados);
  const desatualizada = traduzidoDe !== null && traduzidoDe !== chaveOrigem(origem) && paraTraduzir.some((l) => versoes[l]);
  const validacaoOrigem = validarMensagem({ titulo, texto, link });
  const erroOrigem = validacaoOrigem.ok ? null : (validacaoOrigem as { erro: string }).erro;

  // Itens do envio: no teste, uma versão só (a escolhida) para o e-mail; senão, um por idioma.
  const itens: ItemEnvio[] = useMemo(() => {
    if (tipo === "email") {
      const v = testeIdioma === IDIOMA_ORIGEM ? origem : versoes[testeIdioma] ?? { titulo: "", texto: "" };
      return [{ id: testeIdioma, rotulo: NOME_IDIOMA[testeIdioma] ?? testeIdioma, publico: { tipo: "email", email: emailTeste.trim().toLowerCase() }, titulo: v.titulo, texto: v.texto }];
    }
    return planoDeEnvio({ tipo, plano, marcados, outrosEmPt, origem, versoes });
  }, [tipo, plano, marcados, outrosEmPt, origem, versoes, testeIdioma, emailTeste]);
  // Chave só do público (sem o texto): a contagem não refaz a cada letra digitada.
  const chavePublicos = JSON.stringify(itens.map((i) => [i.id, i.publico]));

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

  // Contagem automática por idioma ao mudar o público (meio segundo depois da última mudança).
  useEffect(() => {
    if (statusErro) return;
    const publicos = JSON.parse(chavePublicos) as [string, Publico][];
    if (!publicos.length) { setContagens({}); setContando(false); return; }
    const p0 = publicos[0][1];
    if (p0.tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p0.email)) { setContagens(null); setContando(false); return; }
    let ativo = true;
    setContando(true);
    const id = window.setTimeout(async () => {
      const rs = await Promise.all(publicos.map(([, publico]) => chamar<Contagem>(base("contar", { publico }))));
      if (!ativo) return;
      setContando(false);
      setContagens(rs.every((r) => r.ok) ? Object.fromEntries(publicos.map(([idItem], i) => [idItem, rs[i].data as Contagem])) : null);
    }, 500);
    return () => { ativo = false; window.clearTimeout(id); };
  }, [chavePublicos, base, statusErro, recontar]);

  // Assinatura da mensagem: mudou texto, público ou link = mensagem nova (chave nova, nada enviado ainda).
  const assinatura = JSON.stringify([itens.map((i) => [i.id, i.publico, i.titulo.trim(), i.texto.trim()]), link]);
  useEffect(() => { chaveRef.current = crypto.randomUUID(); setJaFoi([]); }, [assinatura]);

  // Só entram no lote os idiomas com alguém inscrito e que ainda não saíram; os outros ficam de fora sem erro.
  const lote = itens.filter((i) => (contagens?.[i.id]?.aparelhos ?? 0) > 0 && !jaFoi.includes(i.id));
  const total = useMemo(() => {
    if (!contagens) return null;
    return lote.reduce((t, i) => ({ pessoas: t.pessoas + (contagens[i.id]?.pessoas ?? 0), aparelhos: t.aparelhos + (contagens[i.id]?.aparelhos ?? 0) }), { pessoas: 0, aparelhos: 0 });
  }, [contagens, lote]);
  const errosDoLote = lote.map((i) => ({ item: i, erro: erroDoItem(i, link) })).filter((x) => x.erro);

  // idiomas: só os que faltam (tradução automática) ou todos os marcados (botão). auto = sem aviso de sucesso.
  const traduzir = async (idiomas: string[] = paraTraduzir, auto = false) => {
    if (!validacaoOrigem.ok || !idiomas.length) return;
    const t = titulo.trim(), x = texto.trim();
    const chave = chaveCache(t, x, idiomas);
    setErroTraducao(null);
    const guardada = cacheTraducao.current.get(chave);
    if (guardada) { setVersoes((v) => ({ ...v, ...guardada })); setTraduzidoDe(chaveOrigem(origem)); return; }
    setTraduzindo(true);
    const r = await chamar<{ traducoes: Traducoes; cache: boolean }>(base("traduzir", { titulo: t, texto: x, idiomas }));
    setTraduzindo(false);
    if (!r.ok) {
      if (r.erro === "nao_autorizado") { if (auto) autoRecusada.current = chaveCache(t, x, idiomas); tratarErro(r.erro); return; }
      // Falhou: campos vazios para o dono escrever à mão. Nada é enviado sem texto em cada idioma.
      setErroTraducao(ERROS[r.erro] ?? ERROS.traducao_falhou);
      setVersoes((v) => ({ ...v, ...Object.fromEntries(idiomas.map((l) => [l, { titulo: "", texto: "" }])) }));
      setTraduzidoDe(chaveOrigem(origem));
      return;
    }
    cacheTraducao.current.set(chave, r.data.traducoes);
    setVersoes((v) => ({ ...v, ...r.data.traducoes }));
    setTraduzidoDe(chaveOrigem(origem));
    if (!auto) toast.success(r.data.cache ? "Tradução reaproveitada (mesmo texto de antes)." : `Traduzido para ${idiomas.length} idioma(s). Confira antes de enviar.`);
  };

  // Tradução automática (pedido do dono, 21/11): 1,5 s depois de parar de digitar ou de marcar um idioma.
  // Texto em português mudou = traduz todos os marcados; só marcou idioma novo = traduz só o que falta
  // (não apaga o que o dono corrigiu à mão). Falha deixa campos vazios e não tenta de novo sozinha.
  const autoRecusada = useRef<string | null>(null); // mesma tradução recusada por acesso: não repete sozinha
  const traduzirRef = useRef(traduzir);
  traduzirRef.current = traduzir;
  const origemAtual = chaveOrigem(origem);
  const faltamTraduzir = !validacaoOrigem.ok ? [] : traduzidoDe !== origemAtual ? paraTraduzir : paraTraduzir.filter((l) => !versoes[l]);
  const chaveAuto = traduzindo ? "" : JSON.stringify([origemAtual, faltamTraduzir]);
  useEffect(() => {
    const [, faltam] = chaveAuto ? (JSON.parse(chaveAuto) as [string, string[]]) : ["", []];
    if (!faltam.length) return;
    const id = window.setTimeout(() => {
      if (autoRecusada.current === chaveCache(titulo.trim(), texto.trim(), faltam)) return;
      void traduzirRef.current(faltam, true);
    }, 1500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chaveAuto já inclui o texto (origemAtual)
  }, [chaveAuto]);

  const editarVersao = (l: string, campo: keyof Versao, valor: string) =>
    setVersoes((v) => ({ ...v, [l]: { ...(v[l] ?? { titulo: "", texto: "" }), [campo]: valor } }));

  const enviar = async () => {
    if (!contagens || !lote.length || errosDoLote.length) return;
    setEnviando(true);
    const feitos: string[] = [];
    const idsFeitos: string[] = [];
    let parou: string | null = null;
    for (const item of lote) {
      const r = await chamar<{ envio: number; enviados: number; falhas: number; removidos: number; status: string }>(
        base("enviar", { publico: item.publico, titulo: item.titulo, texto: item.texto, link, confirmar: contagens[item.id].pessoas, chave: chaveDoItem(chaveRef.current, item.id) }),
      );
      if (r.ok) { idsFeitos.push(item.id); feitos.push(`${item.rotulo}: ${r.data.enviados} aparelho(s)${r.data.falhas ? `, ${r.data.falhas} falha(s)` : ""}`); continue; }
      // Mesma chave (ou mesma mensagem há menos de 1 min) = esse idioma já saiu antes: segue para o próximo.
      if (r.erro === "envio_repetido") { idsFeitos.push(item.id); feitos.push(`${item.rotulo}: já tinha saído`); continue; }
      if (r.erro === "nao_autorizado") { setEnviando(false); setConfirmar(false); tratarErro(r.erro); return; }
      parou = r.erro === "confirmacao_diferente"
        ? `${item.rotulo}: o público mudou (agora ${Number(r.extra?.pessoas) || 0} pessoas). Confira e confirme de novo.`
        : `${item.rotulo}: ${ERROS[r.erro] ?? "não deu certo."}`;
      break;
    }
    setEnviando(false);
    setConfirmar(false);
    if (feitos.length) toast.success(`Enviado. ${feitos.join(" · ")}`);
    if (parou) {
      // Guarda o que já saiu: a próxima confirmação manda só o que falta.
      setJaFoi((xs) => [...xs, ...idsFeitos]);
      toast.error(idsFeitos.length ? `Parou no meio. ${parou} Os idiomas que já foram não saem de novo.` : parou);
      setRecontar((n) => n + 1);
    } else {
      // Tudo saiu: a próxima é uma mensagem nova (no teste por e-mail o texto fica para repetir).
      chaveRef.current = crypto.randomUUID();
      setJaFoi([]);
      if (tipo !== "email") { setTitulo(""); setTexto(""); setVersoes({}); setTraduzidoDe(null); }
    }
    void carregar();
  };

  // Idioma do teste desmarcado: volta para o pt-BR.
  useEffect(() => {
    if (testeIdioma !== IDIOMA_ORIGEM && !paraTraduzir.includes(testeIdioma)) setTesteIdioma(IDIOMA_ORIGEM);
  }, [testeIdioma, paraTraduzir]);

  // Desmarcou: a versão daquele idioma sai junto. Remarcado depois, ele é traduzido do texto atual
  // (senão voltaria uma tradução de um português antigo e sairia no envio).
  const alternarIdioma = (l: string) => {
    if (marcados.includes(l)) setVersoes((v) => { const { [l]: _fora, ...resto } = v; return resto; });
    setMarcados((xs) => (xs.includes(l) ? xs.filter((x) => x !== l) : [...xs, l]));
  };
  const frontPronto = firebaseConfigurado();
  const podeEnviar = !!contagens && lote.length > 0 && !errosDoLote.length && !desatualizada && !traduzindo && !contando && !!status?.configurado;
  const rotuloBase = tipo === "email" ? rotuloPublico({ tipo: "email", email: emailTeste.trim().toLowerCase() })
    : rotuloPublico(tipo === "plano" ? { tipo: "plano", plano } : { tipo: "todos" });
  const opcoesPrevia = tipo === "email" ? [testeIdioma] : itens.map((i) => i.id);
  const itemPrevia = itens.find((i) => i.id === previa) ?? itens[0];

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
          <p className="text-sm text-muted-foreground">Escreva em português. A tradução para os idiomas marcados sai sozinha; confira antes de enviar.</p>
          <div className="space-y-1.5">
            <Label htmlFor="push-titulo">Título em português</Label>
            <Input id="push-titulo" className="h-12 text-base" value={titulo} maxLength={LIMITES.titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Novo livro na Jornada" />
            <p className="text-sm text-muted-foreground">{titulo.trim().length}/{LIMITES.titulo}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="push-texto">Mensagem em português</Label>
            <Textarea id="push-texto" className="text-base" value={texto} maxLength={LIMITES.texto} rows={3} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Rute já está no mapa interativo. Toque para abrir." />
            <p className="text-sm text-muted-foreground">{texto.trim().length}/{LIMITES.texto}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="push-link">Ao tocar, abre</Label>
            <select id="push-link" className="h-12 w-full rounded-md border border-input bg-background px-3 text-base" value={linkSel} onChange={(e) => setLinkSel(e.target.value)}>
              {LINKS.map((l) => <option key={l.valor} value={l.valor}>{l.rotulo}{l.valor !== "outro" ? ` (${l.valor})` : ""}</option>)}
            </select>
            {linkSel === "outro" && <Input aria-label="Caminho do app" className="h-12 text-base" value={linkOutro} onChange={(e) => setLinkOutro(e.target.value)} placeholder="/jornada/rute" />}
          </div>

          <fieldset className="space-y-3" data-testid="push-idiomas">
            <legend className="text-sm font-medium">Idiomas de saída</legend>
            <p className="text-sm text-muted-foreground">Cada pessoa recebe no idioma do app dela. Idioma não marcado não recebe.</p>
            <div className="flex flex-wrap gap-2">
              {IDIOMAS_PUSH.map((l) => (
                <label key={l} className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${marcados.includes(l) ? "border-primary bg-primary/10 font-medium" : "border-border"}`}>
                  <input type="checkbox" checked={marcados.includes(l)} onChange={() => alternarIdioma(l)} className="h-5 w-5 accent-primary" />
                  {NOME_IDIOMA[l] ?? l}
                </label>
              ))}
            </div>
            <label className="flex min-h-12 items-center gap-3 text-sm">
              <input type="checkbox" checked={outrosEmPt} onChange={(e) => setOutrosEmPt(e.target.checked)} className="h-5 w-5 accent-primary" />
              Enviar em português para quem usa os outros idiomas
            </label>
            <Button type="button" variant="secondary" className="h-12 w-full gap-2 text-base" disabled={!validacaoOrigem.ok || !paraTraduzir.length || traduzindo} onClick={() => void traduzir(paraTraduzir)}>
              {traduzindo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Languages className="h-5 w-5" />}
              {traduzindo ? "Traduzindo…" : paraTraduzir.length ? `Traduzir de novo (${paraTraduzir.length} idioma(s))` : "Marque um idioma além do pt-BR para traduzir"}
            </Button>
            {erroTraducao && (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{erroTraducao} Escreva as versões à mão nos campos abaixo, ou tente de novo.</p>
            )}
            {desatualizada && (
              <div role="alert" className="space-y-2 rounded-lg border border-amber-500/60 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <p>Você mudou o texto em português depois de traduzir. Traduza de novo ou confirme que as versões abaixo continuam certas.</p>
                <Button type="button" variant="outline" className="h-12 text-base" onClick={() => setTraduzidoDe(chaveOrigem(origem))}>As versões continuam certas</Button>
              </div>
            )}
          </fieldset>

          {paraTraduzir.length > 0 && (
            <div className="space-y-4" data-testid="push-versoes">
              {paraTraduzir.map((l) => {
                const v = versoes[l];
                return (
                  <div key={l} className="space-y-2 rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">{NOME_IDIOMA[l] ?? l} <span className="font-normal text-muted-foreground">({l})</span></p>
                    {!v ? (
                      <p className="text-sm text-muted-foreground">{traduzindo ? "Traduzindo…" : "A tradução aparece aqui sozinha assim que você escrever o título e a mensagem."}</p>
                    ) : (
                      <>
                        <Input aria-label={`Título em ${NOME_IDIOMA[l] ?? l}`} className="h-12 text-base" value={v.titulo} disabled={traduzindo} maxLength={LIMITES.titulo} onChange={(e) => editarVersao(l, "titulo", e.target.value)} placeholder="Título" />
                        <Textarea aria-label={`Mensagem em ${NOME_IDIOMA[l] ?? l}`} className="text-base" rows={3} value={v.texto} disabled={traduzindo} maxLength={LIMITES.texto} onChange={(e) => editarVersao(l, "texto", e.target.value)} placeholder="Mensagem" />
                        <p className="text-sm text-muted-foreground">{v.titulo.trim().length}/{LIMITES.titulo} · {v.texto.trim().length}/{LIMITES.texto}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Público</legend>
            {([
              ["email", "Só um e-mail (teste)"],
              ["todos", "Todos com acesso"],
              ["plano", "Por plano"],
            ] as const).map(([v, r]) => (
              <label key={v} className="flex min-h-12 items-center gap-3 text-sm">
                <input type="radio" name="push-publico" value={v} checked={tipo === v} onChange={() => setTipo(v)} className="h-5 w-5 accent-primary" />{r}
              </label>
            ))}
            {tipo === "email" && (
              <>
                <Input type="email" aria-label="E-mail de teste" className="h-12 text-base" value={emailTeste} onChange={(e) => setEmailTeste(e.target.value)} placeholder="email@exemplo.com" />
                <Label htmlFor="push-teste-idioma">Versão do teste</Label>
                <select id="push-teste-idioma" className="h-12 w-full rounded-md border border-input bg-background px-3 text-base" value={testeIdioma} onChange={(e) => { setTesteIdioma(e.target.value); setPrevia(e.target.value); }}>
                  {[IDIOMA_ORIGEM, ...paraTraduzir].map((l) => <option key={l} value={l}>{NOME_IDIOMA[l] ?? l}</option>)}
                </select>
              </>
            )}
            {tipo === "plano" && (
              <select aria-label="Plano" className="h-12 w-full rounded-md border border-input bg-background px-3 text-base" value={plano} onChange={(e) => setPlano(e.target.value as GrupoPlano)}>
                {(Object.keys(PLANOS_PUSH) as GrupoPlano[]).map((k) => <option key={k} value={k}>{PLANOS_PUSH[k]}</option>)}
              </select>
            )}
          </fieldset>

          <div className="rounded-lg bg-muted p-3 text-sm" aria-live="polite" data-testid="push-contagem">
            {contando ? "Contando…" : contagens && total ? (
              <>
                <p>Vai para <strong>{total.pessoas} pessoa(s)</strong> ({total.aparelhos} aparelho(s)){tipo !== "email" && itens.length > 1 ? ` em ${lote.length} idioma(s)` : ""}.</p>
                {tipo !== "email" && (
                  <ul className="mt-1 space-y-0.5">
                    {itens.map((i) => <li key={i.id}>{i.rotulo}: {jaFoi.includes(i.id) ? "já enviado" : `${contagens[i.id]?.pessoas ?? 0} pessoa(s)`}</li>)}
                  </ul>
                )}
              </>
            ) : itens.length ? "Escolha o público para ver quantas pessoas recebem." : "Marque pelo menos um idioma de saída."}
          </div>
          {erroOrigem && (titulo || texto || linkSel === "outro") && <p className="text-sm text-destructive">{ERROS[erroOrigem]}</p>}
          {!erroOrigem && errosDoLote.length > 0 && (
            <ul className="space-y-1 text-sm text-destructive" data-testid="push-erros-lote">
              {errosDoLote.map(({ item, erro }) => <li key={item.id}>{item.rotulo}: {ERROS[erro!] ?? erro}</li>)}
            </ul>
          )}

          <Button className="h-12 w-full gap-2 text-base" disabled={!podeEnviar || enviando} onClick={() => setConfirmar(true)}>
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {tipo === "email" ? "Enviar teste" : "Enviar"}
          </Button>
        </section>

        {/* Prévia */}
        <section className="space-y-4" aria-label="Prévia da notificação">
          <h3 className="font-display text-lg font-bold text-primary">Prévia</h3>
          {opcoesPrevia.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Idioma da prévia">
              {opcoesPrevia.map((id) => (
                <button key={id} type="button" aria-pressed={itemPrevia?.id === id} onClick={() => setPrevia(id)}
                  className={`min-h-12 rounded-full border px-4 text-sm ${itemPrevia?.id === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                  {id === OUTROS ? "Outros" : id}
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{itemPrevia ? itemPrevia.rotulo : "—"}</p>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">iPhone</p>
            <div className="rounded-[1.25rem] bg-zinc-200/90 p-3 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50">
              <div className="flex gap-3">
                <img src="/pwa-icon-192.png" alt="" className="h-10 w-10 rounded-[0.6rem]" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold">{itemPrevia?.titulo.trim() || "Título"}</p><span className="shrink-0 text-sm opacity-60">agora</span></div>
                  {/* O iPhone sempre põe "from <nome do app>" em notificação de app da web; não dá para tirar. */}
                  <p className="truncate text-sm font-semibold">from Ferramentas do Cristão</p>
                  <p className="line-clamp-4 text-sm">{itemPrevia?.texto.trim() || "Mensagem"}</p>
                </div>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">O iPhone mostra "from Ferramentas do Cristão" sozinho: não precisa pôr o nome do app no título.</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Android</p>
            <div className="rounded-xl bg-white p-3 text-zinc-900 shadow ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-50">
              <p className="mb-1 flex items-center gap-2 text-sm opacity-70"><BellRing className="h-3.5 w-3.5" />Ferramentas do Cristão · app.ferramentasdocristao.com</p>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{itemPrevia?.titulo.trim() || "Título"}</p>
                  <p className="line-clamp-3 text-sm opacity-80">{itemPrevia?.texto.trim() || "Mensagem"}</p>
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
            <AlertDialogTitle>Tem certeza? Vai para {total?.pessoas ?? 0} pessoa(s).</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <ul className="max-h-[40vh] space-y-1 overflow-y-auto text-left">
                  {lote.map((i) => <li key={i.id}><strong>{i.rotulo}</strong>: {contagens?.[i.id]?.pessoas ?? 0} pessoa(s) · “{i.titulo.trim()}”</li>)}
                </ul>
                <p>{rotuloBase}. São {total?.aparelhos ?? 0} aparelho(s){lote.length > 1 ? `, em ${lote.length} envios (um por idioma)` : ""}. Notificação enviada não tem volta: não dá para apagar do celular das pessoas.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={enviando} onClick={(e) => { e.preventDefault(); void enviar(); }}>
              {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Sim, enviar para {total?.pessoas ?? 0}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotificationsSection;
