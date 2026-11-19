import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Home, Map, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MenuSheet } from "@/components/MenuSheet";
import "./BottomNav.css";

// Cruz latina dourada do botão central (Oficina de Sermões).
const Cross = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="bnav-cross">
    <path d="M10.6 2.5h2.8a.6.6 0 0 1 .6.6v4.6h4.4a.6.6 0 0 1 .6.6v2.8a.6.6 0 0 1-.6.6H14v9.2a.6.6 0 0 1-.6.6h-2.8a.6.6 0 0 1-.6-.6v-9.2H5.6a.6.6 0 0 1-.6-.6V8.3a.6.6 0 0 1 .6-.6H10V3.1a.6.6 0 0 1 .6-.6Z" />
  </svg>
);

type Tab = { to: string; label: string; icon: LucideIcon; end?: boolean };

const TabLink = ({ to, label, icon: Icon, end }: Tab) => (
  <NavLink to={to} end={end} className={({ isActive }) => `bnav-tab${isActive ? " is-active" : ""}`}>
    {({ isActive }) => (
      <>
        <span className="bnav-pill" aria-hidden="true">
          <Icon className="bnav-icon" strokeWidth={isActive ? 2.25 : 1.9} fill={isActive ? "currentColor" : "none"} fillOpacity={isActive ? 0.22 : 0} />
        </span>
        <span className="bnav-label">{label}</span>
      </>
    )}
  </NavLink>
);

interface BottomNavProps {
  /** Estado da folha controlado de fora (o DashboardLayout abre a mesma folha pelo hambúrguer do topo). */
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}

/** Barra fixa inferior do celular: Início | Bíblia | [Oficina] | Jornada | Menu.
 *  "Menu" sobe a folha de cartõezinhos (MenuSheet), no lugar do menu lateral. */
export function BottomNav({ menuOpen: menuOpenProp, onMenuOpenChange }: BottomNavProps = {}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [menuOpenLocal, setMenuOpenLocal] = useState(false);
  const controlled = menuOpenProp !== undefined;
  const menuOpen = controlled ? menuOpenProp : menuOpenLocal;
  const setMenuOpen = (open: boolean) => {
    if (!controlled) setMenuOpenLocal(open);
    onMenuOpenChange?.(open);
  };
  // Trocou de página: a folha fecha.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const oficinaActive = pathname === "/oficina" || pathname.startsWith("/oficina/");

  return (
    <nav className="bnav" aria-label={t("dashboard.menu")}>
      <div className="bnav-bar">
        <TabLink to="/" end label={t("sidebar.home")} icon={Home} />
        <TabLink to="/biblia" label={t("sidebar.biblia.title")} icon={BookOpen} />

        <NavLink to="/oficina" className={`bnav-tab bnav-center${oficinaActive ? " is-active" : ""}`}>
          <span className="bnav-fab" aria-hidden="true"><Cross /></span>
          <span className="bnav-label">{t("sidebar.oficina.title")}</span>
        </NavLink>

        <TabLink to="/jornada" label={t("journey.title")} icon={Map} />

        <button
          type="button"
          className={`bnav-tab${menuOpen ? " is-active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
        >
          <span className="bnav-pill" aria-hidden="true">
            <Menu className="bnav-icon" strokeWidth={menuOpen ? 2.25 : 1.9} />
          </span>
          <span className="bnav-label">{t("dashboard.menu")}</span>
        </button>
      </div>
      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </nav>
  );
}

export default BottomNav;
