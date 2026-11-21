import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BottomNav } from "@/components/BottomNav";
import { Dock } from "@/components/Dock";
import { LanguageFlags } from "@/components/LanguageFlags";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { ArrowLeft, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstallButton from "@/components/InstallButton";
import { usePageTracking } from "@/hooks/use-tracking";
import FontSizeSelector from "@/components/FontSizeSelector";
import { FontSizeStepper } from "@/components/FontSizeStepper";
import { useFontSize } from "@/hooks/use-font-size";
import { appLogo } from "@/lib/branding";
import { parentPath } from "@/lib/parent-path";
import { PushBell, PushInvite, usePushBoot } from "@/components/PushCentral";

/** Hambúrguer do topo no celular: abre a mesma folha de cartõezinhos (MenuSheet) da aba Menu da barra inferior. */
const MenuButton = ({ open, onOpen }: { open: boolean; onOpen: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onOpen}
      className="menu-toggle h-12 w-12 hover:bg-transparent"
      aria-label={t("dashboard.menu")}
      aria-haspopup="dialog"
      aria-expanded={open}
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
  usePushBoot();
  const { pathname, hash } = useLocation();
  const parent = parentPath(pathname);
  const mainRef = useRef<HTMLElement>(null);
  // Folha do menu do celular: abre pelo hambúrguer do topo e pela aba Menu da barra inferior.
  const [menuOpen, setMenuOpen] = useState(false);
  // Sem isto, ir ao capítulo seguinte abre a página nova já rolada até ao fim.
  useEffect(() => {
    if (hash) return;
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      {/* Altura da tela fixa: quem rola é o <main>, não a janela. Assim o cabeçalho (bandeiras, A−/A+, tema) fica sempre
          à vista no computador e os blocos "sticky" das páginas (faixa de etapas da Início, coluna de pedido) funcionam. */}
      <div className="h-dvh min-h-0 flex w-full overflow-hidden">
        {/* Celular: folha de cartõezinhos (MenuSheet, dentro da BottomNav). Desktop: Dock embaixo, sem lateral. */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop: grelha marca | bandeiras | tema. De 768 a 1023 px as bandeiras centram no espaço que sobra;
              a partir de 1024 px as três colunas das pontas são iguais e as bandeiras ficam no centro exato do ecrã. */}
          <header className="h-14 flex items-center justify-between gap-1 border-b border-rule-soft bg-background px-1 shrink-0 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-3 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="flex min-w-0 items-center md:hidden">
              <MenuButton open={menuOpen} onOpen={() => setMenuOpen(true)} />
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
            {/* Desktop: bandeiras dos idiomas no meio, no alto (um toque troca o idioma). */}
            <LanguageFlags variant="bar" className="hidden md:flex" />
            <div className="flex shrink-0 items-center md:justify-self-end md:gap-2">
              {/* Celular: ajustes no topo. Desktop: ficam no ícone Ajustes do Dock. */}
              <div className="flex items-center md:hidden">
                <PushBell />
                <InstallButton />
                <FontSizeSelector />
                {/* Celular: só a bandeira atual, redonda; tocar abre a folha com as 6. */}
                <LanguageFlags variant="sheet" />
              </div>
              {/* Computador e tablet: A−/A+ sempre à vista, ao lado do tema (o dono não quer o tamanho escondido nos Ajustes). */}
              <FontSizeStepper className="hidden md:inline-flex" />
              <span className="hidden md:inline-flex"><PushBell /></span>
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
          {/* "relative": sem isto, os textos só para leitor de tela (sr-only, posição absoluta) tomam a janela como
              referência e fazem a página inteira rolar atrás do <main>. */}
          <main ref={mainRef} className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className={`${fontSizeClass} bnav-spacer`}><PushInvite /><Outlet /></div>
          </main>
          <BottomNav menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
          {!isMobile && <Dock />}
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
