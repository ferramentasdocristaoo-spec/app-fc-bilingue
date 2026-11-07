import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, FolderOpen, Search, Heart, Sparkles, MessageCircle, Users, Zap, Home, Mic, LogOut, Library, Map } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";

// Item do menu: sem "pílula"; o ativo ganha um filete dourado à esquerda.
const NAV_ITEM = "h-9 rounded-none pl-3 text-[0.9375rem] text-sidebar-foreground/80 hover:bg-transparent hover:text-sidebar-accent-foreground data-[active=true]:bg-transparent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-[inset_2px_0_0_hsl(var(--sidebar-primary))] [&>svg]:opacity-70";
const GROUP_LABEL = "text-sidebar-foreground/50 text-[0.6875rem] font-medium uppercase tracking-[0.14em]";

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { signOut, email } = useAuth();
  const { setOpenMobile } = useSidebar();
  // No celular o menu cobre a página: fecha ao trocar de tela.
  useEffect(() => { setOpenMobile(false); }, [location.pathname, setOpenMobile]);

  const preparationItems = [
    { icon: BookOpen, title: t("sidebar.oficina.title"), description: t("sidebar.oficina.description"), path: "/oficina" },
    { icon: FolderOpen, title: t("sidebar.esbocos.title"), description: t("sidebar.esbocos.description"), path: "/esbocos" },
    { icon: Users, title: t("sidebar.pulpito.title"), description: t("sidebar.pulpito.description"), path: "/pulpito" },
  ];
  const studyItems = [
    { icon: BookOpen, title: t("sidebar.biblia.title"), description: t("sidebar.biblia.description"), path: "/biblia" },
    { icon: Map, title: t("journey.title"), description: t("journey.sidebarDescription"), path: "/jornada" },
    { icon: Zap, title: t("sidebar.raioX.title"), description: t("sidebar.raioX.description"), path: "/raio-x" },
    { icon: Search, title: t("sidebar.nomes.title"), description: t("sidebar.nomes.description"), path: "/nomes" },
    { icon: Sparkles, title: t("sidebar.garimpo.title"), description: t("sidebar.garimpo.description"), path: "/garimpo" },
    { icon: Library, title: t("sidebar.livraria.title"), description: t("sidebar.livraria.description"), path: "/livraria" },
  ];
  const connectionItems = [
    { icon: Heart, title: t("sidebar.devocional.title"), description: t("sidebar.devocional.description"), path: "/devocional" },
    { icon: MessageCircle, title: t("sidebar.mural.title"), description: t("sidebar.mural.description"), path: "/mural" },
    { icon: Mic, title: t("sidebar.voz.title"), description: t("sidebar.voz.description"), path: "/voz-de-deus" },
  ];

  const renderItems = (items: typeof preparationItems) => items.map((item) => (
    <SidebarMenuItem key={item.path}>
      <SidebarMenuButton asChild className={NAV_ITEM} isActive={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}>
        <NavLink to={item.path}><item.icon className="h-4 w-4" /><span>{item.title}</span></NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-6 pb-4 flex flex-col items-center gap-3 text-center">
        <img src={appLogo(i18n.resolvedLanguage || i18n.language)} alt={t("appName")} className="w-14 h-14 object-contain shrink-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8" />
        <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
          <h2 className="font-brand text-[0.8125rem] font-semibold tracking-[0.06em] text-sidebar-primary leading-snug">{t("appName")}</h2>
          <p className="mt-1 font-serif italic text-xs text-sidebar-foreground/60">{t("subtitle")}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={NAV_ITEM} isActive={location.pathname === "/"}>
                  <NavLink to="/" end>
                    <Home className="h-4 w-4" />
                    <span>{t("sidebar.home")}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className={GROUP_LABEL}>{t("workspace.groups.preparation")}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(preparationItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className={GROUP_LABEL}>{t("workspace.groups.study")}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(studyItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className={GROUP_LABEL}>{t("workspace.groups.life")}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(connectionItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-sidebar-foreground/70 hover:bg-transparent hover:text-sidebar-accent-foreground">
              <LogOut className="h-4 w-4" />
              <span>{t("sidebar.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {email && (
          <p className="text-xs text-sidebar-foreground/60 truncate px-2 group-data-[collapsible=icon]:hidden">
            {email}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
