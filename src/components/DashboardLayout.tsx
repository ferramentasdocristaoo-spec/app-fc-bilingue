import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstallButton from "@/components/InstallButton";
import { usePageTracking } from "@/hooks/use-tracking";

const MenuButton = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="menu-toggle h-10 w-10 hover:bg-transparent"
      aria-label="Menu"
    >
      <Menu className="!h-6 !w-6" strokeWidth={1.75} />
    </Button>
  );
};

const DashboardLayout = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  usePageTracking();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-2 border-b border-rule-soft bg-background px-3 shrink-0 md:px-6">
            <div className="flex min-w-0 items-center">
              <MenuButton />
              <span className="ml-2 truncate font-brand text-[0.8125rem] font-semibold tracking-[0.04em] text-primary md:hidden">{t("appName")}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 md:gap-3">
              <InstallButton />
              <LanguageSwitcher variant="horizontal" />
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
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
