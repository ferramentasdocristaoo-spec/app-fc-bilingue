import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Clock, Calendar, UserPlus, Repeat, DollarSign, Info } from "lucide-react";
import { costFor, labelFor } from "./cost-map";

interface Props {
  creds: { _admin_email: string; _admin_password: string };
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const Card = ({ title, icon: Icon, children, hint }: any) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-primary">{title}</h3>
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
    {children}
  </div>
);

const AnalyticsSection = ({ creds }: Props) => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [byDay, setByDay] = useState<{ day: string; uses: number }[]>([]);
  const [byHour, setByHour] = useState<{ hour: number; uses: number }[]>([]);
  const [byWeekday, setByWeekday] = useState<{ weekday: number; uses: number }[]>([]);
  const [growth, setGrowth] = useState<{ day: string; new_users: number }[]>([]);
  const [retention, setRetention] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<{ action: string; total: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [d, h, w, g, r, c] = await Promise.all([
        supabase.rpc("admin_usage_by_day", { ...creds, _days: days }),
        supabase.rpc("admin_usage_by_hour", { ...creds, _days: days }),
        supabase.rpc("admin_usage_by_weekday", { ...creds, _days: days }),
        supabase.rpc("admin_user_growth", { ...creds, _days: days }),
        supabase.rpc("admin_retention_stats", { ...creds, _days: days }),
        supabase.rpc("admin_cache_stats", creds),
      ]);
      setByDay((d.data as any) || []);
      setByHour((h.data as any) || []);
      setByWeekday((w.data as any) || []);
      setGrowth((g.data as any) || []);
      setRetention(r.data);
      setCacheStats((c.data as any) || []);
      setLoading(false);
    };
    load();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const maxDay = Math.max(...byDay.map((d) => Number(d.uses)), 1);
  const maxHour = Math.max(...byHour.map((h) => Number(h.uses)), 1);
  const maxWeek = Math.max(...byWeekday.map((w) => Number(w.uses)), 1);
  const maxGrowth = Math.max(...growth.map((g) => Number(g.new_users)), 1);

  const totalUses = byDay.reduce((a, b) => a + Number(b.uses), 0);
  const avgPerDay = byDay.length ? Math.round(totalUses / days) : 0;
  const peakDay = byDay.reduce<any>((acc, d) => (Number(d.uses) > Number(acc?.uses ?? 0) ? d : acc), null);
  const peakHour = byHour.reduce<any>((acc, h) => (Number(h.uses) > Number(acc?.uses ?? 0) ? h : acc), null);

  // Weekday alinhado dom-sáb
  const weekMap = new Map(byWeekday.map((w) => [w.weekday, Number(w.uses)]));
  const weekdayData = WEEKDAYS.map((label, i) => ({ label, uses: weekMap.get(i) || 0 }));

  // Cost breakdown
  const costBreakdown = cacheStats
    .map((s) => ({
      action: s.action,
      label: labelFor(s.action),
      hits: Number(s.total),
      unitCost: costFor(s.action),
      saved: Number(s.total) * costFor(s.action),
    }))
    .sort((a, b) => b.saved - a.saved);
  const totalSaved = costBreakdown.reduce((a, b) => a + b.saved, 0);
  const totalHits = costBreakdown.reduce((a, b) => a + b.hits, 0);

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Período:</span>
        {[7, 30, 90, 180].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              days === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Média/dia</p>
          <p className="font-display text-2xl font-bold mt-1">{avgPerDay}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Pico em 1 dia</p>
          <p className="font-display text-2xl font-bold mt-1">{Number(peakDay?.uses || 0)}</p>
          <p className="text-[10px] text-muted-foreground truncate">{peakDay?.day ? new Date(peakDay.day).toLocaleDateString("pt-BR") : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Hora de pico</p>
          <p className="font-display text-2xl font-bold mt-1">{peakHour ? `${peakHour.hour}h` : "—"}</p>
          <p className="text-[10px] text-muted-foreground">{Number(peakHour?.uses || 0)} usos</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Total no período</p>
          <p className="font-display text-2xl font-bold mt-1">{totalUses.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* Tendência diária */}
      <Card title="Tendência de uso por dia" icon={TrendingUp} hint={`${days} dias`}>
        {byDay.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {byDay.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                <div
                  className="w-full bg-primary/70 hover:bg-primary rounded-t transition"
                  style={{ height: `${(Number(d.uses) / maxDay) * 100}%`, minHeight: "2px" }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border border-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10 shadow-lg">
                  {new Date(d.day).toLocaleDateString("pt-BR")}: {d.uses}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Hora do dia */}
        <Card title="Distribuição por hora do dia" icon={Clock}>
          <div className="flex items-end gap-0.5 h-32">
            {Array.from({ length: 24 }, (_, i) => {
              const v = byHour.find((h) => h.hour === i);
              const uses = Number(v?.uses || 0);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-primary/60 hover:bg-primary rounded-t transition"
                    style={{ height: `${(uses / maxHour) * 100}%`, minHeight: uses > 0 ? "3px" : "0" }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
            <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>
        </Card>

        {/* Dia da semana */}
        <Card title="Distribuição por dia da semana" icon={Calendar}>
          <div className="flex items-end gap-2 h-32">
            {weekdayData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-muted-foreground">{d.uses}</div>
                <div
                  className="w-full bg-primary/70 rounded-t"
                  style={{ height: `${(d.uses / maxWeek) * 100}%`, minHeight: d.uses > 0 ? "3px" : "0" }}
                />
                <div className="text-[10px] text-muted-foreground font-medium">{d.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Crescimento */}
      <Card title="Novos usuários por dia" icon={UserPlus}>
        {growth.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem novos usuários no período.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {growth.map((g) => (
              <div key={g.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-emerald-500/70 hover:bg-emerald-500 rounded-t transition"
                  style={{ height: `${(Number(g.new_users) / maxGrowth) * 100}%`, minHeight: "2px" }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border border-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10 shadow-lg">
                  {new Date(g.day).toLocaleDateString("pt-BR")}: +{g.new_users}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Retenção */}
      {retention && (
        <Card title="Engajamento dos usuários" icon={Repeat} hint={`últimos ${days} dias`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">1 vez só</p>
              <p className="font-display text-2xl font-bold mt-1">{retention.one_time || 0}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Casuais (2-5)</p>
              <p className="font-display text-2xl font-bold mt-1">{retention.casual || 0}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-[10px] uppercase text-primary">Regulares (6-20)</p>
              <p className="font-display text-2xl font-bold mt-1 text-primary">{retention.regular || 0}</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3 text-center">
              <p className="text-[10px] uppercase text-amber-600 dark:text-amber-500">Power (20+)</p>
              <p className="font-display text-2xl font-bold mt-1 text-amber-600 dark:text-amber-500">{retention.power || 0}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Inativos</p>
              <p className="font-display text-2xl font-bold mt-1 text-muted-foreground">{retention.inactive_users || 0}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Média de <strong>{retention.avg_uses || 0}</strong> usos por usuário ativo no período.
          </p>
        </Card>
      )}

      {/* Economia detalhada */}
      <Card title="Economia detalhada por ferramenta" icon={DollarSign} hint="cálculo refinado">
        <div className="space-y-3">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Economia total estimada</p>
                <p className="font-display text-3xl font-bold text-primary mt-1">~${totalSaved.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{totalHits.toLocaleString("pt-BR")} cache hits</p>
                <p className="text-xs text-muted-foreground">média ${totalHits ? (totalSaved / totalHits).toFixed(4) : "0"}/hit</p>
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2">Ferramenta</th>
                <th className="py-2 text-right">Hits</th>
                <th className="py-2 text-right">Custo unitário</th>
                <th className="py-2 text-right">Economizado</th>
              </tr>
            </thead>
            <tbody>
              {costBreakdown.map((c) => (
                <tr key={c.action} className="border-b border-border/50">
                  <td className="py-2 font-medium">{c.label}</td>
                  <td className="py-2 text-right text-muted-foreground">{c.hits.toLocaleString("pt-BR")}</td>
                  <td className="py-2 text-right text-muted-foreground text-xs">${c.unitCost.toFixed(4)}</td>
                  <td className="py-2 text-right font-bold text-primary">${c.saved.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-lg bg-muted/40 border border-border p-3 flex gap-2">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong>Como calculamos:</strong> cada tipo tem um custo médio próprio baseado no tamanho típico de prompt + resposta no <em>gpt-4o-mini</em> ($0.15/1M input + $0.60/1M output). Por exemplo: Esboço de Sermão (~$0.0042/chamada) é mais caro que Significado de Nomes (~$0.0006/chamada). Isso aproxima muito mais a realidade do que uma média única.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsSection;
