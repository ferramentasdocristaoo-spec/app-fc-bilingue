import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstallButton from "@/components/InstallButton";
import { usePageTracking } from "@/hooks/use-tracking";

const DashboardLayout = () => {
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
              <SidebarTrigger className="text-primary" />
              <span className="ml-3 font-display text-sm font-bold text-primary md:hidden">FC Sermon</span>
            </div>
            <div className="flex items-center gap-2">
              <InstallButton />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-primary hover:bg-primary/10"
                title={theme === "dark" ? "Modo claro" : "Modo escuro"}
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
