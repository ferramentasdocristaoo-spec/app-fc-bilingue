import { useEffect, useState, useSyncExternalStore } from "react";
import { offlineBible } from "@/lib/bible-offline/manager";

/** Estado da Bíblia offline (versões no aparelho e downloads em andamento). */
export function useOfflineBible() {
  const manager = offlineBible();
  const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot, manager.getSnapshot);
  useEffect(() => { void manager.load(); }, [manager]);
  return { manager, snapshot };
}

/** navigator.onLine com os eventos online/offline. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** "4,4 MB" no formato do idioma. */
export function formatMegabytes(bytes: number, language: string): string {
  const mb = bytes / 1_000_000;
  const n = new Intl.NumberFormat(language, { maximumFractionDigits: mb < 10 ? 1 : 0, minimumFractionDigits: mb < 10 ? 1 : 0 }).format(mb);
  return `${n} MB`;
}
