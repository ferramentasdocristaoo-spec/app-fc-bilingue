import { useSyncExternalStore } from 'react';
import type { AppLanguage } from './geo-language';

export interface AppLanguageOption {
  code: AppLanguage;
  /** Sigla curta mostrada ao lado da bandeira (PT, EN…). */
  short: string;
  /** Emoji: só para listas de texto (menu lateral antigo). No topo entram as bandeiras em SVG (`components/flags/Flag.tsx`), porque o Windows não mostra emoji de bandeira. */
  flag: string;
  /** Nome do idioma, escrito no próprio idioma. */
  name: string;
}

/** Idiomas do app, na ordem do seletor; o topo (bandeiras), o Dock e os Ajustes usam a mesma lista. */
export const APP_LANGUAGES: readonly AppLanguageOption[] = [
  { code: 'pt-BR', short: 'BR', flag: '🇧🇷', name: 'Português (Brasil)' },
  { code: 'pt-PT', short: 'PT', flag: '🇵🇹', name: 'Português (Portugal)' },
  { code: 'en', short: 'EN', flag: '🇺🇸', name: 'English' },
  { code: 'es', short: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', short: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'it', short: 'IT', flag: '🇮🇹', name: 'Italiano' },
  { code: 'de', short: 'DE', flag: '🇩🇪', name: 'Deutsch' },
];

const TODOS: readonly AppLanguage[] = APP_LANGUAGES.map((lang) => lang.code);

/** Idioma da lista que corresponde ao idioma atual do i18n ("pt" sem região → "pt-PT"; "pt-BR" → "pt-BR"; desconhecido → pt-PT). */
export function matchAppLanguage(current: string): AppLanguage {
  const exact = APP_LANGUAGES.find((lang) => lang.code === current);
  if (exact) return exact.code;
  const base = current.split('-')[0];
  // "pt" sem região continua Portugal, mesmo com o Brasil em primeiro na lista (pedido do dono, 14/11).
  if (base === 'pt') return 'pt-PT';
  return APP_LANGUAGES.find((lang) => lang.code.split('-')[0] === base)?.code ?? 'pt-PT';
}

/* ------------------------------------------------------------------------------------------
   TRAVA DE IDIOMAS POR PLANO — ponto único (decisão do dono, 13/11/2026; implementada 14/11).
   Um app só: o assinante brasileiro (plano `br_*`) tem só o pt-BR no plano base; os outros
   idiomas são um adicional pago (order bump → approved_emails.idiomas_liberados). Fora do
   Brasil (plano `intl_*`) todos os idiomas entram. O plano vem da RPC app_access_info no login
   (use-auth.tsx) e fica guardado no aparelho para o app abrir sem rede.
   ------------------------------------------------------------------------------------------ */

export interface PlanoAcesso {
  /** plan_name do sku_plans (br_mensal, br_12m, intl_mensal…); null = sem plano registrado. */
  plan: string | null;
  /** Adicional de idiomas comprado (ou plano que já inclui os 7). */
  idiomasLiberados: boolean;
}

export const PLANO_KEY = 'fc-sermon-plano';

function lerPlanoSalvo(): PlanoAcesso | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PLANO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlanoAcesso>;
    return { plan: typeof parsed.plan === 'string' ? parsed.plan : null, idiomasLiberados: parsed.idiomasLiberados === true };
  } catch {
    return null;
  }
}

let planoAtual: PlanoAcesso | null = lerPlanoSalvo();
const ouvintes = new Set<() => void>();

/** Guarda o plano do usuário logado (chamado pelo login) e avisa quem mostra as bandeiras. */
export function setPlanoAtual(plano: PlanoAcesso | null) {
  planoAtual = plano;
  try {
    if (plano) localStorage.setItem(PLANO_KEY, JSON.stringify(plano));
    else localStorage.removeItem(PLANO_KEY);
  } catch { /* armazenamento cheio ou indisponível: segue só em memória */ }
  ouvintes.forEach((fn) => fn());
}

export function getPlanoAtual(): PlanoAcesso | null {
  return planoAtual;
}

function subscribePlano(fn: () => void) {
  ouvintes.add(fn);
  return () => { ouvintes.delete(fn); };
}

/** Plano atual reativo: a lista de bandeiras re-renderiza quando o login grava o plano. */
export function usePlanoAtual(): PlanoAcesso | null {
  return useSyncExternalStore(subscribePlano, getPlanoAtual, getPlanoAtual);
}

/**
 * Quais idiomas o usuário pode usar.
 * - Sem plano conhecido (null, "manual", lista antiga de e-mails): todos os 7 — comportamento
 *   anterior, para não travar quem já tinha acesso antes dos planos (anotado no PENDENTE).
 * - `br_*` sem adicional: só pt-BR.
 * - Adicional de idiomas ou `intl_*`: todos os 7.
 */
export function idiomasLiberados(plano: PlanoAcesso | null = planoAtual): readonly AppLanguage[] {
  if (!plano || !plano.plan) return TODOS;
  if (plano.idiomasLiberados) return TODOS;
  if (plano.plan.startsWith('br_')) return ['pt-BR'];
  return TODOS;
}

/** O idioma pedido está no plano? */
export function idiomaLiberado(code: AppLanguage, plano: PlanoAcesso | null = planoAtual): boolean {
  return idiomasLiberados(plano).includes(code);
}
