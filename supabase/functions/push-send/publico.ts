/**
 * Regras puras da Central de mensagens (sem Deno, sem rede): público, validação da mensagem e rótulos.
 * Testadas em src/test/push-send.test.ts. 21/11/2026 · Noé.
 */

export const IDIOMAS_PUSH = ["pt-BR", "pt-PT", "en", "es", "fr", "it", "de"] as const;

/** Grupos de plano que o admin escolhe. "vencidos" é o único que inclui acesso vencido (campanha de volta). */
export const PLANOS_PUSH = {
  br: "Plano Brasil (br_*)",
  intl: "Internacional (intl_*)",
  idiomas: "Com idiomas adicionais",
  sem_plano: "Lista antiga (sem plano)",
  vencidos: "Acesso vencido",
} as const;
export type GrupoPlano = keyof typeof PLANOS_PUSH;

export type Publico =
  | { tipo: "todos"; idiomas?: string[] }
  | { tipo: "plano"; plano: GrupoPlano; idiomas?: string[] }
  | { tipo: "email"; email: string };

export type Inscricao = { email: string; token: string; lang: string | null };
export type Acesso = { plan: string | null; bloqueado: boolean; expires_at: string | null; idiomas_liberados: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lê o público vindo do navegador; qualquer coisa fora do formato vira null (a função responde 400). */
export function lerPublico(v: unknown): Publico | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const idiomas = Array.isArray(o.idiomas)
    ? [...new Set(o.idiomas.filter((x): x is string => typeof x === "string" && (IDIOMAS_PUSH as readonly string[]).includes(x)))]
    : [];
  const comIdiomas = idiomas.length ? { idiomas } : {};
  if (o.tipo === "todos") return { tipo: "todos", ...comIdiomas };
  if (o.tipo === "plano" && typeof o.plano === "string" && o.plano in PLANOS_PUSH) return { tipo: "plano", plano: o.plano as GrupoPlano, ...comIdiomas };
  if (o.tipo === "email" && typeof o.email === "string") {
    const email = o.email.trim().toLowerCase();
    return EMAIL.test(email) ? { tipo: "email", email } : null;
  }
  return null;
}

export function rotuloPublico(p: Publico): string {
  if (p.tipo === "email") return `Só um e-mail (teste): ${p.email}`;
  const base = p.tipo === "todos" ? "Todos com acesso" : PLANOS_PUSH[p.plano];
  return p.idiomas?.length ? `${base} · idioma ${p.idiomas.join(", ")}` : base;
}

function vencido(a: Acesso, agora: number) {
  return a.expires_at != null && new Date(a.expires_at).getTime() < agora;
}

function entraNoPlano(a: Acesso | undefined, grupo: GrupoPlano | null, agora: number): boolean {
  if (!a || a.bloqueado) return false;
  if (grupo === "vencidos") return vencido(a, agora);
  if (vencido(a, agora)) return false;
  const plano = (a.plan ?? "").toLowerCase();
  switch (grupo) {
    case null: return true;
    case "br": return plano.startsWith("br_");
    case "intl": return plano.startsWith("intl_");
    case "idiomas": return a.idiomas_liberados || plano.startsWith("intl_");
    case "sem_plano": return plano === "" || plano === "manual";
  }
}

/** Quem recebe: tokens + contagem de pessoas (e-mails) e aparelhos. Bloqueado nunca recebe. */
export function filtrarPublico(inscricoes: Inscricao[], acessos: Map<string, Acesso>, p: Publico, agora = Date.now()) {
  const escolhidas = inscricoes.filter((i) => {
    const email = i.email.toLowerCase();
    if (p.tipo === "email") return email === p.email && !acessos.get(email)?.bloqueado;
    if (p.idiomas?.length && !p.idiomas.includes(i.lang ?? "")) return false;
    return entraNoPlano(acessos.get(email), p.tipo === "plano" ? p.plano : null, agora);
  });
  return {
    tokens: escolhidas.map((i) => i.token),
    pessoas: new Set(escolhidas.map((i) => i.email.toLowerCase())).size,
    aparelhos: escolhidas.length,
  };
}

export type Mensagem = { titulo: string; texto: string; link: string };
export const LIMITES = { titulo: 60, texto: 180, link: 300 } as const;

/** Confere título, texto e link. O link precisa ser um caminho do próprio app ("/biblia", "/jornada/genesis"). */
export function validarMensagem(v: { titulo?: unknown; texto?: unknown; link?: unknown }): { ok: true; msg: Mensagem } | { ok: false; erro: string } {
  const titulo = typeof v.titulo === "string" ? v.titulo.trim() : "";
  const texto = typeof v.texto === "string" ? v.texto.trim() : "";
  const link = typeof v.link === "string" ? v.link.trim() : "";
  if (!titulo) return { ok: false, erro: "titulo_vazio" };
  if (titulo.length > LIMITES.titulo) return { ok: false, erro: "titulo_longo" };
  if (!texto) return { ok: false, erro: "texto_vazio" };
  if (texto.length > LIMITES.texto) return { ok: false, erro: "texto_longo" };
  if (link && (!link.startsWith("/") || link.startsWith("//") || /[\s\\]/.test(link) || link.length > LIMITES.link)) return { ok: false, erro: "link_fora_do_app" };
  return { ok: true, msg: { titulo, texto, link: link || "/" } };
}
