import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, FolderOpen, Search, Heart, Sparkles, MessageCircle, Users, Zap, Home, Mic, LogOut, Library, Map, SlidersHorizontal, Sun, Moon, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { FONT_SIZE_OPTIONS, useFontSize } from "@/hooks/use-font-size";
import { setLanguageManually } from "@/i18n";
import type { AppLanguage } from "@/i18n/geo-language";
import InstallButton from "@/components/InstallButton";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { APP_LANGUAGES, idiomasLiberados, matchAppLanguage, usePlanoAtual } from "@/i18n/app-languages";
import { VERSIONS_BY_LANG, normalizeBibleLanguage } from "@/data/bible-versions";
import { getLastRead, libraryProducts } from "@/data/library";
import { journeyProgressRepository } from "@/features/bible-journey/progress";
import "./Dock.css";

/* Dock da versão web (≥ 768 px), no espírito do Dock do Mac, pedido pelo dono em 13/11/2026:
   ícones em fila numa barra translúcida embaixo; o ícone sob o mouse cresce e os vizinhos
   crescem menos; parando ~300 ms em cima abre um balão com o nome, uma linha e os atalhos
   que já existem no app. Regras da casa: texto do balão 16–17 px, nada abaixo de 14 px. */

const HOVER_DELAY = 300;
const LEAVE_DELAY = 220;
// "A" de amostra: do mínimo da casa (15 px) ao maior.
const FONT_SIZES = FONT_SIZE_OPTIONS;

// Mesma cruz latina dourada da barra do celular.
const Cross = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="dock-cross">
    <path d="M10.6 2.5h2.8a.6.6 0 0 1 .6.6v4.6h4.4a.6.6 0 0 1 .6.6v2.8a.6.6 0 0 1-.6.6H14v9.2a.6.6 0 0 1-.6.6h-2.8a.6.6 0 0 1-.6-.6v-9.2H5.6a.6.6 0 0 1-.6-.6V8.3a.6.6 0 0 1 .6-.6H10V3.1a.6.6 0 0 1 .6-.6Z" />
  </svg>
);

type DockOption = { label: string; to: string };
type DockItem = {
  id: string;
  path: string;
  end?: boolean;
  icon: LucideIcon | "cross";
  title: string;
  description: string;
  /** Linhas de informação (ex.: passagem em preparação, últimos esboços). */
  info?: string[];
  /** Atalhos que levam direto a um ponto da ferramenta. */
  options?: DockOption[];
  kind?: "settings";
};

const readJSON = <T,>(key: string, fallback: T): T => {
  try { return (JSON.parse(localStorage.getItem(key) || "null") as T) ?? fallback; } catch { return fallback; }
};

/** Passagem em preparação e títulos dos últimos 3 esboços (mesmas chaves da Oficina e da Início). */
function readStored() {
  const sermons = readJSON<{ titulo?: string; textoBase?: string }[]>("fc-sermoes", []);
  const list = Array.isArray(sermons) ? sermons : [];
  const draft = readJSON<{ textoBase?: string }>("fc-oficina-atual", {});
  return {
    passage: draft.textoBase?.trim() || list.at(-1)?.textoBase?.trim() || "",
    titles: list.slice(-3).reverse().map((s) => s.titulo?.trim() || ""),
  };
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Onde o leitor parou na Jornada (mesma regra da tela de Início). */
function useJourneySpot(pathname: string) {
  const { t, i18n } = useTranslation();
  const [spot, setSpot] = useState<{ label: string; to: string } | null>(null);
  useEffect(() => {
    const where = journeyProgressRepository.getState().lastLocation;
    if (!where) { setSpot(null); return; }
    let active = true;
    import("@/features/bible-journey/catalog").then(async ({ journeyCatalogRepository }) => {
      const book = await journeyCatalogRepository.getBook(where.bookSlug);
      if (!active || !book) return;
      const names = t("biblia.books", { returnObjects: true }) as string[];
      setSpot({
        label: `${names[book.bibleBookId - 1] ?? book.slug} ${where.chapter}`,
        to: `/jornada/${book.testament}/${book.slug}/capitulos/${where.chapter}`,
      });
    }).catch(() => {});
    return () => { active = false; };
  }, [t, i18n.language, pathname]);
  return spot;
}

export function Dock() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const { pathname } = useLocation();
  const spot = useJourneySpot(pathname);
  // Ícone Admin só para admin (admin_users via sessão, ou painel já aberto com senha neste aparelho).
  const { email } = useAuth();
  const isAdmin = useIsAdmin(email);

  // Estado guardado no aparelho (Oficina, esboços, Livraria): relido a cada troca de página.
  const [stored, setStored] = useState(() => readStored());
  useEffect(() => { setStored(readStored()); }, [pathname]);

  const groups = useMemo<DockItem[][]>(() => {
    const lang = normalizeBibleLanguage(language);
    const versions = VERSIONS_BY_LANG[lang] ?? [];
    const { passage, titles } = stored;
    const recent = titles.map((title) => title || t("esbocos.defaultTitle"));
    const lastRead = getLastRead(language);
    const products = libraryProducts(language);

    return [
      [{ id: "home", path: "/", end: true, icon: Home, title: t("sidebar.home"), description: t("dock.homeDescription") }],
      [
        {
          id: "oficina", path: "/oficina", icon: "cross", title: t("sidebar.oficina.title"), description: t("sidebar.oficina.description"),
          info: passage ? [`${t("workspace.inPreparation")} · ${passage}`] : undefined,
          options: [
            ...(passage ? [{ label: t("workspace.continue"), to: "/oficina" }] : []),
            { label: t("sidebar.esbocos.title"), to: "/esbocos" },
          ],
        },
        {
          id: "esbocos", path: "/esbocos", icon: FolderOpen, title: t("sidebar.esbocos.title"), description: t("sidebar.esbocos.description"),
          info: recent.length ? [t("dashboard.recentOutlines"), ...recent] : [t("dashboard.noOutlines")],
        },
        { id: "pulpito", path: "/pulpito", icon: Users, title: t("sidebar.pulpito.title"), description: t("sidebar.pulpito.description") },
      ],
      [
        {
          id: "biblia", path: "/biblia", icon: BookOpen, title: t("sidebar.biblia.title"), description: t("sidebar.biblia.description"),
          options: [
            { label: t("journey.oldTestament"), to: "/biblia?bookId=1" },
            { label: t("journey.newTestament"), to: "/biblia?bookId=40" },
            ...versions.map((v) => ({ label: v.name, to: `/biblia?version=${v.id}` })),
          ],
        },
        {
          id: "jornada", path: "/jornada", icon: Map, title: t("journey.title"), description: t("journey.sidebarDescription"),
          info: spot ? [`${t("home.journeyWhere")} ${spot.label}`] : undefined,
          options: [
            spot ? { label: `${t("home.journeyContinue")} · ${spot.label}`, to: spot.to } : { label: t("home.journeyStart"), to: "/jornada" },
            { label: t("journey.sources"), to: "/jornada/fontes" },
          ],
        },
        { id: "raio-x", path: "/raio-x", icon: Zap, title: t("sidebar.raioX.title"), description: t("sidebar.raioX.description") },
        { id: "nomes", path: "/nomes", icon: Search, title: t("sidebar.nomes.title"), description: t("sidebar.nomes.description") },
        { id: "garimpo", path: "/garimpo", icon: Sparkles, title: t("sidebar.garimpo.title"), description: t("sidebar.garimpo.description") },
        {
          id: "livraria", path: "/livraria", icon: Library, title: t("sidebar.livraria.title"), description: t("sidebar.livraria.description"),
          options: [
            ...(lastRead ? [{ label: `${t("dashboard.continueReading")} · ${lastRead.volumeTitle}`, to: `/livraria/${lastRead.productSlug}/${lastRead.volumeSlug}` }] : []),
            ...products.map((p) => ({ label: p.title, to: p.volumes.length === 1 ? `/livraria/${p.slug}/${p.volumes[0].slug}` : `/livraria/${p.slug}` })),
          ],
        },
      ],
      [
        { id: "devocional", path: "/devocional", icon: Heart, title: t("sidebar.devocional.title"), description: t("sidebar.devocional.description") },
        { id: "mural", path: "/mural", icon: MessageCircle, title: t("sidebar.mural.title"), description: t("sidebar.mural.description") },
        { id: "voz", path: "/voz-de-deus", icon: Mic, title: t("sidebar.voz.title"), description: t("sidebar.voz.description") },
      ],
      [
        ...(isAdmin ? [{ id: "admin", path: "/fc-control-panel", icon: Shield, title: t("admin.open"), description: t("admin.openDescription") }] : []),
        { id: "settings", path: "", icon: SlidersHorizontal, title: t("dock.settings"), description: t("dock.settingsDescription"), kind: "settings" as const },
      ],
    ];
  }, [t, language, spot, stored, isAdmin]);

  const items = useMemo(() => groups.flat(), [groups]);
  const isActive = (item: DockItem) =>
    item.path !== "" && (item.end ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`));

  // ---------- Balão: aberto por pausa do mouse, foco do teclado ou toque ----------
  const [open, setOpen] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const openRef = useRef<string | null>(null);
  openRef.current = open;
  const pinnedRef = useRef(false);
  pinnedRef.current = pinned;
  const hoverTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);
  const touchArm = useRef<"open" | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  const close = useCallback(() => { setOpen(null); setPinned(false); }, []);

  useEffect(() => { close(); }, [pathname, close]);
  useEffect(() => () => { window.clearTimeout(hoverTimer.current); window.clearTimeout(leaveTimer.current); }, []);

  // Clique fora fecha.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: globalThis.PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  const onItemEnter = (id: string, event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    window.clearTimeout(leaveTimer.current);
    window.clearTimeout(hoverTimer.current);
    if (pinnedRef.current) return;
    if (openRef.current) { setOpen(id); return; }
    hoverTimer.current = window.setTimeout(() => setOpen(id), HOVER_DELAY);
  };
  const onItemLeave = () => { window.clearTimeout(hoverTimer.current); };
  const onDockLeave = () => {
    window.clearTimeout(hoverTimer.current);
    if (pinnedRef.current) return;
    leaveTimer.current = window.setTimeout(() => setOpen(null), LEAVE_DELAY);
  };
  const onDockEnter = () => { window.clearTimeout(leaveTimer.current); };
  const onNavBlur = (event: FocusEvent) => {
    if (!navRef.current?.contains(event.relatedTarget as Node)) close();
  };

  // Tablet: o primeiro toque abre o balão; o segundo entra.
  const onItemPointerDown = (id: string, event: PointerEvent) => {
    touchArm.current = event.pointerType === "touch" && openRef.current !== id ? "open" : null;
  };
  const onItemClick = (item: DockItem, event: MouseEvent) => {
    if (item.kind === "settings") {
      event.preventDefault();
      if (openRef.current === item.id && pinnedRef.current) close();
      else { setOpen(item.id); setPinned(true); }
      return;
    }
    if (touchArm.current === "open") {
      event.preventDefault();
      setOpen(item.id);
      setPinned(true);
    }
    touchArm.current = null;
  };

  const onItemKeyDown = (index: number, event: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (event.key in keys) {
      event.preventDefault();
      const next = items[Math.max(0, Math.min(items.length - 1, keys[event.key]))];
      itemRefs.current[next.id]?.focus();
    }
  };
  const onNavKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && openRef.current) {
      event.preventDefault();
      const id = openRef.current;
      close();
      itemRefs.current[id]?.focus();
    }
  };

  // ---------- Ampliação contínua seguindo o mouse ----------
  const raf = useRef<number | undefined>(undefined);
  const resetScale = useCallback(() => {
    for (const el of Object.values(itemRefs.current)) el?.style.removeProperty("--s");
  }, []);
  const applyScale = (x: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const styles = getComputedStyle(bar);
    const base = parseFloat(styles.getPropertyValue("--dock-size")) || 48;
    const max = parseFloat(styles.getPropertyValue("--dock-max")) || 1.6;
    const radius = base * 2.6;
    for (const el of Object.values(itemRefs.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const d = Math.abs(x - (rect.left + rect.width / 2));
      const s = d >= radius ? 1 : 1 + (max - 1) * (0.5 + 0.5 * Math.cos((Math.PI * d) / radius));
      el.style.setProperty("--s", s.toFixed(3));
    }
  };
  const onBarMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const x = event.clientX;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => applyScale(x));
  };
  const onBarLeave = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    resetScale();
  };

  // ---------- Posição do balão (acima do ícone, dentro da tela) ----------
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ left: number; bottom: number; arrow: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) { setCardPos(null); return; }
    const place = () => {
      const anchor = itemRefs.current[open];
      const card = cardRef.current;
      if (!anchor || !card) return;
      const rect = anchor.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const width = card.offsetWidth;
      const margin = 12;
      const left = Math.max(margin, Math.min(center - width / 2, window.innerWidth - width - margin));
      setCardPos({ left, bottom: window.innerHeight - rect.top + 14, arrow: center - left });
    };
    place();
    const timer = window.setTimeout(place, 180); // depois da ampliação assentar
    window.addEventListener("resize", place);
    return () => { window.clearTimeout(timer); window.removeEventListener("resize", place); };
  }, [open]);

  let index = -1;
  return (
    <nav
      ref={navRef}
      className="dock"
      aria-label={t("dock.label")}
      onPointerEnter={onDockEnter}
      onPointerLeave={onDockLeave}
      onBlur={onNavBlur}
      onKeyDown={onNavKeyDown}
    >
      <div ref={barRef} className="dock-bar" onPointerMove={onBarMove} onPointerLeave={onBarLeave}>
        <ul className="dock-list">
          {groups.map((group, g) => (
            <li key={g} className="dock-group">
              {g > 0 && <span className="dock-sep" role="separator" aria-orientation="vertical" />}
              <ul className="dock-items">
                {group.map((item) => {
                  index += 1;
                  const i = index;
                  const active = isActive(item);
                  const isOpen = open === item.id;
                  const cardId = `dock-card-${item.id}`;
                  const common = {
                    ref: (el: HTMLElement | null) => { itemRefs.current[item.id] = el; },
                    className: `dock-btn${item.icon === "cross" ? " dock-btn-cross" : ""}`,
                    "aria-label": item.title,
                    "aria-describedby": isOpen ? cardId : undefined,
                    "aria-current": active ? ("page" as const) : undefined,
                    onPointerEnter: (e: PointerEvent) => onItemEnter(item.id, e),
                    onPointerLeave: onItemLeave,
                    onPointerDown: (e: PointerEvent) => onItemPointerDown(item.id, e),
                    onFocus: () => { window.clearTimeout(leaveTimer.current); setOpen(item.id); },
                    onKeyDown: (e: KeyboardEvent) => onItemKeyDown(i, e),
                    onClick: (e: MouseEvent) => onItemClick(item, e),
                  };
                  const content = (
                    <>
                      {item.icon === "cross"
                        ? <span className="dock-fab" aria-hidden="true"><Cross /></span>
                        : <item.icon className="dock-icon" strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />}
                    </>
                  );
                  return (
                    <li key={item.id} className={`dock-item${isOpen ? " is-open" : ""}${active ? " is-active" : ""}`}>
                      {item.kind === "settings"
                        ? <button type="button" aria-haspopup="dialog" aria-expanded={isOpen} {...common}>{content}</button>
                        : <Link to={item.path} {...common}>{content}</Link>}
                      <span className="dock-dot" aria-hidden="true" />
                      {active && <span className="sr-only">{t("dock.current")}</span>}
                      {isOpen && (
                        <DockCard id={cardId} ref={cardRef} item={item} pos={cardPos} onNavigate={close}>
                          {item.kind === "settings" && <SettingsPanel />}
                        </DockCard>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}


type DockCardProps = {
  id: string;
  item: DockItem;
  pos: { left: number; bottom: number; arrow: number } | null;
  onNavigate: () => void;
  children?: ReactNode;
};

/** Balão acima do ícone: nome, uma linha e os atalhos. */
const DockCard = forwardRef<HTMLDivElement, DockCardProps>(({ id, item, pos, onNavigate, children }, ref) => {
  const { t } = useTranslation();
  return (
    <div
      ref={ref}
      id={id}
      role={item.kind === "settings" ? "dialog" : "group"}
      aria-label={item.title}
      className={`dock-card${pos ? " is-placed" : ""}${item.kind === "settings" ? " dock-card-settings" : ""}`}
      style={pos ? { left: pos.left, bottom: pos.bottom, "--arrow": `${pos.arrow}px` } as CSSProperties : undefined}
    >
      <p className="dock-card-title">{item.title}</p>
      <p className="dock-card-desc">{item.description}</p>
      {item.info && (
        <ul className="dock-card-info">
          {item.info.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      )}
      {item.options && item.options.length > 0 && (
        <>
          <p className="dock-card-label">{t("dock.shortcuts")}</p>
          <ul className="dock-card-options">
            {item.options.map((option) => (
              <li key={option.to + option.label}>
                <Link to={option.to} onClick={onNavigate}>{option.label}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {children}
    </div>
  );
});
DockCard.displayName = "DockCard";

/** Painel do ícone Ajustes: idioma, tamanho do texto, aparência, instalar e conta. */
function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { email, signOut } = useAuth();
  const names = t("fontSize.names", { returnObjects: true }) as string[];
  const current = i18n.resolvedLanguage || i18n.language;
  const matched = matchAppLanguage(current);
  // Trava por plano: idioma fora do plano fica desabilitado na lista (ver app-languages.ts).
  const liberados = idiomasLiberados(usePlanoAtual());

  return (
    <div className="dock-settings">
      <label className="dock-set-row">
        <span>{t("dock.language")}</span>
        <select className="dock-select" value={matched} onChange={(e) => void setLanguageManually(e.target.value as AppLanguage)}>
          {APP_LANGUAGES.map((l) => {
            const bloqueado = !liberados.includes(l.code);
            return <option key={l.code} value={l.code} disabled={bloqueado}>{bloqueado ? `${l.name} · ${t("languages.lockedTitle")}` : l.name}</option>;
          })}
        </select>
      </label>

      <div className="dock-set-row" role="group" aria-labelledby="dock-font-label">
        <span id="dock-font-label">{t("fontSize.label")}</span>
        <div className="dock-font">
          {FONT_SIZES.map((size, i) => (
            <button
              key={size.value}
              type="button"
              aria-pressed={fontSize === size.value}
              aria-label={names[i]}
              title={names[i]}
              onClick={() => setFontSize(size.value)}
              style={{ fontSize: size.px }}
            >
              A
            </button>
          ))}
        </div>
      </div>

      <div className="dock-set-row">
        <span>{t("dock.appearance")}</span>
        <button type="button" className="dock-set-btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          {theme === "dark" ? t("dashboard.lightMode") : t("dashboard.darkMode")}
        </button>
      </div>

      <div className="dock-set-row dock-set-install">
        <span>{t("appName")}</span>
        <InstallButton />
      </div>

      <div className="dock-set-row dock-set-account">
        <span>{t("dock.account")}</span>
        <div>
          {email && <p className="dock-email">{email}</p>}
          <button type="button" className="dock-set-btn" onClick={signOut}>
            <LogOut aria-hidden="true" />{t("sidebar.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dock;
