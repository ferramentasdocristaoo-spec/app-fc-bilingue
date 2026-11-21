import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatMegabytes, useOfflineBible, useOnline } from "@/hooks/use-offline-bible";
import { ONLINE_ONLY_VERSIONS, type VersionState } from "@/lib/bible-offline/manager";

type Version = { id: string; name: string };

/**
 * Lista de versões da Bíblia. Tocar numa versão abre a leitura e já guarda a versão no celular
 * (sem botão "baixar"). Mostra o progresso na própria linha, o selo "No celular ✓", quanto ocupa
 * e o botão para tirar do celular.
 */
export function BibleVersionSheet({
  open,
  onOpenChange,
  versions,
  current,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: Version[];
  current: string;
  onChoose: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const { manager, snapshot } = useOfflineBible();
  const online = useOnline();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const readyHere = versions.filter((v) => snapshot.versions[v.id]?.status === "ready");
  const totalBytes = readyHere.reduce((sum, v) => {
    const s = snapshot.versions[v.id];
    return s?.status === "ready" ? sum + s.info.bytes : sum;
  }, 0);

  const statusText = (id: string, state: VersionState | undefined): string => {
    if (!snapshot.supported) return "";
    if (ONLINE_ONLY_VERSIONS.has(id)) return t("biblia.offline.onlineOnly");
    switch (state?.status) {
      case "ready": return `${t("biblia.offline.onDevice")} · ${formatMegabytes(state.info.bytes, language)}`;
      case "downloading": return state.progress === null ? t("biblia.offline.downloadingNoPercent") : t("biblia.offline.downloading", { percent: state.progress });
      case "queued": return t("biblia.offline.queued");
      case "saving": return t("biblia.offline.saving");
      case "error": return state.reason === "quota" ? t("biblia.offline.errorQuota") : t("biblia.offline.error");
      default: return online ? "" : t("biblia.offline.needsInternet");
    }
  };

  const remove = async (v: Version, confirmed: boolean) => {
    setConfirmRemove(null);
    await manager.removeVersion(v.id);
    if (confirmed) toast({ title: t("biblia.offline.removed", { name: v.name.split(" - ")[0] }) });
    // Foco volta para a linha da versão (o botão da lixeira some).
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-versao="${v.id}"]`)?.focus());
  };
  const cancelRemove = (id: string) => {
    setConfirmRemove(null);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-versao="${id}"]`)?.focus());
  };
  // Anúncio para leitor de tela só no começo e no fim (não a cada %).
  const anuncio = versions
    .map((v) => ({ v, s: snapshot.versions[v.id] }))
    .filter(({ s }) => s?.status === "saving" || s?.status === "queued" || s?.status === "error")
    .map(({ v, s }) => `${v.name.split(" - ")[0]}: ${statusText(v.id, s)}`)
    .join(". ");

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setConfirmRemove(null); onOpenChange(next); }}>
      <DialogContent className="bv-sheet">
        <DialogTitle className="bv-title">{t("biblia.offline.versionsTitle")}</DialogTitle>
        <DialogDescription className="bv-hint">
          {snapshot.supported ? t("biblia.offline.hint") : t("biblia.offline.unsupported")}
        </DialogDescription>
        {!online && <p className="bv-offline-note" role="status">{t("biblia.offline.youAreOffline")}</p>}

        <ul className="bv-list">
          {versions.map((v) => {
            const state = snapshot.versions[v.id];
            const status = statusText(v.id, state);
            const isCurrent = v.id === current;
            const busy = state?.status === "downloading" || state?.status === "queued" || state?.status === "saving";
            const percent = state?.status === "downloading" ? state.progress : null;
            if (confirmRemove === v.id) {
              return (
                <li key={v.id} className="bv-row bv-row-confirm">
                  <p className="bv-confirm-text">{t("biblia.offline.removeQuestion", { name: v.name })}</p>
                  <div className="bv-confirm-actions">
                    <button type="button" className="bv-btn bv-btn-danger" onClick={() => remove(v, true)}>{t("biblia.offline.removeYes")}</button>
                    <button type="button" className="bv-btn" autoFocus onClick={() => cancelRemove(v.id)}>{t("common.cancel")}</button>
                  </div>
                </li>
              );
            }
            return (
              <li key={v.id} className={`bv-row${isCurrent ? " is-current" : ""}`}>
                <button
                  type="button"
                  className="bv-choose"
                  data-versao={v.id}
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={() => onChoose(v.id)}
                >
                  <span className="bv-name">
                    {v.name}
                    {isCurrent && <span className="bv-current">{t("biblia.offline.readingNow")}</span>}
                  </span>
                  {status && (
                    <span className={`bv-status bv-status-${state?.status ?? "none"}`}>
                      {status}
                    </span>
                  )}
                  {state?.status === "downloading" && (
                    <span className="bv-bar" aria-hidden="true"><i style={{ width: `${percent ?? 15}%` }} /></span>
                  )}
                </button>
                {(state?.status === "ready" || busy) && (
                  <button
                    type="button"
                    className="bv-remove"
                    onClick={() => (state?.status === "ready" ? setConfirmRemove(v.id) : remove(v, false))}
                    aria-label={state?.status === "ready" ? t("biblia.offline.remove", { name: v.name }) : t("biblia.offline.cancelDownload", { name: v.name })}
                    title={state?.status === "ready" ? t("biblia.offline.remove", { name: v.name }) : t("biblia.offline.cancelDownload", { name: v.name })}
                  >
                    <Trash2 size={22} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <p className="sr-only" aria-live="polite">{anuncio}</p>
        {snapshot.supported && (
          <p className="bv-total">
            {readyHere.length === 0
              ? t("biblia.offline.totalNone")
              : t("biblia.offline.total", { count: readyHere.length, size: formatMegabytes(totalBytes, language) })}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
