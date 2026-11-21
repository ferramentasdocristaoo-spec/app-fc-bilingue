// Notificações do app FC (21/11/2026, Noé), no modelo da Fome Livre: Firebase Cloud Messaging.
// O SDK do Firebase só é baixado quando a pessoa ativa (import dinâmico). O service worker é o do PWA
// (vite-plugin-pwa), que importa /push-sw.js (quem desenha a notificação). O Firebase só gera o token do
// aparelho; o token vai para o banco pela RPC push_inscrever.
import { supabase } from "@/integrations/supabase/client";
import { FIREBASE_FC, FIREBASE_VAPID_PUBLICA, firebaseConfigurado } from "@/lib/firebase-config";

export type EstadoPush =
  | "ativo"            // permissão dada e token no servidor
  | "pode-ativar"      // ainda não perguntamos (ou a pessoa desligou)
  | "negado"           // a pessoa bloqueou (precisa liberar nos ajustes)
  | "ios-instalar"     // iPhone/iPad fora da Tela de Início: instalar primeiro
  | "ios-velho"        // iOS < 16.4
  | "sem-suporte";     // navegador sem push (ex.: dentro do Instagram)

export type Plataforma = { so: "ios" | "android" | "outro"; versaoIos: number | null; inApp: boolean };

const K_TOKEN = "fc-push-token", K_LIGADO = "fc-push-ligado", K_SYNC = "fc-push-sync";
const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string | null) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* privado */ } },
};

const ouvintes = new Set<() => void>();
export const ouvirPush = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };
const avisar = () => ouvintes.forEach((f) => f());

export function plataformaAtual(ua = typeof navigator === "undefined" ? "" : navigator.userAgent, toque = typeof navigator !== "undefined" && navigator.maxTouchPoints > 1): Plataforma {
  const ipadNovo = /Macintosh/.test(ua) && toque; // iPadOS 13+ se diz Mac
  const ios = /iPhone|iPad|iPod/.test(ua) || ipadNovo;
  const m = ua.match(/OS (\d+)[_.](\d+)/);
  const versaoIos = ios ? (m ? Number(m[1]) + Number(m[2]) / 100 : ipadNovo ? 17 : null) : null;
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Line\/|GSA\//.test(ua);
  return { so: ios ? "ios" : /Android/.test(ua) ? "android" : "outro", versaoIos, inApp };
}

export function estaInstalado(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function estadoPush(p = plataformaAtual()): EstadoPush {
  if (p.so === "ios" && p.versaoIos != null && p.versaoIos < 16.04) return "ios-velho";
  if (p.so === "ios" && !estaInstalado()) return "ios-instalar";
  if (p.inApp || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "sem-suporte";
  if (Notification.permission === "denied") return "negado";
  if (Notification.permission === "granted" && ls.get(K_LIGADO) === "1" && ls.get(K_TOKEN)) return "ativo";
  return "pode-ativar";
}

async function registroSw(): Promise<ServiceWorkerRegistration> {
  // O PWA registra o /sw.js sozinho (registerType autoUpdate). Aqui só esperamos ele ficar pronto.
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("sw_demorou")), 15000)),
  ]);
}

async function firebase() {
  const [{ initializeApp, getApps }, m] = await Promise.all([import("firebase/app"), import("firebase/messaging")]);
  return { app: getApps()[0] ?? initializeApp(FIREBASE_FC), m };
}

async function tokenDoFirebase(): Promise<string> {
  if (!firebaseConfigurado()) throw new Error("firebase_nao_configurado");
  const [{ app, m }, reg] = await Promise.all([firebase(), registroSw()]);
  if (!(await m.isSupported())) throw new Error("sem_suporte");
  return m.getToken(m.getMessaging(app), { serviceWorkerRegistration: reg, vapidKey: FIREBASE_VAPID_PUBLICA });
}

async function enviarToken(token: string, email: string, lang: string) {
  const antigo = ls.get(K_TOKEN);
  const { data, error } = await supabase.rpc("push_inscrever" as never, {
    _email: email, _token: token, _antigo: antigo && antigo !== token ? antigo : null, _lang: lang, _plataforma: plataformaAtual().so,
  } as never);
  if (error || data !== "ok") throw new Error(String(error?.message ?? data ?? "inscrever"));
  ls.set(K_TOKEN, token);
  ls.set(K_LIGADO, "1");
  ls.set(K_SYNC, String(Date.now()));
}

/** Pede a permissão e liga. TEM de ser chamada direto no toque do botão (o iPhone exige o gesto). */
export async function ativarPush(email: string, lang: string): Promise<EstadoPush | "erro"> {
  const est = estadoPush();
  if (est === "ios-instalar" || est === "ios-velho" || est === "sem-suporte") return est;
  // 1º a permissão, antes de qualquer outro await: no Safari o gesto do toque precisa estar "vivo".
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") { avisar(); return perm === "denied" ? "negado" : "pode-ativar"; }
  try {
    await enviarToken(await tokenDoFirebase(), email, lang);
    avisar();
    return "ativo";
  } catch (e) {
    console.warn("[push] não ativou:", (e as Error).message);
    avisar();
    return "erro";
  }
}

export async function desativarPush() {
  const token = ls.get(K_TOKEN);
  ls.set(K_LIGADO, null);
  try {
    if (token) await supabase.rpc("push_desligar" as never, { _token: token } as never);
    if (firebaseConfigurado()) {
      const { app, m } = await firebase();
      await m.deleteToken(m.getMessaging(app)).catch(() => {});
    }
  } catch { /* fica desligado no aparelho mesmo assim */ }
  ls.set(K_TOKEN, null);
  avisar();
}

/** Ao abrir o app: se a pessoa já ativou, confere o token (o Firebase pode trocar) e atualiza o banco 1x por dia. */
export async function sincronizarPush(email: string, lang: string) {
  if (!firebaseConfigurado() || estadoPush() !== "ativo") return;
  const ultimo = Number(ls.get(K_SYNC)) || 0;
  try {
    const token = await tokenDoFirebase();
    if (token !== ls.get(K_TOKEN) || Date.now() - ultimo > 24 * 3600 * 1000) await enviarToken(token, email, lang);
  } catch { /* tenta na próxima abertura */ }
}

/** Ao sair da conta: o aparelho para de receber as mensagens desse e-mail. */
export async function esquecerPushAoSair() {
  if (ls.get(K_TOKEN)) await desativarPush();
}

// ── Convite: "Agora não" esconde por 3 aberturas, no máximo 6 vezes ───────────────────────────────────
const K_ADIADO = "fc-push-convite-adiado", K_VEZES = "fc-push-convite-vezes";
export function conviteVisivel(): boolean {
  const vezes = Number(ls.get(K_VEZES)) || 0;
  if (vezes >= 6) return false;
  const adiado = Number(ls.get(K_ADIADO)) || 0;
  return adiado <= 0;
}
export function adiarConvite() {
  ls.set(K_VEZES, String((Number(ls.get(K_VEZES)) || 0) + 1));
  ls.set(K_ADIADO, "3");
  avisar();
}
/** Chamado uma vez por abertura do app: conta para trás o "Agora não". */
export function contarAbertura() {
  const adiado = Number(ls.get(K_ADIADO)) || 0;
  if (adiado > 0) ls.set(K_ADIADO, String(adiado - 1));
}
