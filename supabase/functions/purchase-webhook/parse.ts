// Leitura do payload de compra — lógica pura, sem Deno nem Supabase, para ser testada no vitest
// (src/test/purchase-webhook-parse.test.ts) e usada pelo index.ts.
//
// Formato da KawaiPay (dispatch-webhooks): { events: [{ event_key, event_name, data: { customer_email,
// product_id, product_sku, status, … } }], order_bumps: [{ product_id, product_sku, … }], upsells: [...] }.
// Formatos antigos (Hotmart, Kiwify, Eduzz, campo direto) continuam aceitos como "liberar".

export type Acao = "liberar" | "bloquear" | "ignorar";

export interface ItemCompra {
  /** Identificadores possíveis do produto: o sku_plans.sku pode ser o SKU ou o id da KawaiPay. */
  candidatos: string[];
  origem: "principal" | "bump" | "upsell";
}

export interface CompraLida {
  acao: Acao;
  /** event_key normalizado (compra_aprovada, reembolso…); "" quando o payload não tem evento. */
  evento: string;
  email: string | null;
  itens: ItemCompra[];
}

/** Eventos que liberam acesso. Renovação da assinatura chega como evento próprio (não repete compra_aprovada). */
const LIBERAM = new Set(["compra_aprovada", "assinatura_renovada"]);
/** Eventos que tiram o acesso. */
const BLOQUEIAM = new Set(["reembolso", "chargeback", "estorno"]);
/** Status de pedido que valem como aprovado quando o evento não vem nomeado. */
const STATUS_APROVADO = new Set(["paid", "approved", "aprovado", "pago", "completed"]);
const STATUS_REEMBOLSO = new Set(["refunded", "reembolsado", "chargeback", "charged_back"]);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => v !== null && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());

/** Chave do evento: event_key da KawaiPay ou, na falta, o event_name ("Compra aprovada" → compra_aprovada). */
export function normalizarEvento(ev: Obj): string {
  const key = str(ev.event_key);
  if (key) return key.toLowerCase();
  const nome = str(ev.event_name).toLowerCase();
  if (!nome) return "";
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** KawaiPay (tem events[]): só o evento decide; status é reserva quando o evento vem vazio. */
function acaoDoEvento(evento: string, status: string): Acao {
  if (LIBERAM.has(evento)) return "liberar";
  if (BLOQUEIAM.has(evento) || evento.includes("reembols") || evento.includes("chargeback")) return "bloquear";
  if (evento) return "ignorar"; // compra_recusada, pix_gerado, carrinho_abandonado, assinatura_cancelada…
  const s = status.toLowerCase();
  if (STATUS_APROVADO.has(s)) return "liberar";
  if (STATUS_REEMBOLSO.has(s)) return "bloquear";
  return "ignorar";
}

/** Formatos antigos (sem events[]): essas plataformas só chamavam na aprovação; sem status, libera como antes. */
function acaoLegada(status: string): Acao {
  const s = status.toLowerCase();
  if (!s || STATUS_APROVADO.has(s)) return "liberar";
  if (STATUS_REEMBOLSO.has(s)) return "bloquear";
  return "ignorar";
}

function candidatosDoItem(data: Obj): string[] {
  const vistos = new Set<string>();
  const add = (v: unknown) => { const s = str(v); if (s) vistos.add(s); };
  add(data.product_sku);
  add(data.sku);
  add(data.product_id);
  add(data.product_code);
  add(data.offer_code);
  if (isObj(data.product)) { add(data.product.sku); add(data.product.id); }
  if (isObj(data.purchase)) {
    const p = data.purchase;
    if (isObj(p.offer)) add(p.offer.code);
    if (isObj(p.product)) add(p.product.id);
  }
  if (isObj(data.Product)) add(data.Product.id);
  if (isObj(data.plan)) add(data.plan.id);
  add(data.key); // Eduzz / Monetizze
  return [...vistos];
}

function emailDe(data: Obj): string | null {
  const direto = str(data.customer_email) || str(data.email);
  if (direto) return direto.toLowerCase();
  if (isObj(data.buyer)) { const e = str(data.buyer.email); if (e) return e.toLowerCase(); }
  if (isObj(data.purchase) && isObj(data.purchase.buyer)) { const e = str(data.purchase.buyer.email); if (e) return e.toLowerCase(); }
  if (isObj(data.Customer)) { const e = str(data.Customer.email); if (e) return e.toLowerCase(); }
  if (isObj(data.customer)) { const e = str(data.customer.email); if (e) return e.toLowerCase(); }
  return null;
}

function itensExtras(body: Obj, chave: "order_bumps" | "upsells", origem: ItemCompra["origem"]): ItemCompra[] {
  const lista = body[chave];
  if (!Array.isArray(lista)) return [];
  return lista
    .filter(isObj)
    // Um bump reembolsado/pendente não libera nada.
    .filter((item) => { const s = str(item.status).toLowerCase(); return !s || STATUS_APROVADO.has(s); })
    .map((item) => ({ candidatos: candidatosDoItem(item), origem }))
    .filter((item) => item.candidatos.length > 0);
}

/** Lê o payload num formato único. Nunca lança: payload estranho vira acao "ignorar". */
export function lerCompra(raw: unknown): CompraLida {
  // A KawaiPay pode mandar o corpo embrulhado ({ body: {...} }) ou numa lista.
  let body: unknown = raw;
  if (Array.isArray(body)) body = body[0];
  if (isObj(body) && isObj(body.body) && (Array.isArray(body.body.events) || body.body.customer_email)) body = body.body;
  if (!isObj(body)) return { acao: "ignorar", evento: "", email: null, itens: [] };

  const events = Array.isArray(body.events) ? body.events.filter(isObj) : [];
  const ev = events[0] ?? null;
  // Formato KawaiPay com a lista de eventos vazia: nada a fazer.
  if (Array.isArray(body.events) && !ev) return { acao: "ignorar", evento: "", email: null, itens: [] };
  const data: Obj = ev ? (isObj(ev.data) ? ev.data : ev) : body;
  const evento = ev ? normalizarEvento(ev) : "";
  const status = str(data.status);
  const acao = ev ? acaoDoEvento(evento, status) : acaoLegada(status);

  // Formatos antigos sem data.* no topo: o produto vem em body.data (Hotmart).
  const fonteProduto: Obj = isObj(body.data) && !ev ? { ...body, ...(body.data as Obj) } : data;
  const email = emailDe(data) ?? (isObj(body.data) ? emailDe(body.data as Obj) : null) ?? emailDe(body);

  const itens: ItemCompra[] = [];
  const principal = candidatosDoItem(fonteProduto);
  if (principal.length) itens.push({ candidatos: principal, origem: "principal" });
  itens.push(...itensExtras(body, "order_bumps", "bump"));
  itens.push(...itensExtras(body, "upsells", "upsell"));

  return { acao, evento, email, itens };
}

export interface PlanoSku {
  sku: string;
  plan_name: string;
  months: number;
  unlocks_languages?: boolean | null;
}

export interface EstadoAcesso {
  plan: string | null;
  expires_at: string | null;
  idiomas_liberados: boolean;
}

/**
 * Validade nova: soma `months` a partir do maior entre agora e a validade atual
 * (renovação antes de vencer não perde dias; depois de vencer, conta de hoje).
 */
export function calcularValidade(atual: string | null | undefined, months: number, agora: Date = new Date()): string {
  const atualDate = atual ? new Date(atual) : null;
  const base = atualDate && !Number.isNaN(atualDate.getTime()) && atualDate > agora ? new Date(atualDate) : new Date(agora);
  const dia = base.getUTCDate();
  base.setUTCDate(1);
  base.setUTCMonth(base.getUTCMonth() + months);
  // Dia 31 num mês de 30: fica no último dia do mês, sem pular para o seguinte.
  const ultimo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(dia, ultimo));
  return base.toISOString();
}

/**
 * Aplica os planos encontrados ao estado atual do e-mail.
 * - Plano com months > 0: estende a validade e grava plan/sku.
 * - unlocks_languages: liga idiomas_liberados (adicional ou plano internacional) sem mexer na validade.
 * - Devolve null quando nenhum SKU conhecido apareceu (não liberar: pode ser um e-book da Livraria
 *   vendido na mesma loja da KawaiPay).
 */
export function aplicarPlanos(atual: EstadoAcesso | null, planos: PlanoSku[], agora: Date = new Date()): (EstadoAcesso & { sku: string | null }) | null {
  if (planos.length === 0) return null;
  const estado: EstadoAcesso & { sku: string | null } = {
    plan: atual?.plan ?? null,
    expires_at: atual?.expires_at ?? null,
    idiomas_liberados: atual?.idiomas_liberados ?? false,
    sku: null,
  };
  // Planos com validade primeiro, do maior para o menor, para a validade final não depender da ordem.
  const comValidade = planos.filter((p) => p.months > 0).sort((a, b) => b.months - a.months);
  for (const p of comValidade) {
    estado.expires_at = calcularValidade(estado.expires_at, p.months, agora);
    estado.plan = p.plan_name;
    estado.sku = p.sku;
  }
  if (planos.some((p) => p.unlocks_languages)) estado.idiomas_liberados = true;
  if (!estado.sku) estado.sku = planos[0].sku;
  return estado;
}
