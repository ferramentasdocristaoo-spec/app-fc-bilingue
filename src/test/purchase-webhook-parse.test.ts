import { describe, expect, it } from "vitest";
import { aplicarPlanos, calcularValidade, lerCompra, normalizarEvento } from "../../supabase/functions/purchase-webhook/parse";

// Payload no formato que a KawaiPay dispara (dispatch-webhooks): events[0] + order_bumps/upsells no topo.
const kawaipay = (event_key: string, extra: Record<string, unknown> = {}, data: Record<string, unknown> = {}) => ({
  webhook_name: "FC bilíngue",
  timestamp: "2026-11-14T18:00:00.000Z",
  events: [{
    event_key,
    event_name: { compra_aprovada: "Compra aprovada", compra_recusada: "Compra recusada", reembolso: "Reembolso" }[event_key] ?? event_key,
    data: {
      order_id: "KP-1001",
      product_id: "7f2c0c6e-0000-4000-8000-000000000001",
      product_sku: "FC-BR-MENSAL",
      product_name: "FC · Mensal",
      customer_first_name: "Maria",
      customer_email: "Maria.Silva@Exemplo.com",
      status: event_key === "compra_aprovada" ? "paid" : "refused",
      ...data,
    },
  }],
  order_bumps: [],
  upsells: [],
  ...extra,
});

const planos = {
  mensal: { sku: "FC-BR-MENSAL", plan_name: "br_mensal", months: 1, unlocks_languages: false },
  anual: { sku: "FC-BR-12M", plan_name: "br_12m", months: 12, unlocks_languages: false },
  idiomas: { sku: "FC-ADICIONAL-IDIOMAS", plan_name: "adicional_idiomas", months: 0, unlocks_languages: true },
  intl: { sku: "FC-INTL-MENSAL", plan_name: "intl_mensal", months: 1, unlocks_languages: true },
};

describe("purchase-webhook · leitura do payload da KawaiPay", () => {
  it("compra_aprovada libera, com e-mail normalizado e os dois identificadores do produto", () => {
    const c = lerCompra(kawaipay("compra_aprovada"));
    expect(c.acao).toBe("liberar");
    expect(c.evento).toBe("compra_aprovada");
    expect(c.email).toBe("maria.silva@exemplo.com");
    expect(c.itens).toEqual([{ candidatos: ["FC-BR-MENSAL", "7f2c0c6e-0000-4000-8000-000000000001"], origem: "principal" }]);
  });

  it("assinatura_renovada (evento próprio da renovação) também libera", () => {
    expect(lerCompra(kawaipay("assinatura_renovada", {}, { status: "paid" })).acao).toBe("liberar");
  });

  it("reembolso e chargeback bloqueiam", () => {
    expect(lerCompra(kawaipay("reembolso", {}, { status: "refunded" })).acao).toBe("bloquear");
    expect(lerCompra(kawaipay("chargeback", {}, { status: "charged_back" })).acao).toBe("bloquear");
  });

  it("compra_recusada, pix_gerado, carrinho_abandonado e assinatura_cancelada são ignorados", () => {
    for (const ev of ["compra_recusada", "pix_gerado", "carrinho_abandonado", "assinatura_cancelada", "assinatura_atrasada", "boleto_gerado"]) {
      expect(lerCompra(kawaipay(ev)).acao, ev).toBe("ignorar");
    }
  });

  it("order bump do adicional de idiomas entra como item separado; bump reembolsado não entra", () => {
    const c = lerCompra(kawaipay("compra_aprovada", {
      order_bumps: [
        { product_id: "bump-uuid", product_sku: "FC-ADICIONAL-IDIOMAS", product_name: "Idiomas", amount: 5, status: "paid" },
        { product_id: "bump-2", product_sku: "OUTRO", status: "refunded" },
      ],
      upsells: [{ product_id: "up-1", product_sku: "FC-BR-12M", status: "paid" }],
    }));
    expect(c.itens.map((i) => i.origem)).toEqual(["principal", "bump", "upsell"]);
    expect(c.itens[1].candidatos).toEqual(["FC-ADICIONAL-IDIOMAS", "bump-uuid"]);
  });

  it("sem event_key, usa o event_name ('Compra aprovada' → compra_aprovada)", () => {
    expect(normalizarEvento({ event_name: "Compra aprovada" })).toBe("compra_aprovada");
    expect(normalizarEvento({ event_name: "Reembolso" })).toBe("reembolso");
    const body = kawaipay("compra_aprovada") as { events: Array<Record<string, unknown>> };
    delete body.events[0].event_key;
    expect(lerCompra(body).acao).toBe("liberar");
  });

  it("corpo embrulhado ({ body: {...} }) e lista ([{ body }]) são lidos igual", () => {
    expect(lerCompra({ body: kawaipay("compra_aprovada") }).email).toBe("maria.silva@exemplo.com");
    expect(lerCompra([{ body: kawaipay("compra_aprovada") }]).acao).toBe("liberar");
  });

  it("formatos antigos: campo direto, Hotmart e Kiwify continuam liberando", () => {
    expect(lerCompra({ email: "a@b.com", sku: "KS1" })).toMatchObject({ acao: "liberar", email: "a@b.com", itens: [{ candidatos: ["KS1"], origem: "principal" }] });
    const hotmart = lerCompra({ data: { buyer: { email: "H@x.com" }, purchase: { offer: { code: "OF1" } }, product: { id: 99 } } });
    expect(hotmart.email).toBe("h@x.com");
    expect(hotmart.itens[0].candidatos).toEqual(expect.arrayContaining(["OF1", "99"]));
    expect(lerCompra({ Customer: { email: "k@x.com" }, Product: { id: "P1" } })).toMatchObject({ acao: "liberar", email: "k@x.com" });
  });

  it("payload vazio ou estranho nunca lança: vira 'ignorar'", () => {
    expect(lerCompra(null).acao).toBe("ignorar");
    expect(lerCompra("texto").acao).toBe("ignorar");
    expect(lerCompra({ events: [] }).acao).toBe("ignorar");
  });
});

describe("purchase-webhook · validade e planos", () => {
  const agora = new Date("2026-11-14T12:00:00.000Z");

  it("compra nova: validade conta de hoje", () => {
    expect(calcularValidade(null, 1, agora)).toBe("2026-12-14T12:00:00.000Z");
    expect(calcularValidade(null, 12, agora)).toBe("2027-11-14T12:00:00.000Z");
  });

  it("renovação antes de vencer: estende a partir da validade atual (não perde dias)", () => {
    expect(calcularValidade("2026-11-20T12:00:00.000Z", 1, agora)).toBe("2026-12-20T12:00:00.000Z");
  });

  it("renovação depois de vencida: conta de hoje", () => {
    expect(calcularValidade("2026-10-01T12:00:00.000Z", 3, agora)).toBe("2027-02-14T12:00:00.000Z");
  });

  it("dia 31 + 1 mês cai no último dia do mês seguinte", () => {
    expect(calcularValidade(null, 1, new Date("2027-01-31T12:00:00.000Z"))).toBe("2027-02-28T12:00:00.000Z");
  });

  it("aplicarPlanos: plano mensal novo", () => {
    expect(aplicarPlanos(null, [planos.mensal], agora)).toEqual({ plan: "br_mensal", expires_at: "2026-12-14T12:00:00.000Z", idiomas_liberados: false, sku: "FC-BR-MENSAL" });
  });

  it("aplicarPlanos: mensal + bump de idiomas → validade do mensal e idiomas ligados", () => {
    const r = aplicarPlanos(null, [planos.mensal, planos.idiomas], agora);
    expect(r).toMatchObject({ plan: "br_mensal", expires_at: "2026-12-14T12:00:00.000Z", idiomas_liberados: true, sku: "FC-BR-MENSAL" });
  });

  it("aplicarPlanos: só o adicional de idiomas não mexe na validade nem no plano", () => {
    const atual = { plan: "br_12m", expires_at: "2027-06-01T00:00:00.000Z", idiomas_liberados: false };
    expect(aplicarPlanos(atual, [planos.idiomas], agora)).toEqual({ plan: "br_12m", expires_at: "2027-06-01T00:00:00.000Z", idiomas_liberados: true, sku: "FC-ADICIONAL-IDIOMAS" });
  });

  it("aplicarPlanos: plano internacional libera os idiomas", () => {
    expect(aplicarPlanos(null, [planos.intl], agora)).toMatchObject({ plan: "intl_mensal", idiomas_liberados: true });
  });

  it("aplicarPlanos: SKU desconhecido → null (nada liberado)", () => {
    expect(aplicarPlanos(null, [], agora)).toBeNull();
  });
});
