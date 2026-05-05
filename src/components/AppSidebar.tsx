import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, FolderOpen, Search, Heart, Sparkles, MessageCircle, Users, Zap, Home, Mic, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
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

export const menuItems = [
  { icon: BookOpen, title: "Oficina de Sermões", description: "Crie e organize seus esboços", path: "/oficina" },
  { icon: FolderOpen, title: "Meus Esboços", description: "Sua biblioteca pessoal", path: "/esbocos" },
  { icon: Zap, title: "Raio-X do Versículo", description: "Aprofunde seu entendimento", path: "/raio-x" },
  { icon: Heart, title: "Gerar Devocional", description: "Roteiro diário para comunhão", path: "/devocional" },
  { icon: Search, title: "Significado de Nomes", description: "Origem e propósito bíblico", path: "/nomes" },
  { icon: Sparkles, title: "Garimpo Bíblico", description: "Busca por temas específicos", path: "/garimpo" },
  { icon: MessageCircle, title: "Mural de Clamor", description: "Onde a comunidade intercede", path: "/mural" },
  { icon: Mic, title: "Voz de Deus", description: "Uma palavra para você", path: "/voz-de-deus" },
  { icon: Users, title: "Púlpito Compartilhado", description: "Troque inspirações", path: "/pulpito" },
  { icon: BookOpen, title: "Bíblia Sagrada", description: "Leia em diversas versões", path: "/biblia" },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, email } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 flex items-center gap-3">
        <img src={logo} alt="FC Sermon" className="w-10 h-10 object-contain shrink-0" />
        <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
          <h2 className="font-display text-sm font-bold text-primary leading-tight">FC Sermon</h2>
          <p className="text-[10px] text-muted-foreground">Ferramentas do Cristão</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-[10px] uppercase tracking-wider">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <NavLink to="/" end>
                    <Home className="h-4 w-4" />
                    <span>Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.path}>
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
            <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {email && (
          <p className="text-[10px] text-muted-foreground truncate px-2 group-data-[collapsible=icon]:hidden">
            {email}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
