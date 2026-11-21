import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, FolderOpen, Search, Heart, Sparkles, MessageCircle, Users, Zap, Mic, Library, Map, LogOut, Sun, Moon, X, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useTheme } from "@/hooks/use-theme";
import { useFontSize } from "@/hooks/use-font-size";
import { APP_LANGUAGES, matchAppLanguage } from "@/i18n/app-languages";
import { LanguageFlags } from "@/components/LanguageFlags";
import FontSizeSelector from "@/components/FontSizeSelector";
import InstallButton from "@/components/InstallButton";
import "./MenuSheet.css";

/* Menu do celular em cartõezinhos (pedido do dono, 13/11/2026, mockup "direção A"):
   a aba Menu da barra inferior sobe uma folha arredondada com o utilizador no topo e as
   ferramentas em grade de 3, agrupadas como as etapas da Início. Cada cartão leva o ícone
   da ferramenta (o mesmo do Dock) num quadradinho azul-noite, não a inicial do nome: o
   nome inteiro vem primeiro — 15 px, semibold, sem quebrar palavra no meio. Se, no idioma
   atual, algum nome não couber em 3 colunas, a grade passa sozinha para 2 colunas.
   Fecha arrastando para baixo (vaul), no X, tocando fora e com Escape. */

// Mesma cruz latina dourada da barra do celular e do Dock (Oficina de Sermões).
const Cross = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="msheet-cross">
    <path d="M10.6 2.5h2.8a.6.6 0 0 1 .6.6v4.6h4.4a.6.6 0 0 1 .6.6v2.8a.6.6 0 0 1-.6.6H14v9.2a.6.6 0 0 1-.6.6h-2.8a.6.6 0 0 1-.6-.6v-9.2H5.6a.6.6 0 0 1-.6-.6V8.3a.6.6 0 0 1 .6-.6H10V3.1a.6.6 0 0 1 .6-.6Z" />
  </svg>
);

type Tool = { id: string; path: string; icon: LucideIcon | "cross"; title: string };
type Group = { id: string; label: string; tools: Tool[] };

/** Nome mostrado no topo: parte do e-mail antes do @, com as separações viradas em espaços. */
function displayName(email: string | null): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  return local
    .split(/[._\-+]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface MenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuSheet({ open, onOpenChange }: MenuSheetProps) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const { email, signOut } = useAuth();
  const isAdmin = useIsAdmin(email);
  const { theme, toggleTheme } = useTheme();
  const { fontSize } = useFontSize();
  const language = i18n.resolvedLanguage || i18n.language || "pt-PT";
  const languageName = APP_LANGUAGES.find((l) => l.code === matchAppLanguage(language))?.name ?? "";
  const sizeNames = t("fontSize.names", { returnObjects: true }) as string[];
  const sizeName = sizeNames[["small", "medium", "large", "xlarge"].indexOf(fontSize)] ?? "";
  const name = displayName(email) || t("appName");

  const groups: Group[] = [
    {
      id: "preparation", label: t("workspace.groups.preparation"),
      tools: [
        { id: "oficina", path: "/oficina", icon: "cross", title: t("sidebar.oficina.title") },
        { id: "esbocos", path: "/esbocos", icon: FolderOpen, title: t("sidebar.esbocos.title") },
        { id: "pulpito", path: "/pulpito", icon: Users, title: t("sidebar.pulpito.title") },
      ],
    },
    {
      id: "study", label: t("workspace.groups.study"),
      tools: [
        { id: "biblia", path: "/biblia", icon: BookOpen, title: t("sidebar.biblia.title") },
        { id: "jornada", path: "/jornada", icon: Map, title: t("journey.title") },
        { id: "raio-x", path: "/raio-x", icon: Zap, title: t("sidebar.raioX.title") },
        { id: "nomes", path: "/nomes", icon: Search, title: t("sidebar.nomes.title") },
        { id: "garimpo", path: "/garimpo", icon: Sparkles, title: t("sidebar.garimpo.title") },
        { id: "livraria", path: "/livraria", icon: Library, title: t("sidebar.livraria.title") },
      ],
    },
    {
      id: "life", label: t("workspace.groups.life"),
      tools: [
        { id: "devocional", path: "/devocional", icon: Heart, title: t("sidebar.devocional.title") },
        { id: "mural", path: "/mural", icon: MessageCircle, title: t("sidebar.mural.title") },
        { id: "voz", path: "/voz-de-deus", icon: Mic, title: t("sidebar.voz.title") },
      ],
    },
  ];
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  // 3 colunas; se algum nome não couber inteiro (palavra comprida, ex. "Predigtwerkstatt")
  // ou passar de 2 linhas, a grade vai para 2 colunas. Mede quando o corpo entra no DOM
  // (o conteúdo da folha monta num portal, depois do primeiro commit), quando o idioma muda
  // e quando as fontes acabam de carregar.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = useState<2 | 3>(3);
  const measure = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const names = Array.from(body.querySelectorAll<HTMLElement>(".msheet-name"));
    const tight = names.some((el) => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 18;
      return el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().height > lineHeight * 2.5;
    });
    if (tight) setCols(2);
  }, []);
  const setBody = useCallback((node: HTMLDivElement | null) => {
    bodyRef.current = node;
    if (node) measure();
  }, [measure]);
  useLayoutEffect(() => { setCols(3); }, [language]);
  useLayoutEffect(() => { if (cols === 3) measure(); }, [cols, language, measure]);
  useEffect(() => {
    if (!open || typeof document === "undefined" || !document.fonts?.ready) return;
    let active = true;
    document.fonts.ready.then(() => { if (active) measure(); }).catch(() => {});
    return () => { active = false; };
  }, [open, measure]);

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="msheet-overlay" />
        <DrawerPrimitive.Content className="msheet" aria-describedby={undefined}>
          <div className="msheet-grab" aria-hidden="true" />
          <DrawerPrimitive.Title className="sr-only">{t("dashboard.menu")}</DrawerPrimitive.Title>

          <header className="msheet-head">
            <span className="msheet-avatar" aria-hidden="true">{initials(name)}</span>
            <div className="msheet-who">
              <p className="msheet-user" title={email ?? undefined}>{name}</p>
              <p className="msheet-meta">
                <span lang={matchAppLanguage(language)}>{languageName}</span>
                <span aria-hidden="true"> · </span>
                <span className="msheet-aa" aria-hidden="true">Aa </span>
                <span className="sr-only">{t("fontSize.label")}: </span>
                <span>{sizeName}</span>
              </p>
            </div>
            <button type="button" className="msheet-logout" onClick={signOut}>
              <LogOut aria-hidden="true" />{t("sidebar.logout")}
            </button>
            <DrawerPrimitive.Close className="msheet-x" aria-label={t("common.close")}>
              <X aria-hidden="true" />
            </DrawerPrimitive.Close>
          </header>

          {/* Só para quem está em admin_users (sessão confirmada) ou já entrou no painel neste aparelho. */}
          {isAdmin && (
            <Link to="/fc-control-panel" className="msheet-admin" onClick={() => onOpenChange(false)}>
              <Shield aria-hidden="true" />
              <span>{t("admin.open")}</span>
              <span className="msheet-admin-desc">{t("admin.openDescription")}</span>
            </Link>
          )}

          <div ref={setBody} className="msheet-body" data-cols={cols}>
            {groups.map((group) => (
              <section key={group.id} className="msheet-group" aria-labelledby={`msheet-${group.id}`}>
                <h2 id={`msheet-${group.id}`} className="msheet-label">{group.label}</h2>
                <ul className="msheet-grid">
                  {group.tools.map((tool) => {
                    const active = isActive(tool.path);
                    return (
                      <li key={tool.id}>
                        <Link
                          to={tool.path}
                          className={`msheet-card${active ? " is-active" : ""}`}
                          aria-current={active ? "page" : undefined}
                          onClick={() => onOpenChange(false)}
                        >
                          <span className={`msheet-ico${tool.icon === "cross" ? " msheet-ico-cross" : ""}`} aria-hidden="true">
                            {tool.icon === "cross" ? <Cross /> : <tool.icon strokeWidth={1.9} />}
                          </span>
                          <span className="msheet-name">{tool.title}</span>
                          {active && <span className="sr-only">{t("dock.current")}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {/* Ajustes, compactos: idioma (bandeiras), tamanho da letra, aparência e instalar. */}
            <section className="msheet-group msheet-settings" aria-labelledby="msheet-settings">
              <h2 id="msheet-settings" className="msheet-label">{t("dock.settings")}</h2>
              <div className="msheet-set-row">
                <span className="msheet-set-label">{t("dock.language")}</span>
                <LanguageFlags variant="bar" />
              </div>
              <div className="msheet-set-cells">
                <div className="msheet-set-cell">
                  <span className="msheet-set-label">{t("fontSize.label")}</span>
                  <FontSizeSelector />
                </div>
                <div className="msheet-set-cell">
                  <span className="msheet-set-label">{t("dock.appearance")}</span>
                  <button
                    type="button"
                    className="msheet-theme"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? t("dashboard.lightMode") : t("dashboard.darkMode")}
                    title={theme === "dark" ? t("dashboard.lightMode") : t("dashboard.darkMode")}
                  >
                    {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                  </button>
                </div>
                <div className="msheet-set-cell msheet-set-install">
                  <span className="msheet-set-label">{t("dashboard.install")}</span>
                  <InstallButton />
                </div>
              </div>
              {email && <p className="msheet-email">{email}</p>}
            </section>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export default MenuSheet;
