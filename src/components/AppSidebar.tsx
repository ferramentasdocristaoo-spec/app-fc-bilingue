import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, FolderOpen, Search, Heart, Sparkles, MessageCircle, Users, Zap, Home, Mic, LogOut, Library } from "lucide-react";
import { appLogo } from "@/lib/branding";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { signOut, email } = useAuth();

  const menuItems = [
    { icon: BookOpen, title: t("sidebar.oficina.title"), description: t("sidebar.oficina.description"), path: "/oficina" },
    { icon: FolderOpen, title: t("sidebar.esbocos.title"), description: t("sidebar.esbocos.description"), path: "/esbocos" },
    { icon: Zap, title: t("sidebar.raioX.title"), description: t("sidebar.raioX.description"), path: "/raio-x" },
    { icon: Heart, title: t("sidebar.devocional.title"), description: t("sidebar.devocional.description"), path: "/devocional" },
    { icon: Search, title: t("sidebar.nomes.title"), description: t("sidebar.nomes.description"), path: "/nomes" },
    { icon: Sparkles, title: t("sidebar.garimpo.title"), description: t("sidebar.garimpo.description"), path: "/garimpo" },
    { icon: MessageCircle, title: t("sidebar.mural.title"), description: t("sidebar.mural.description"), path: "/mural" },
    { icon: Mic, title: t("sidebar.voz.title"), description: t("sidebar.voz.description"), path: "/voz-de-deus" },
    { icon: Users, title: t("sidebar.pulpito.title"), description: t("sidebar.pulpito.description"), path: "/pulpito" },
    { icon: BookOpen, title: t("sidebar.biblia.title"), description: t("sidebar.biblia.description"), path: "/biblia" },
    { icon: Library, title: t("sidebar.livraria.title"), description: t("sidebar.livraria.description"), path: "/livraria" },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 flex items-center gap-3">
        <img src={appLogo(i18n.resolvedLanguage || i18n.language)} alt={t("appName")} className="w-10 h-10 object-contain shrink-0" />
        <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
          <h2 className="font-display text-sm font-bold text-primary leading-tight">{t("appName")}</h2>
          <p className="text-[10px] text-sidebar-foreground/60">{t("subtitle")}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            {t("sidebar.modules")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <NavLink to="/" end>
                    <Home className="h-4 w-4" />
                    <span>{t("sidebar.home")}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}>
                    <NavLink to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-sidebar-foreground/70 hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>{t("sidebar.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {email && (
          <p className="text-[10px] text-sidebar-foreground/60 truncate px-2 group-data-[collapsible=icon]:hidden">
            {email}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
