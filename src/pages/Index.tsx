import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, FolderOpen, Search, Heart, Sparkles, MessageCircle, Users, Zap, Mic, Library, TrendingUp, Play } from "lucide-react";
import { appLogo } from "@/lib/branding";
import { getLastRead, libraryStats } from "@/data/library";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const language = i18n.resolvedLanguage || i18n.language;
  const lastRead = getLastRead(language);
  const stats = libraryStats();

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
    <div className="flex flex-col items-center px-4 py-8 md:py-12 md:px-8">
      {/* Logo */}
      <div className="w-28 h-28 md:w-36 md:h-36 mb-3 animate-fade-in">
        <img src={appLogo(language)} alt={t("appName")} className="w-full h-full object-contain" />
      </div>

      {/* Tagline */}
      <div className="w-full max-w-md mb-8">
        <div className="gold-border rounded-lg py-2 px-4 text-center bg-primary/10">
          <p className="text-sm font-medium text-primary">
            {t("appName")}
          </p>
        </div>
      </div>

      {/* Progresso do leitor */}
      {(lastRead || stats.completed > 0) && (
        <div className="w-full max-w-3xl mb-8 grid gap-4 md:grid-cols-2 animate-fade-in">
          {lastRead && (
            <div className={`rounded-xl border border-border bg-card p-5 ${!stats.completed ? "md:col-span-2" : ""}`}>
              <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
                <Play className="h-3.5 w-3.5" />{t("dashboard.continueReading")}
              </p>
              <h3 className="font-display text-lg font-bold text-foreground">{lastRead.volumeTitle}</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                {lastRead.productTitle} • {t("livraria.reader.chapterOf", { current: lastRead.chapter, total: lastRead.totalChapters })}
              </p>
              <Progress value={lastRead.progress} className="mb-4 h-2" />
              <Button asChild size="sm">
                <Link to={`/livraria/${lastRead.productSlug}/${lastRead.volumeSlug}`}>{t("dashboard.open")}</Link>
              </Button>
            </div>
          )}
          {stats.completed > 0 && (
            <div className={`rounded-xl border border-border bg-card p-5 ${!lastRead ? "md:col-span-2" : ""}`}>
              <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
                <TrendingUp className="h-3.5 w-3.5" />{t("dashboard.growth")}
              </p>
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("dashboard.booksCompleted", { done: stats.completed, total: stats.total })}
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">{Math.round((stats.completed / stats.total) * 100)}%</p>
              <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
            </div>
          )}
        </div>
      )}

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
