// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  caber, chaveCache, esquemaResposta, mensagemUsuario, idiomasParaTraduzir, lerRespostaTraducao, MODELO_TRADUCAO, pedidoAnthropic, promptSistema, validarTraducoes,
} from "../../supabase/functions/push-send/traducao";
import { filtrarPublico, lerPublico, LIMITES, rotuloPublico, type Acesso } from "../../supabase/functions/push-send/publico";
import { chaveDoItem, chaveOrigem, erroDoItem, idiomasTraduzidos, OUTROS, planoDeEnvio } from "../components/admin/notificacoes-idiomas";

const resposta = (obj: unknown, extra: Record<string, unknown> = {}) => ({
  stop_reason: "end_turn", content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify(obj) }], ...extra,
});

describe("tradução: idiomas e pedido", () => {
  it("só traduz idiomas válidos, sem pt-BR, sem repetir, na ordem da lista", () => {
    expect(idiomasParaTraduzir(["de", "pt-BR", "en", "en", "xx", 3])).toEqual(["en", "de"]);
    expect(idiomasParaTraduzir(["pt-BR"])).toEqual([]);
    expect(idiomasParaTraduzir("en")).toEqual([]);
  });

  it("uma chamada só, Haiku, JSON Schema com exatamente os idiomas pedidos", () => {
    const p = pedidoAnthropic("Rute no mapa", "Toque para abrir 🙏 /jornada", ["pt-PT", "en"]);
    expect(p.model).toBe(MODELO_TRADUCAO);
    expect(MODELO_TRADUCAO).toBe("claude-haiku-5-5");
    expect(p.messages).toHaveLength(1);
    expect(p.messages[0].content).toContain("Rute no mapa");
    expect(p.output_config.format.type).toBe("json_schema");
    expect(p.output_config.format.schema).toEqual(esquemaResposta(["pt-PT", "en"]));
    expect(esquemaResposta(["en"])).toMatchObject({ required: ["en"], additionalProperties: false });
    // Regras do pedido do dono no prompt: limites, emojis/links, nomes bíblicos, pt-PT leve.
    const s = promptSistema();
    expect(s).toContain(`${LIMITES.titulo} characters`);
    expect(s).toContain(`${LIMITES.texto} characters`);
    expect(s).toMatch(/emoji/i);
    expect(s).toMatch(/Biblical names/);
    expect(s).toMatch(/pt-PT/);
  });

  it("glossário: só os nomes de seção que aparecem no texto, só nos idiomas pedidos", () => {
    const m = mensagemUsuario("Novidade na Jornada", "Abra o Mural de Oração", ["fr", "de"]);
    expect(m).toContain(`"Jornada": fr "Voyage", de "Reise"`);
    expect(m).toContain(`"Mural de Oração": fr "Mur de Prière"`);
    expect(m).not.toContain("Oficina");
    expect(m).not.toContain("Journey");
    expect(mensagemUsuario("Bom dia", "Paz", ["en"])).not.toContain("App section names");
  });

  it("chave do cache: mesmo texto + mesmos idiomas (qualquer ordem) = mesma chave", () => {
    expect(chaveCache(" Oi ", "Texto", ["en", "de"])).toBe(chaveCache("Oi", "Texto ", ["de", "en"]));
    expect(chaveCache("Oi", "Texto", ["en"])).not.toBe(chaveCache("Oi", "Texto", ["en", "de"]));
    expect(chaveCache("Oi", "Texto", ["en"])).not.toBe(chaveCache("Oi!", "Texto", ["en"]));
  });
});

describe("tradução: leitura da resposta", () => {
  const ok = { en: { titulo: "Ruth on the map", texto: "Tap to open 🙏" }, de: { titulo: " Rut auf der Karte ", texto: "Tippen 🙏" } };

  it("aceita JSON completo e tira espaços", () => {
    const r = lerRespostaTraducao(resposta(ok), ["en", "de"]);
    expect(r).toEqual({ ok: true, traducoes: { en: ok.en, de: { titulo: "Rut auf der Karte", texto: "Tippen 🙏" } } });
  });

  it("aceita JSON dentro de cerca de código", () => {
    const r = lerRespostaTraducao({ stop_reason: "end_turn", content: [{ type: "text", text: "```json\n" + JSON.stringify(ok) + "\n```" }] }, ["en"]);
    expect(r.ok).toBe(true);
  });

  it("falta idioma, campo vazio, formato errado, recusa, corte = erro (nada é enviado)", () => {
    expect(lerRespostaTraducao(resposta({ en: ok.en }), ["en", "fr"])).toEqual({ ok: false, erro: "traducao_incompleta", idioma: "fr" });
    expect(lerRespostaTraducao(resposta({ en: { titulo: "", texto: "x" } }), ["en"])).toMatchObject({ ok: false, erro: "traducao_incompleta" });
    expect(lerRespostaTraducao({ content: [{ type: "text", text: "não é json" }] }, ["en"])).toEqual({ ok: false, erro: "traducao_invalida" });
    expect(lerRespostaTraducao(resposta([1, 2]), ["en"])).toEqual({ ok: false, erro: "traducao_invalida" });
    expect(lerRespostaTraducao({ content: [] }, ["en"])).toEqual({ ok: false, erro: "traducao_vazia" });
    expect(lerRespostaTraducao(null, ["en"])).toEqual({ ok: false, erro: "traducao_vazia" });
    expect(lerRespostaTraducao(resposta(ok, { stop_reason: "refusal" }), ["en"])).toEqual({ ok: false, erro: "traducao_recusada" });
    expect(lerRespostaTraducao(resposta(ok, { stop_reason: "max_tokens" }), ["en"])).toEqual({ ok: false, erro: "traducao_cortada" });
  });

  it("passou do limite: encaixa sem cortar palavra (o dono revisa antes de enviar)", () => {
    const longo = "Palavra ".repeat(40).trim();
    const r = validarTraducoes({ en: { titulo: longo, texto: longo } }, ["en"]);
    if (!r.ok) throw new Error("esperava ok");
    expect(r.traducoes.en.titulo.length).toBeLessThanOrEqual(LIMITES.titulo);
    expect(r.traducoes.en.texto.length).toBeLessThanOrEqual(LIMITES.texto);
    expect(r.traducoes.en.titulo.endsWith("Palavra")).toBe(true);
    expect(caber("curto", 10)).toBe("curto");
    expect(caber("x".repeat(20), 10)).toBe("x".repeat(10));
  });
});

describe("público: outros idiomas (foraIdiomas)", () => {
  const agora = Date.parse("2026-11-21T12:00:00Z");
  const acessos = new Map<string, Acesso>(["a", "b", "c", "d"].map((e) => [`${e}@x.com`, { plan: "br_mensal", bloqueado: false, expires_at: null, idiomas_liberados: false }]));
  const ins = [
    { email: "a@x.com", token: "ta", lang: "pt-BR" },
    { email: "b@x.com", token: "tb", lang: "en" },
    { email: "c@x.com", token: "tc", lang: "fr" },
    { email: "d@x.com", token: "td", lang: null },
  ];

  it("fora dos idiomas marcados recebe; idioma desconhecido também", () => {
    const p = lerPublico({ tipo: "todos", foraIdiomas: ["pt-BR", "en"] })!;
    expect(filtrarPublico(ins, acessos, p, agora).tokens).toEqual(["tc", "td"]);
    expect(rotuloPublico(p)).toBe("Todos com acesso · outros idiomas (fora pt-BR, en)");
  });

  it("idiomas e foraIdiomas juntos não valem", () => {
    expect(lerPublico({ tipo: "todos", idiomas: ["en"], foraIdiomas: ["de"] })).toBeNull();
  });
});

describe("plano de envio por idioma", () => {
  const origem = { titulo: "Rute no mapa", texto: "Toque para abrir." };
  const versoes = { en: { titulo: "Ruth on the map", texto: "Tap to open." } };

  it("um envio por idioma marcado; pt-BR sai como o dono escreveu", () => {
    const itens = planoDeEnvio({ tipo: "todos", plano: "br", marcados: ["en", "pt-BR"], outrosEmPt: false, origem, versoes });
    expect(itens.map((i) => i.id)).toEqual(["pt-BR", "en"]);
    expect(itens[0]).toMatchObject({ titulo: origem.titulo, texto: origem.texto, publico: { tipo: "todos", idiomas: ["pt-BR"] } });
    expect(itens[1]).toMatchObject({ titulo: "Ruth on the map", publico: { tipo: "todos", idiomas: ["en"] } });
  });

  it("idioma não marcado fica de fora, a menos que 'outros em português' esteja ligado", () => {
    const sem = planoDeEnvio({ tipo: "plano", plano: "intl", marcados: ["en"], outrosEmPt: false, origem, versoes });
    expect(sem.map((i) => i.id)).toEqual(["en"]);
    const com = planoDeEnvio({ tipo: "plano", plano: "intl", marcados: ["en"], outrosEmPt: true, origem, versoes });
    expect(com.map((i) => i.id)).toEqual(["en", OUTROS]);
    expect(com[1]).toMatchObject({ titulo: origem.titulo, publico: { tipo: "plano", plano: "intl", foraIdiomas: ["en"] } });
  });

  it("versão sem tradução não pode ser enviada", () => {
    const [, de] = planoDeEnvio({ tipo: "todos", plano: "br", marcados: ["pt-BR", "de"], outrosEmPt: false, origem, versoes });
    expect(erroDoItem(de, "/")).toBe("titulo_vazio");
    expect(erroDoItem({ ...de, titulo: "Rut", texto: "x".repeat(LIMITES.texto + 1) }, "/")).toBe("texto_longo");
    expect(erroDoItem({ ...de, titulo: "Rut", texto: "Tippen" }, "/")).toBeNull();
  });

  it("chaves auxiliares", () => {
    expect(idiomasTraduzidos(["de", "pt-BR", "pt-PT"])).toEqual(["pt-PT", "de"]);
    expect(chaveOrigem({ titulo: " a ", texto: "b" })).toBe(chaveOrigem({ titulo: "a", texto: "b " }));
    const k = chaveDoItem("0b7e9a52-1111-4222-8333-944455556666", "pt-BR");
    expect(k).toMatch(/^[A-Za-z0-9-]{8,64}$/);
    expect(k).not.toBe(chaveDoItem("0b7e9a52-1111-4222-8333-944455556666", "pt-PT"));
  });
});
