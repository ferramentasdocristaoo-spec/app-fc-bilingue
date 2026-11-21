/**
 * Firebase Cloud Messaging (FCM HTTP v1) só com WebCrypto: roda no Deno (Supabase Edge) e no Node (testes).
 * Mesmo desenho da Fome Livre (Area-Membros-push/app/worker/fcm.ts, 13/11/2026), adaptado em 21/11/2026 (Noé).
 *
 * Segredo: FCM_SERVICE_ACCOUNT = JSON da conta de serviço do projeto Firebase do FC (base64 ou JSON puro).
 * Só como secret da função (`supabase secrets set`), nunca em arquivo nem em log.
 *
 * Fluxo: JWT RS256 assinado com a chave da conta de serviço → POST oauth2.googleapis.com/token → access_token
 * (1 h, em memória) → POST fcm.googleapis.com/v1/projects/<projeto>/messages:send, um por aparelho.
 */

export type ContaServico = { project_id: string; client_email: string; private_key: string };
export type ResultadoFcm = { status: number; tipo: "ok" | "invalido" | "falha"; erro?: string };
/** Conteúdo da notificação. Vai como "data" (só textos): quem desenha a notificação é o public/push-sw.js. */
export type ConteudoPush = { titulo: string; texto: string; link: string; envio: number; tag: string; ping?: string };

const enc = new TextEncoder();
const b64url = (u: Uint8Array | ArrayBuffer) => {
  const b = u instanceof Uint8Array ? u : new Uint8Array(u);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Lê a conta de serviço do segredo (base64 ou JSON). Devolve null se faltar algo (sem dizer o valor). */
export function lerContaServico(v: string | undefined | null): ContaServico | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  let o: Record<string, unknown> | null = null;
  try { o = JSON.parse(s.startsWith("{") ? s : atob(s.replace(/\s+/g, ""))); } catch { return null; }
  if (!o || typeof o.project_id !== "string" || typeof o.client_email !== "string" || typeof o.private_key !== "string") return null;
  if (!o.private_key.includes("PRIVATE KEY")) return null;
  return { project_id: o.project_id, client_email: o.client_email, private_key: o.private_key };
}

function pemParaDer(pem: string): ArrayBuffer {
  const corpo = pem.replace(/-----(BEGIN|END) [A-Z ]+-----/g, "").replace(/\\n/g, "").replace(/\s+/g, "");
  const bin = atob(corpo);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}

/** JWT assinado (RS256) que o Google troca por um access_token com escopo do FCM. */
export async function assinarJwt(conta: ContaServico, agoraSeg = Math.floor(Date.now() / 1000)): Promise<string> {
  const cab = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const corpo = b64url(enc.encode(JSON.stringify({
    iss: conta.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: agoraSeg, exp: agoraSeg + 3600,
  })));
  const chave = await crypto.subtle.importKey("pkcs8", pemParaDer(conta.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const ass = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", chave, enc.encode(`${cab}.${corpo}`));
  return `${cab}.${corpo}.${b64url(ass)}`;
}

/** URLs do Google. Nos testes locais (FCM_TESTE) vão para um servidor falso. */
export function urlsFcm(conta: ContaServico, teste?: string) {
  const base = teste?.replace(/\/$/, "");
  return {
    token: base ? `${base}/token` : "https://oauth2.googleapis.com/token",
    enviar: base ? `${base}/v1/projects/${conta.project_id}/messages:send` : `https://fcm.googleapis.com/v1/projects/${conta.project_id}/messages:send`,
  };
}

let cacheToken: { email: string; token: string; expira: number } | null = null;
let pedindo: Promise<string> | null = null;
export function limparCacheToken() { cacheToken = null; }

/** access_token do OAuth: um pedido só, mesmo com o lote inteiro chamando ao mesmo tempo. */
export async function tokenAcesso(conta: ContaServico, teste?: string, f: typeof fetch = fetch): Promise<string> {
  if (cacheToken && cacheToken.email === conta.client_email && cacheToken.expira > Date.now() + 60_000) return cacheToken.token;
  if (!pedindo) pedindo = pedirToken(conta, teste, f).finally(() => { pedindo = null; });
  return pedindo;
}

async function pedirToken(conta: ContaServico, teste: string | undefined, f: typeof fetch): Promise<string> {
  const agora = Date.now();
  const jwt = await assinarJwt(conta, Math.floor(agora / 1000));
  const r = await f(urlsFcm(conta, teste).token, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }).toString(),
  });
  const j = (await r.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
  if (!r.ok || !j?.access_token) throw new Error(`fcm_oauth_${r.status}${j?.error ? "_" + j.error : ""}`);
  cacheToken = { email: conta.client_email, token: j.access_token, expira: agora + (Number(j.expires_in) || 3600) * 1000 };
  return j.access_token;
}

/** Corpo da mensagem FCM v1: só "data" (o push-sw.js mostra a notificação) + cabeçalhos Web Push. */
export function mensagemFcm(token: string, c: ConteudoPush, urlBase: string) {
  const data: Record<string, string> = { titulo: c.titulo, texto: c.texto, link: c.link, envio: String(c.envio), tag: c.tag };
  if (c.ping) data.ping = c.ping;
  return {
    message: {
      token,
      data,
      webpush: {
        headers: { Urgency: "high", TTL: String(3 * 24 * 3600), Topic: c.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) },
        fcm_options: { link: new URL(c.link || "/", urlBase).href },
      },
    },
  };
}

/** Classifica a resposta do FCM: token morto sai do banco; o resto conta como falha. */
// deno-lint-ignore no-explicit-any
export function classificarFcm(status: number, corpo: any): ResultadoFcm {
  if (status >= 200 && status < 300) return { status, tipo: "ok" };
  const err = corpo?.error ?? {};
  const codigos: string[] = [String(err.status ?? "")];
  for (const d of Array.isArray(err.details) ? err.details : []) if (d?.errorCode) codigos.push(String(d.errorCode));
  const msg = String(err.message ?? "");
  const morto = status === 404 || codigos.includes("UNREGISTERED") || codigos.includes("SENDER_ID_MISMATCH")
    || (status === 400 && codigos.includes("INVALID_ARGUMENT") && /registration token|not a valid FCM/i.test(msg));
  return { status, tipo: morto ? "invalido" : "falha", erro: codigos.filter(Boolean).pop() || `http_${status}` };
}

export async function enviarFcm(conta: ContaServico, token: string, c: ConteudoPush, urlBase: string, teste?: string, f: typeof fetch = fetch): Promise<ResultadoFcm> {
  // Falha ao renovar o OAuth no meio do lote vira "falha" deste aparelho, sem derrubar o lote (o que já saiu conta).
  let acesso: string;
  try { acesso = await tokenAcesso(conta, teste, f); } catch { return { status: 0, tipo: "falha", erro: "oauth" }; }
  try {
    const r = await f(urlsFcm(conta, teste).enviar, {
      method: "POST", headers: { authorization: `Bearer ${acesso}`, "content-type": "application/json" },
      body: JSON.stringify(mensagemFcm(token, c, urlBase)),
    });
    const corpo = await r.json().catch(() => null);
    if (r.status === 401) limparCacheToken();
    return classificarFcm(r.status, corpo);
  } catch {
    return { status: 0, tipo: "falha", erro: "rede" };
  }
}

/** Roda `tarefa` em todos os itens com no máximo `n` ao mesmo tempo. */
export async function emLotes<T, R>(itens: T[], n: number, tarefa: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(itens.length);
  let i = 0;
  const trabalhador = async () => { while (i < itens.length) { const k = i++; out[k] = await tarefa(itens[k]); } };
  await Promise.all(Array.from({ length: Math.min(n, itens.length) }, trabalhador));
  return out;
}
