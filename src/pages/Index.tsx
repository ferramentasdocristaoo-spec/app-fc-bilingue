import { Link } from "react-router-dom";
import { BookOpen, FolderOpen, Search, Heart, Sparkles, MessageCircle, Users, Zap, Mic } from "lucide-react";
import logo from "@/assets/logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { icon: BookOpen, title: "Oficina de Sermões", description: "Crie e organize seus esboços", path: "/oficina" },
  { icon: FolderOpen, title: "Meus Esboços", description: "Sua biblioteca pessoal de mensagens", path: "/esbocos" },
  { icon: Zap, title: "Raio-X do Versículo", description: "Aprofunde seu entendimento e contexto", path: "/raio-x" },
  { icon: Heart, title: "Gerar Devocional", description: "Roteiro diário para sua comunhão", path: "/devocional" },
  { icon: Search, title: "Significado de Nomes", description: "Origem e propósito bíblico", path: "/nomes" },
  { icon: Sparkles, title: "Garimpo Bíblico", description: "Busca avançada por temas específicos", path: "/garimpo" },
  { icon: MessageCircle, title: "Mural de Clamor", description: "Onde a comunidade intercede", path: "/mural" },
  { icon: Mic, title: "Voz de Deus", description: "Uma palavra profética para você", path: "/voz-de-deus" },
  { icon: Users, title: "Púlpito Compartilhado", description: "Troque inspirações e esboços", path: "/pulpito" },
  { icon: BookOpen, title: "Bíblia Sagrada", description: "Leia a Palavra em diversas versões", path: "/biblia" },
];

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col items-center px-4 py-8 md:py-12 md:px-8">
      {/* Logo */}
      <div className="w-28 h-28 md:w-36 md:h-36 mb-3 animate-fade-in">
        <img src={logo} alt="FC Sermon" className="w-full h-full object-contain" />
      </div>

      {/* Tagline */}
      <div className="w-full max-w-md mb-8">
        <div className="gold-border rounded-lg py-2 px-4 text-center bg-primary/10">
          <p className="text-sm font-medium text-primary">
            Sua oficina completa para a Palavra e o Reino.
          </p>
        </div>
      </div>

      {/* Menu Items - grid on desktop, list on mobile */}
      <div className={`w-full ${isMobile ? "max-w-sm flex flex-col gap-3" : "max-w-3xl grid grid-cols-2 lg:grid-cols-3 gap-4"}`}>
        {menuItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className="menu-card opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Index;
