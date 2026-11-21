import { describe, expect, it } from "vitest";
import { resumirPlanos, saudacao, somaSerie } from "@/components/admin/admin-numeros";

const AGORA = new Date("2026-11-21T15:00:00").getTime();

describe("Início do painel: contas", () => {
  it("separa ativos por plano e deixa vencidos e bloqueados de fora", () => {
    const r = resumirPlanos([
      { plan: "br_mensal", bloqueado: false, expires_at: "2026-12-21T00:00:00Z" },
      { plan: "BR_anual", bloqueado: false, expires_at: null },
      { plan: "intl_anual", bloqueado: false, expires_at: null },
      { plan: null, bloqueado: false, expires_at: null },
      { plan: "manual", bloqueado: false, expires_at: null },
      { plan: "FC-3M", bloqueado: false, expires_at: null },
      { plan: "br_mensal", bloqueado: false, expires_at: "2026-11-01T00:00:00Z" },
      { plan: "br_mensal", bloqueado: true, expires_at: null },
    ], AGORA);
    expect(r).toEqual({ ativos: 6, brasil: 2, internacional: 1, listaAntiga: 2, outros: 1, vencidos: 1, bloqueados: 1, total: 8 });
  });

  it("soma a série e separa o dia de hoje", () => {
    const hoje = new Date("2026-11-21T10:00:00");
    expect(somaSerie([{ day: "2026-11-20", n: 3 }, { day: "2026-11-21", n: 2 }], hoje)).toEqual({ total: 5, hoje: 2 });
    expect(somaSerie([], hoje)).toEqual({ total: 0, hoje: 0 });
  });

  it("cumprimenta pela hora", () => {
    expect(saudacao(new Date("2026-11-21T08:00:00"))).toBe("Bom dia");
    expect(saudacao(new Date("2026-11-21T14:00:00"))).toBe("Boa tarde");
    expect(saudacao(new Date("2026-11-21T21:00:00"))).toBe("Boa noite");
  });
});
