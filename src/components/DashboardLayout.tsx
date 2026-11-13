import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Dock } from "@/components/Dock";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { ArrowLeft, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstallButton from "@/components/InstallButton";
import { usePageTracking } from "@/hooks/use-tracking";
import FontSizeSelector from "@/components/FontSizeSelector";
import { useFontSize } from "@/hooks/use-font-size";
import { appLogo } from "@/lib/branding";
import { parentPath } from "@/lib/parent-path";

const MenuButton = () => {
  const { t } = useTranslation();
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="menu-toggle h-11 w-11 hover:bg-transparent"
      aria-label={t("dashboard.menu")}
    >
      <Menu className="!h-6 !w-6" strokeWidth={1.75} />
    </Button>
  );
};

const DashboardLayout = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const { fontSizeClass } = useFontSize();
  const { theme, toggleTheme } = useTheme();
  usePageTracking();
  const { pathname, hash } = useLocation();
  const parent = parentPath(pathname);
  const mainRef = useRef<HTMLElement>(null);
  // Sem isto, ir ao capítulo seguinte abre a página nova já rolada até ao fim.
  useEffect(() => {
    if (hash) return;
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        {/* Celular: menu lateral (abre pela aba "Menu" da barra inferior). Desktop: Dock embaixo, sem lateral. */}
        {isMobile && <nav aria-label={t("dashboard.menu")} className="contents"><AppSidebar /></nav>}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-1 border-b border-rule-soft bg-background px-1 shrink-0 md:px-6">
            <div className="flex min-w-0 items-center md:hidden">
              <MenuButton />
              {/* Celular: o nome inteiro não cabe, então entra o brasão; fora do início, a seta para o nível acima. */}
              {parent ? (
                <Link to={parent} aria-label={t("common.backTo")} className="flex h-11 w-11 items-center justify-center text-ink-2 hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              ) : (
                <img src={appLogo(i18n.resolvedLanguage || i18n.language)} alt={t("appName")} className="ml-1 h-9 w-9 object-contain" />
              )}
            </div>
            {/* Desktop: a marca que antes ficava no topo da lateral. */}
            <Link to="/" className="hidden min-w-0 items-center gap-3 md:flex">
              <img src={appLogo(i18n.resolvedLanguage || i18n.language)} alt="" className="h-9 w-9 object-contain" />
              <span className="font-brand truncate text-[0.9375rem] font-semibold tracking-[0.06em] text-gold-ink">{t("appName")}</span>
            </Link>
            <div className="flex shrink-0 items-center md:gap-2">
              {/* Celular: ajustes no topo. Desktop: ficam no ícone Ajustes do Dock. */}
              <div className="flex items-center md:hidden">
                <InstallButton />
                <FontSizeSelector />
                <LanguageSwitcher variant="horizontal" compact />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-ink-2 hover:bg-transparent hover:text-foreground"
                aria-label={theme === "dark" ? t("dashboard.lightMode") : t("dashboard.darkMode")}
                title={theme === "dark" ? t("dashboard.lightMode") : t("dashboard.darkMode")}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </header>
          <main ref={mainRef} className="flex-1 overflow-auto">
            <div className={`${fontSizeClass} bnav-spacer`}><Outlet /></div>
          </main>
          <BottomNav />
          {!isMobile && <Dock />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
