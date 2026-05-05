import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Activity, Brain, ShieldAlert, TrendingUp, Calendar } from "lucide-react";

type Stats = {
  total_users: number;
  blocked_users: number;
  total_cache: number;
  total_prayers: number;
  total_usage: number;
  usage_today: number;
  usage_7d: number;
  active_users_7d: number;
};

type ToolRow = { tool: string; uses: number };
type UserRow = { email: string; uses: number; last_seen: string };

interface Props {
  creds: { _admin_email: string; _admin_password: string };
}

const StatCard = ({ icon: Icon, label, value, hint }: any) => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="font-display text-3xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</div>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const DashboardSection = ({ creds }: Props) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, t, u] = await Promise.all([
        supabase.rpc("admin_dashboard_stats", creds),
        supabase.rpc("admin_top_tools", { ...creds, _days: days }),
        supabase.rpc("admin_top_users", { ...creds, _days: days }),
      ]);
      if (s.data) setStats(s.data as Stats);
      if (t.data) setTools((t.data as any) || []);
      if (u.data) setUsers((u.data as any) || []);
      setLoading(false);
    };
    load();
  }, [days]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const maxToolUses = Math.max(...tools.map((t) => Number(t.uses)), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Usuários" value={stats.total_users} hint={`${stats.blocked_users} bloqueados`} />
        <StatCard icon={Activity} label="Ativos (7d)" value={stats.active_users_7d} hint="usuários únicos" />
        <StatCard icon={Calendar} label="Usos hoje" value={stats.usage_today} />
        <StatCard icon={TrendingUp} label="Usos (7d)" value={stats.usage_7d} />
        <StatCard icon={Brain} label="Cache do gerador" value={stats.total_cache} hint="economia de tokens" />
        <StatCard icon={Activity} label="Total de usos" value={stats.total_usage} />
        <StatCard icon={ShieldAlert} label="Bloqueados" value={stats.blocked_users} />
        <StatCard icon={Users} label="Pedidos no mural" value={stats.total_prayers} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              days === d
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold text-primary mb-4">🔥 Ferramentas mais usadas</h3>
          {tools.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="space-y-3">
              {tools.map((t) => (
                <div key={t.tool} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t.tool}</span>
                    <span className="text-muted-foreground">{Number(t.uses).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(Number(t.uses) / maxToolUses) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold text-primary mb-4">👑 Usuários mais ativos</h3>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u, i) => (
                <div key={u.email} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Última vez: {new Date(u.last_seen).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0 ml-2">
                    {Number(u.uses).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
