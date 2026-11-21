import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BellRing, Brain, Map, Search, Send, UserPlus, Users } from "lucide-react";
import { getJourneyAiUsage, type JourneyAiUsage } from "@/features/bible-journey/editorial-generator";
import { costFor } from "./cost-map";
import { resumirPlanos, saudacao, somaSerie, type LinhaAcesso, type ResumoPlanos } from "./admin-numeros";
import { EsqueletoKpis, Esqueleto, Kpi, Periodo, Vazio, fmt, quando } from "./admin-ui";
import type { Tab } from "@/pages/AdminPage";

type Stats = {
  total_users: number; blocked_users: number; total_cache: number; total_prayers: number;
  total_usage: number; usage_today: number; usage_7d: number; active_users_7d: number;
};
type ToolRow = { tool: string; uses: number };
type UserRow = { email: string; uses: number; last_seen: string };
type Envio = { titulo: string; criado_em: string; enviados: number; status: string; publico_rotulo: string | null };
type Push = { aparelhos: number | null; configurado: boolean; ultimo: Envio | null; indisponivel: boolean };

interface Props {
  creds: { _admin_email: string; _admin_password: string };
  onIr: (tab: Tab, opts?: { buscar?: boolean }) => void;
}

const PAGINA = 1000;
const MAX_PAGINAS = 20;

/** Lê todos os acessos pela mesma RPC da aba Assinantes (só leitura, de 1000 em 1000). */
async function lerAcessos(creds: Props["creds"]): Promise<LinhaAcesso[] | null> {
  const todas: LinhaAcesso[] = [];
  for (let p = 0; p < MAX_PAGINAS; p++) {
    const { data, error } = await supabase.rpc("admin_list_emails_paginated", { ...creds, _search: "", _limit: PAGINA, _offset: p * PAGINA });
    if (error) return null;
    const lista = (data as LinhaAcesso[]) || [];
    todas.push(...lista);
    if (lista.length < PAGINA) break;
  }
  return todas;
}

async function lerPush(creds: Props["creds"]): Promise<Push> {
  const chamar = async (acao: string) => {
    const { data, error } = await supabase.functions.invoke("push-send", { body: { acao, creds } });
    return error || !data?.ok ? null : data;
  };
  const [s, h] = await Promise.all([chamar("status"), chamar("historico")]);
  return {
    aparelhos: s ? Number(s.aparelhos ?? 0) : null,
    configurado: !!s?.configurado,
    ultimo: (h?.envios?.[0] as Envio | undefined) ?? null,
    indisponivel: !s,
  };
}

const hoje = () => new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase());

const DashboardSection = ({ creds, onIr }: Props) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [planos, setPlanos] = useState<ResumoPlanos | null>(null);
  const [novos, setNovos] = useState<{ total: number; hoje: number } | null>(null);
  const [push, setPush] = useState<Push | null>(null);
  const [ia, setIa] = useState<JourneyAiUsage | null>(null);
  const [economia, setEconomia] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const [days, setDays] = useState(30);
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rankCarregando, setRankCarregando] = useState(true);

  // Números-chave (uma vez por abertura). Cada fonte falha sozinha: o cartão mostra "—" e uma dica.
  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setErro(false);
    (async () => {
      const [s, acessos, g, c] = await Promise.all([
        supabase.rpc("admin_dashboard_stats", creds),
        lerAcessos(creds),
        supabase.rpc("admin_user_growth", { ...creds, _days: 30 }),
        supabase.rpc("admin_cache_stats", creds),
      ]);
      if (!vivo) return;
      if (s.error && !acessos) { setErro(true); setCarregando(false); return; }
      setStats((s.data as Stats) ?? null);
      setPlanos(acessos ? resumirPlanos(acessos) : null);
      setNovos(g.error ? null : somaSerie(((g.data as { day: string; new_users: number }[]) || []).map((x) => ({ day: x.day, n: x.new_users }))));
      setEconomia(c.error ? null : ((c.data as { action: string; total: number }[]) || []).reduce((a, x) => a + Number(x.total) * costFor(x.action), 0));
      setCarregando(false);
      // Mais lentas e opcionais: chegam depois, sem segurar o resto.
      lerPush(creds).then((p) => vivo && setPush(p)).catch(() => vivo && setPush({ aparelhos: null, configurado: false, ultimo: null, indisponivel: true }));
      getJourneyAiUsage(creds).then((u) => vivo && setIa(u)).catch(() => {});
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa]);

  useEffect(() => {
    let vivo = true;
    setRankCarregando(true);
    Promise.all([
      supabase.rpc("admin_top_tools", { ...creds, _days: days }),
      supabase.rpc("admin_top_users", { ...creds, _days: days }),
    ]).then(([t, u]) => {
      if (!vivo) return;
      setTools((t.data as ToolRow[]) || []);
      setUsers((u.data as UserRow[]) || []);
      setRankCarregando(false);
    });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const maxPlano = planos ? Math.max(planos.brasil, planos.internacional, planos.listaAntiga, planos.outros, 1) : 1;
  const linhasPlano = planos ? [
    { rotulo: "Plano Brasil", n: planos.brasil },
    { rotulo: "Internacional", n: planos.internacional },
    { rotulo: "Lista antiga (sem plano)", n: planos.listaAntiga },
    ...(planos.outros ? [{ rotulo: "Outros planos", n: planos.outros }] : []),
  ] : [];

  return (
    <div>
      <header className="adm-head">
        <span className="adm-eyebrow">{hoje()}</span>
        <h1 className="adm-h1">{saudacao()}!</h1>
        <p className="adm-lede">O que importa hoje no Ferramentas do Cristão, num lugar só.</p>
      </header>

      <div className="adm-quick">
        <button type="button" className="adm-q adm-q-main" onClick={() => onIr("notificacoes")}>
          <span className="adm-tile"><Send aria-hidden="true" /></span>Enviar notificação
        </button>
        <button type="button" className="adm-q" onClick={() => onIr("users", { buscar: true })}>
          <span className="adm-tile"><Search aria-hidden="true" /></span>Buscar assinante
        </button>
        <button type="button" className="adm-q" onClick={() => onIr("jornada")}>
          <span className="adm-tile"><Map aria-hidden="true" /></span>Jornada
        </button>
      </div>

      {carregando ? <EsqueletoKpis n={5} /> : erro ? (
        <div className="adm-card">
          <Vazio tipo="erro" titulo="Não deu para carregar os números" texto="A conexão caiu ou a sessão de admin expirou."
            acao={<button type="button" className="adm-chip" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</button>} />
        </div>
      ) : (
        <div className="adm-kpis">
          <Kpi icon={Users} label="Assinantes ativos" value={fmt(planos?.ativos)} wide onClick={() => onIr("users")}
            hint={planos ? `${fmt(planos.vencidos)} vencidos · ${fmt(planos.bloqueados)} bloqueados${stats ? ` · ${fmt(stats.active_users_7d)} usaram nos últimos 7 dias` : ""}` : "Lista de assinantes indisponível agora."}>
            {planos && (
              <div className="adm-plans">
                {linhasPlano.map((l) => (
                  <div key={l.rotulo} className="adm-plan">
                    <span>{l.rotulo}</span><b>{fmt(l.n)}</b>
                    <span className="adm-bar" aria-hidden="true"><i style={{ width: `${(l.n / maxPlano) * 100}%` }} /></span>
                  </div>
                ))}
              </div>
            )}
          </Kpi>
          <Kpi icon={UserPlus} label="Novos acessos (30 dias)" value={fmt(novos?.total)}
            hint={novos ? <><span className="adm-pill">+{fmt(novos.hoje)} hoje</span><br />Compras e liberações. Valores em reais ficam no KawaiPay.</> : "—"} />
          <Kpi icon={BellRing} label="Com notificação" onClick={() => onIr("notificacoes")}
            value={push ? fmt(push.aparelhos) : "…"}
            hint={!push ? "Conferindo…" : push.indisponivel ? "Função de envio ainda não publicada." : push.configurado ? "aparelhos com notificação ligada" : "Falta ligar o Firebase no servidor."} />
          <Kpi icon={Brain} label="IA da Jornada hoje" value={ia ? `${fmt(ia.used)} de ${fmt(ia.limit)}` : "—"}
            hint={economia != null ? `O cache já poupou ≈ US$ ${economia.toFixed(2).replace(".", ",")}` : "Gerações de capítulo usadas hoje."} />
          <Kpi icon={Send} label="Último envio" onClick={() => onIr("notificacoes")}
            hint={push?.ultimo ? `${quando(push.ultimo.criado_em)} · ${fmt(push.ultimo.enviados)} entregues` : push ? "Nenhuma notificação enviada ainda." : "Conferindo…"}>
            {push?.ultimo && <span className="adm-kpi-text">{push.ultimo.titulo}</span>}
          </Kpi>
        </div>
      )}

      <div style={{ marginTop: 26 }}><Periodo dias={days} opcoes={[7, 30, 90]} onChange={setDays} /></div>

      <div className="adm-grid2">
        <section>
          <h2 className="adm-sec">Ferramentas mais abertas</h2>
          <div className="adm-list">
            {rankCarregando ? <div className="adm-row"><Esqueleto linhas={3} /></div> : tools.length === 0 ? (
              <Vazio titulo="Sem uso no período" texto="Quando os assinantes abrirem as ferramentas, elas aparecem aqui." />
            ) : tools.map((t) => (
              <div key={t.tool} className="adm-row">
                <div className="adm-row-main"><b>{t.tool}</b></div>
                <span className="adm-row-num">{fmt(t.uses)}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="adm-sec">Assinantes mais ativos</h2>
          <div className="adm-list">
            {rankCarregando ? <div className="adm-row"><Esqueleto linhas={3} /></div> : users.length === 0 ? (
              <Vazio titulo="Ninguém ativo no período" texto="Experimente um período maior." />
            ) : users.map((u, i) => (
              <div key={u.email} className="adm-row">
                <span className="adm-rank">{i + 1}º</span>
                <div className="adm-row-main"><b>{u.email}</b><small>visto {quando(u.last_seen)}</small></div>
                <span className="adm-row-num">{fmt(u.uses)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardSection;
