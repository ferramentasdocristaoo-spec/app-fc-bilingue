import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, FolderOpen, Heart, Library, TrendingUp, Play, Quote, ScrollText, Lock, ChevronRight, Hammer } from "lucide-react";
import { appLogo } from "@/lib/branding";
import { getLastRead, libraryProducts, libraryStats, type LibraryProduct } from "@/data/library";
import { fetchDailyVerse, type DailyVerse } from "@/lib/daily-verse";
import { BookCover } from "@/components/library/BookCover";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface Sermao {
  titulo: string;
  tema: string;
  status: string;
  data: string;
}

const Index = () => {
  const { t, i18n } = useTranslation();
  const { email } = useAuth();
  const language = i18n.resolvedLanguage || i18n.language;
  const lastRead = getLastRead(language);
  const stats = libraryStats();

  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [locked, setLocked] = useState<LibraryProduct[]>([]);

  const sermoes: Sermao[] = (() => {
    try {
      return (JSON.parse(localStorage.getItem("fc-sermoes") || "[]") as Sermao[]).slice(0, 3);
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    fetchDailyVerse(language).then(setVerse);
  }, [language]);

  useEffect(() => {
    const products = libraryProducts(language);
    if (!email) {
      setLocked(products.slice(0, 3));
      return;
    }
    Promise.all(
      products.map(async (product) => {
        const { data, error } = await supabase.rpc("has_library_access", { _email: email, _product_slug: product.slug });
        return { product, has: data === true, failed: Boolean(error) };
      }),
    ).then((results) => {
      // Em caso de falha de rede não mostramos a vitrine com dados errados.
      if (results.some((r) => r.failed)) return setLocked([]);
      setLocked(results.filter((r) => !r.has).map((r) => r.product).slice(0, 3));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, language]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("dashboard.goodMorning") : hour < 18 ? t("dashboard.goodAfternoon") : t("dashboard.goodEvening");
  const dateLabel = new Date().toLocaleDateString(language, { weekday: "long", day: "numeric", month: "long" });
  const bookNames = t("biblia.books", { returnObjects: true }) as string[];

  const shortcuts = [
    { icon: Hammer, label: t("sidebar.oficina.title"), path: "/oficina" },
    { icon: BookOpen, label: t("sidebar.biblia.title"), path: "/biblia" },
    { icon: Heart, label: t("sidebar.devocional.title"), path: "/devocional" },
    { icon: Library, label: t("sidebar.livraria.title"), path: "/livraria" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">
      {/* Saudação */}
      <header className="mb-6 flex items-center gap-4 animate-fade-in">
        <img src={appLogo(language)} alt={t("appName")} className="h-16 w-16 object-contain md:h-20 md:w-20" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{greeting}</h1>
          <p className="text-sm capitalize text-muted-foreground">{dateLabel}</p>
        </div>
      </header>

      {/* Atalhos rápidos */}
      <div className="mb-6 grid grid-cols-4 gap-2 md:gap-3 animate-fade-in">
        {shortcuts.map((s) => (
          <Link key={s.path} to={s.path} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition hover:border-primary/50 hover:shadow-md">
            <s.icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium leading-tight text-foreground">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Versículo do dia */}
      {verse && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5 animate-fade-in">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Quote className="h-3.5 w-3.5" />{t("dashboard.verseOfDay")}
          </p>
          <blockquote className="font-display text-base leading-relaxed text-foreground md:text-lg">
            “{verse.text}”
          </blockquote>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">
              {bookNames[verse.book - 1]} {verse.chapter}:{verse.verse}
            </p>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link to="/biblia">{t("dashboard.readInBible")}<ChevronRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      )}

      {/* Leitura: continuar + crescimento */}
      {(lastRead || stats.completed > 0) && (
        <div className="mb-6 grid gap-4 md:grid-cols-2 animate-fade-in">
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

      {/* Últimos esboços */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5 animate-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <ScrollText className="h-3.5 w-3.5" />{t("dashboard.recentOutlines")}
          </p>
          {sermoes.length > 0 && (
            <Link to="/esbocos" className="flex items-center text-xs text-muted-foreground hover:text-primary">
              {t("sidebar.esbocos.title")}<ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {sermoes.length === 0 ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{t("dashboard.noOutlines")}</p>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/oficina"><FolderOpen className="h-4 w-4" />{t("dashboard.createSermon")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sermoes.map((s, index) => (
              <li key={index}>
                <Link to="/esbocos" className="flex items-center justify-between gap-3 py-2.5 transition hover:text-primary">
                  <span className="truncate text-sm font-medium text-foreground">{s.titulo || t("esbocos.defaultTitle")}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.data}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Vitrine: materiais ainda não adquiridos */}
      {locked.length > 0 && (
        <div className="animate-fade-in">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
              <Lock className="h-3.5 w-3.5" />{t("dashboard.discover")}
            </p>
            <Link to="/livraria" className="flex items-center text-xs text-muted-foreground hover:text-primary">
              {t("livraria.title")}<ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((product) => (
              <Link key={product.slug} to="/livraria" className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-md">
                <BookCover title={product.title} className="mx-auto mb-3 h-40 w-28" />
                <h3 className="text-center text-sm font-semibold leading-tight text-foreground group-hover:text-primary">{product.title}</h3>
                <p className="mt-1 text-center text-[11px] text-muted-foreground">
                  {t("livraria.badge", { count: product.volumes.length })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
