// @vitest-environment node
import { describe, expect, it } from "vitest";
import { assinarJwt, classificarFcm, emLotes, enviarFcm, lerContaServico, limparCacheToken, mensagemFcm } from "../../supabase/functions/push-send/fcm";
import { filtrarPublico, lerPublico, rotuloPublico, validarMensagem, type Acesso } from "../../supabase/functions/push-send/publico";

const b64urlDecode = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

async function contaDeTeste() {
  const par = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"],
  );
  const der = Buffer.from(await crypto.subtle.exportKey("pkcs8", par.privateKey)).toString("base64");
  const pem = `-----BEGIN PRIVATE KEY-----\n${der.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----\n`;
  return { conta: { project_id: "fc-teste", client_email: "fcm@fc-teste.iam.gserviceaccount.com", private_key: pem }, publica: par.publicKey };
}

describe("FCM HTTP v1", () => {
  it("lê a conta de serviço em JSON ou base64 e recusa o resto", async () => {
    const { conta } = await contaDeTeste();
    const json = JSON.stringify({ ...conta, type: "service_account" });
    expect(lerContaServico(json)?.project_id).toBe("fc-teste");
    expect(lerContaServico(Buffer.from(json).toString("base64"))?.client_email).toBe(conta.client_email);
    expect(lerContaServico("")).toBeNull();
    expect(lerContaServico("{}")).toBeNull();
    expect(lerContaServico(JSON.stringify({ ...conta, private_key: "nada" }))).toBeNull();
  });

  it("assina o JWT RS256 que o Google confere com a chave pública", async () => {
    const { conta, publica } = await contaDeTeste();
    const jwt = await assinarJwt(conta, 1_700_000_000);
    const [cab, corpo, ass] = jwt.split(".");
    expect(JSON.parse(b64urlDecode(cab).toString())).toEqual({ alg: "RS256", typ: "JWT" });
    const c = JSON.parse(b64urlDecode(corpo).toString());
    expect(c).toMatchObject({ iss: conta.client_email, aud: "https://oauth2.googleapis.com/token", iat: 1_700_000_000, exp: 1_700_003_600 });
    expect(c.scope).toBe("https://www.googleapis.com/auth/firebase.messaging");
    const valido = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publica, b64urlDecode(ass), new TextEncoder().encode(`${cab}.${corpo}`));
    expect(valido).toBe(true);
  });

  it("mensagem só com data + cabeçalhos web push e link absoluto do app", () => {
    const m = mensagemFcm("tok", { titulo: "Oi", texto: "Novo", link: "/biblia", envio: 7, tag: "fc-7", ping: "https://x.supabase.co/functions/v1/push-send" }, "https://app.ferramentasdocristao.com");
    expect(m.message.token).toBe("tok");
    expect(m.message.data).toEqual({ titulo: "Oi", texto: "Novo", link: "/biblia", envio: "7", tag: "fc-7", ping: "https://x.supabase.co/functions/v1/push-send" });
    expect(m.message).not.toHaveProperty("notification");
    expect(m.message.webpush.fcm_options.link).toBe("https://app.ferramentasdocristao.com/biblia");
    expect(m.message.webpush.headers.Topic).toBe("fc-7");
  });

  it("token morto é apagado; o resto é falha", () => {
    expect(classificarFcm(200, {}).tipo).toBe("ok");
    expect(classificarFcm(404, { error: { status: "NOT_FOUND" } }).tipo).toBe("invalido");
    expect(classificarFcm(400, { error: { status: "INVALID_ARGUMENT", details: [{ errorCode: "UNREGISTERED" }] } }).tipo).toBe("invalido");
    expect(classificarFcm(403, { error: { status: "PERMISSION_DENIED", details: [{ errorCode: "SENDER_ID_MISMATCH" }] } }).tipo).toBe("invalido");
    expect(classificarFcm(400, { error: { status: "INVALID_ARGUMENT", message: "The registration token is not a valid FCM registration token" } }).tipo).toBe("invalido");
    expect(classificarFcm(400, { error: { status: "INVALID_ARGUMENT", message: "payload grande" } }).tipo).toBe("falha");
    expect(classificarFcm(500, null)).toMatchObject({ tipo: "falha", erro: "http_500" });
  });

  it("envia com um OAuth só para o lote inteiro (FCM falso)", async () => {
    limparCacheToken();
    const { conta } = await contaDeTeste();
    const chamadas: string[] = [];
    const falso = (async (url: string, init?: RequestInit) => {
      chamadas.push(url);
      if (url.endsWith("/token")) return new Response(JSON.stringify({ access_token: "acesso", expires_in: 3600 }), { status: 200 });
      const corpo = JSON.parse(String(init?.body));
      expect((init?.headers as Record<string, string>).authorization).toBe("Bearer acesso");
      return corpo.message.token === "morto"
        ? new Response(JSON.stringify({ error: { status: "NOT_FOUND" } }), { status: 404 })
        : new Response("{}", { status: 200 });
    }) as typeof fetch;
    const tokens = ["a", "b", "morto", "c"];
    const r = await emLotes(tokens, 2, (t) => enviarFcm(conta, t, { titulo: "t", texto: "x", link: "/", envio: 1, tag: "fc-1" }, "https://app", "http://fcm.falso", falso));
    expect(r.map((x) => x.tipo)).toEqual(["ok", "ok", "invalido", "ok"]);
    expect(chamadas.filter((u) => u.endsWith("/token"))).toHaveLength(1);
    expect(chamadas.filter((u) => u.endsWith("/v1/projects/fc-teste/messages:send"))).toHaveLength(4);
  });
});

describe("OAuth recusado", () => {
  it("vira falha por aparelho, sem derrubar o lote", async () => {
    limparCacheToken();
    const { conta } = await contaDeTeste();
    const falso = (async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })) as typeof fetch;
    const r = await emLotes(["a", "b"], 2, (t) => enviarFcm(conta, t, { titulo: "t", texto: "x", link: "/", envio: 1, tag: "fc-1" }, "https://app", "http://fcm.falso", falso));
    expect(r.map((x) => [x.tipo, x.erro])).toEqual([["falha", "oauth"], ["falha", "oauth"]]);
  });
});

describe("público da Central de mensagens", () => {
  const agora = Date.parse("2026-11-21T12:00:00Z");
  const acessos = new Map<string, Acesso>([
    ["br@x.com", { plan: "br_mensal", bloqueado: false, expires_at: "2026-12-21T00:00:00Z", idiomas_liberados: false }],
    ["br2@x.com", { plan: "br_12m", bloqueado: false, expires_at: null, idiomas_liberados: true }],
    ["intl@x.com", { plan: "intl_mensal", bloqueado: false, expires_at: "2026-12-01T00:00:00Z", idiomas_liberados: false }],
    ["antigo@x.com", { plan: null, bloqueado: false, expires_at: null, idiomas_liberados: false }],
    ["venceu@x.com", { plan: "br_mensal", bloqueado: false, expires_at: "2026-11-01T00:00:00Z", idiomas_liberados: false }],
    ["bloq@x.com", { plan: "br_mensal", bloqueado: true, expires_at: null, idiomas_liberados: false }],
  ]);
  const ins = [
    { email: "br@x.com", token: "t1", lang: "pt-BR" },
    { email: "br@x.com", token: "t2", lang: "pt-BR" },
    { email: "br2@x.com", token: "t3", lang: "en" },
    { email: "intl@x.com", token: "t4", lang: "es" },
    { email: "antigo@x.com", token: "t5", lang: "pt-PT" },
    { email: "venceu@x.com", token: "t6", lang: "pt-BR" },
    { email: "bloq@x.com", token: "t7", lang: "pt-BR" },
    { email: "sumiu@x.com", token: "t8", lang: "pt-BR" },
  ];
  const f = (p: unknown) => filtrarPublico(ins, acessos, lerPublico(p)!, agora);

  it("todos = só quem tem acesso válido (sem vencido, bloqueado ou fora da lista)", () => {
    expect(f({ tipo: "todos" })).toEqual({ tokens: ["t1", "t2", "t3", "t4", "t5"], pessoas: 4, aparelhos: 5 });
  });
  it("por plano", () => {
    expect(f({ tipo: "plano", plano: "br" }).tokens).toEqual(["t1", "t2", "t3"]);
    expect(f({ tipo: "plano", plano: "intl" }).tokens).toEqual(["t4"]);
    expect(f({ tipo: "plano", plano: "idiomas" }).tokens).toEqual(["t3", "t4"]);
    expect(f({ tipo: "plano", plano: "sem_plano" }).tokens).toEqual(["t5"]);
    expect(f({ tipo: "plano", plano: "vencidos" }).tokens).toEqual(["t6"]);
  });
  it("por idioma, sozinho ou com plano", () => {
    expect(f({ tipo: "todos", idiomas: ["pt-BR"] }).tokens).toEqual(["t1", "t2"]);
    expect(f({ tipo: "plano", plano: "br", idiomas: ["en", "xx"] }).tokens).toEqual(["t3"]);
  });
  it("e-mail de teste: só esse e-mail, nunca bloqueado", () => {
    expect(f({ tipo: "email", email: " BR@x.com " })).toEqual({ tokens: ["t1", "t2"], pessoas: 1, aparelhos: 2 });
    expect(f({ tipo: "email", email: "bloq@x.com" }).aparelhos).toBe(0);
  });
  it("público inválido vira null", () => {
    expect(lerPublico(null)).toBeNull();
    expect(lerPublico({ tipo: "plano", plano: "qualquer" })).toBeNull();
    expect(lerPublico({ tipo: "email", email: "sem-arroba" })).toBeNull();
    expect(lerPublico({ tipo: "hack" })).toBeNull();
  });
  it("rótulo legível para o histórico", () => {
    expect(rotuloPublico({ tipo: "todos" })).toBe("Todos com acesso");
    expect(rotuloPublico({ tipo: "plano", plano: "br", idiomas: ["pt-BR"] })).toBe("Plano Brasil (br_*) · idioma pt-BR");
    expect(rotuloPublico({ tipo: "email", email: "a@b.co" })).toBe("Só um e-mail (teste): a@b.co");
  });
});

describe("validação da mensagem", () => {
  it("aceita link interno e recusa link de fora", () => {
    expect(validarMensagem({ titulo: " Oi ", texto: "Texto", link: "" })).toEqual({ ok: true, msg: { titulo: "Oi", texto: "Texto", link: "/" } });
    expect(validarMensagem({ titulo: "Oi", texto: "Texto", link: "/jornada/genesis" }).ok).toBe(true);
    for (const link of ["https://golpe.com", "//golpe.com", "/a b", "/\\golpe", "javascript:alert(1)"]) {
      expect(validarMensagem({ titulo: "Oi", texto: "T", link })).toEqual({ ok: false, erro: "link_fora_do_app" });
    }
  });
  it("título e texto obrigatórios e com limite", () => {
    expect(validarMensagem({ titulo: "", texto: "x" })).toEqual({ ok: false, erro: "titulo_vazio" });
    expect(validarMensagem({ titulo: "x".repeat(61), texto: "x" })).toEqual({ ok: false, erro: "titulo_longo" });
    expect(validarMensagem({ titulo: "x", texto: "  " })).toEqual({ ok: false, erro: "texto_vazio" });
    expect(validarMensagem({ titulo: "x", texto: "x".repeat(181) })).toEqual({ ok: false, erro: "texto_longo" });
  });
});
