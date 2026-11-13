import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Home, Map, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
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

/** Barra fixa inferior do celular: Início | Bíblia | [Oficina] | Jornada | Menu. */
export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { openMobile, setOpenMobile } = useSidebar();
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
          className={`bnav-tab${openMobile ? " is-active" : ""}`}
          onClick={() => setOpenMobile(!openMobile)}
          aria-expanded={openMobile}
        >
          <span className="bnav-pill" aria-hidden="true">
            <Menu className="bnav-icon" strokeWidth={openMobile ? 2.25 : 1.9} />
          </span>
          <span className="bnav-label">{t("dashboard.menu")}</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
