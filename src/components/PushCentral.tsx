import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, BellRing, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { pushVisivel } from "@/lib/firebase-config";
import {
  adiarConvite, ativarPush, contarAbertura, conviteVisivel, desativarPush, estadoPush, ouvirPush, sincronizarPush, type EstadoPush,
} from "@/lib/push";

/* Notificações do app (21/11/2026), no modelo da Fome Livre:
   - convite "Ative as notificações" no topo das páginas ("Agora não" esconde por 3 aberturas, no máximo 6 vezes);
   - sininho no cabeçalho para ativar/desativar a qualquer hora;
   - iPhone fora da Tela de Início: explica que precisa instalar primeiro; bloqueado: como liberar.
   Tudo escondido enquanto o Firebase não estiver configurado (src/lib/firebase-config.ts). */

function useEstadoPush(): EstadoPush {
  const ler = useCallback(() => (typeof window === "undefined" ? "sem-suporte" : estadoPush()), []);
  return useSyncExternalStore(ouvirPush, ler, () => "sem-suporte" as EstadoPush);
}

function useLangAtual() {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage || i18n.language || "pt-PT";
}

/** Texto e ação para cada estado (usado no convite e na janela do sininho). */
function PainelPush({ estado, onFeito }: { estado: EstadoPush; onFeito?: () => void }) {
  const { t } = useTranslation();
  const { email } = useAuth();
  const lang = useLangAtual();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(false);

  const ativar = async () => {
    if (!email) return;
    setErro(false);
    setOcupado(true);
    const r = await ativarPush(email, lang);
    setOcupado(false);
    if (r === "erro") setErro(true);
    else if (r === "ativo") onFeito?.();
  };

  if (estado === "ativo") {
    return (
      <div className="space-y-3">
        <p className="text-[1.0625rem] leading-relaxed text-ink-2">{t("push.activeText")}</p>
        <Button variant="outline" className="h-12 w-full gap-2 text-base" onClick={() => void desativarPush()}>
          <BellOff className="h-5 w-5" aria-hidden="true" />{t("push.deactivate")}
        </Button>
      </div>
    );
  }
  const texto = {
    "pode-ativar": t("push.inviteText"),
    negado: t("push.deniedText"),
    "ios-instalar": t("push.iosInstallText"),
    "ios-velho": t("push.iosOld"),
    "sem-suporte": t("push.unsupported"),
  }[estado];
  return (
    <div className="space-y-3">
      <p className="text-[1.0625rem] leading-relaxed text-ink-2">{texto}</p>
      {estado === "pode-ativar" && (
        <Button className="h-12 w-full gap-2 text-base" onClick={() => void ativar()} disabled={ocupado || !email}>
          {ocupado ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <BellRing className="h-5 w-5" aria-hidden="true" />}
          {ocupado ? t("push.working") : t("push.activate")}
        </Button>
      )}
      {erro && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-[0.9375rem] text-destructive">{t("push.error")}</p>}
    </div>
  );
}

function tituloDo(estado: EstadoPush, t: (k: string) => string) {
  if (estado === "ativo") return t("push.activeTitle");
  if (estado === "negado") return t("push.deniedTitle");
  if (estado === "ios-instalar") return t("push.iosInstallTitle");
  if (estado === "pode-ativar") return t("push.inviteTitle");
  return t("push.offTitle");
}

/** Sininho do cabeçalho. */
export function PushBell() {
  const { t } = useTranslation();
  const estado = useEstadoPush();
  const [aberto, setAberto] = useState(false);
  if (!pushVisivel()) return null;
  const Icone = estado === "ativo" ? BellRing : estado === "negado" ? BellOff : Bell;
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setAberto(true)}
        className="relative h-12 w-12 text-ink-2 hover:bg-transparent hover:text-foreground"
        aria-label={`${t("push.bell")}: ${tituloDo(estado, t)}`}
        title={t("push.bell")}
        data-push-estado={estado}
      >
        <Icone className="h-5 w-5" aria-hidden="true" />
        {estado === "pode-ativar" && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-gold" aria-hidden="true" />}
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">{tituloDo(estado, t)}</DialogTitle>
            <DialogDescription className="sr-only">{t("push.bell")}</DialogDescription>
          </DialogHeader>
          <PainelPush estado={estado} onFeito={() => setAberto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Convite no topo das páginas. Aparece para quem ainda pode ativar (ou precisa instalar no iPhone). */
export function PushInvite() {
  const { t } = useTranslation();
  const estado = useEstadoPush();
  const [visivel, setVisivel] = useState(() => conviteVisivel());
  useEffect(() => ouvirPush(() => setVisivel(conviteVisivel())), []);
  if (!pushVisivel() || !visivel || (estado !== "pode-ativar" && estado !== "ios-instalar")) return null;
  return (
    <aside className="mx-auto mt-3 w-[min(100%-1.5rem,44rem)] rounded-2xl border border-gold/50 bg-card p-4 shadow-sm" aria-labelledby="push-convite-titulo">
      <div className="mb-2 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
          <BellRing className="h-5 w-5" />
        </span>
        <h2 id="push-convite-titulo" className="flex-1 pt-2 font-display text-[1.1875rem] font-semibold leading-tight text-foreground">
          {tituloDo(estado, t)}
        </h2>
        <button type="button" onClick={adiarConvite} className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-accent" aria-label={t("push.notNow")}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <PainelPush estado={estado} />
      <button type="button" onClick={adiarConvite} className="mt-2 h-12 w-full rounded-lg text-[0.9375rem] font-medium text-ink-2 hover:bg-accent">
        {t("push.notNow")}
      </button>
    </aside>
  );
}

/** Uma vez por abertura: conta o "Agora não", confere o token e abre links pedidos pelo service worker. */
export function usePushBoot() {
  const { email } = useAuth();
  const lang = useLangAtual();
  const navigate = useNavigate();
  useEffect(() => { contarAbertura(); }, []);
  useEffect(() => { if (email) void sincronizarPush(email, lang); }, [email, lang]);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const ouvir = (e: MessageEvent) => {
      const d = e.data as { tipo?: string; link?: string } | null;
      if (d?.tipo === "abrir" && typeof d.link === "string" && d.link.startsWith("/") && !d.link.startsWith("//")) navigate(d.link);
    };
    navigator.serviceWorker.addEventListener("message", ouvir);
    return () => navigator.serviceWorker.removeEventListener("message", ouvir);
  }, [navigate]);
}
