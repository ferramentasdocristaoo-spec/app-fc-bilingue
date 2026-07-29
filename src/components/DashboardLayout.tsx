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
      className="h-9 w-9 text-primary hover:bg-primary/10"
      aria-label="Menu"
    >
      <Menu className="!h-6 !w-6" strokeWidth={2.4} />
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
          <header className="h-12 flex items-center justify-between border-b border-border px-4 shrink-0 md:px-6">
            <div className="flex items-center">
              <MenuButton />
              <span className="ml-3 font-display text-sm font-bold text-primary md:hidden">{t("appName")}</span>
            </div>
            <div className="flex items-center gap-2">
              <InstallButton />
              <LanguageSwitcher variant="horizontal" />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-primary hover:bg-primary/10"
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
