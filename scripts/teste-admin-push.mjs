// Teste no navegador do botão Admin + Central de mensagens + push (21/11/2026, Noé).
// TODO o Supabase é simulado (page.route): nada vai para a produção, nenhuma senha é usada.
// Uso:
//   VITE_PUSH_PREVIEW=1 npx vite build --outDir /tmp/fc-admin-push-dist
//   npx vite preview --outDir /tmp/fc-admin-push-dist --port 3178 &
//   node scripts/teste-admin-push.mjs [http://localhost:3178] [pasta-dos-prints]
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";

const BASE = process.argv[2] || "http://localhost:3178";
const PRINTS = process.argv[3] || path.resolve("../direcoes-identidade/prints/admin-push");
fs.mkdirSync(PRINTS, { recursive: true });
const ADMIN = "dono@teste.fc";
const CLIENTE = "cliente@teste.fc";
const REF = "rwyyggtsjbwnwzsnlkgy";

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwtFalso = (email) => `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({ sub: "11111111-1111-1111-1111-111111111111", email, role: "authenticated", exp: 4102444800 })}.assinatura-falsa`;
const sessaoFalsa = (email) => JSON.stringify({
  access_token: jwtFalso(email), refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: 4102444800,
  user: { id: "11111111-1111-1111-1111-111111111111", aud: "authenticated", role: "authenticated", email, email_confirmed_at: "2026-11-01T00:00:00Z", app_metadata: {}, user_metadata: {} },
});

/** Supabase simulado. `admin` = e-mail que a RPC session_admin_email devolve (null = não é admin). */
function simular(page, { admin = null, envios = [] } = {}) {
  const chamadas = [];
  page.route(/\.supabase\.co\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const corpo = req.postDataJSON?.() ?? null;
    chamadas.push({ path: url.pathname, corpo });
    const json = (b, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(b) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    if (url.pathname.endsWith("/rpc/app_access_info")) return json({ status: "ok", plan: null, idiomas_liberados: false });
    if (url.pathname.endsWith("/rpc/app_access_status")) return json("ok");
    if (url.pathname.endsWith("/rpc/session_admin_email")) return json(admin);
    if (url.pathname.endsWith("/rpc/is_session_admin")) return json(!!admin);
    if (url.pathname.endsWith("/rpc/push_inscrever")) return json("ok");
    if (url.pathname.endsWith("/rpc/admin_dashboard_stats")) return json({ total_users: 120, blocked_users: 2, active_users_7d: 48, usage_today: 15, usage_7d: 210, total_cache: 900, total_usage: 5400, total_prayers: 33 });
    if (url.pathname.endsWith("/functions/v1/push-send")) {
      const a = corpo?.acao;
      if (a === "status") return json({ ok: true, configurado: true, projeto: "fc-teste", aparelhos: 37 });
      if (a === "historico") return json({ ok: true, envios });
      if (a === "contar") {
        const p = corpo.publico;
        const r = p.tipo === "email" ? { pessoas: 1, aparelhos: 2, rotulo: `Só um e-mail (teste): ${p.email}` } : { pessoas: 31, aparelhos: 37, rotulo: "Todos com acesso" };
        return json({ ok: true, ...r });
      }
      if (a === "enviar") {
        envios.unshift({ id: 1, criado_em: new Date().toISOString(), criado_por: ADMIN, titulo: corpo.titulo, texto: corpo.texto, link: corpo.link, publico_rotulo: "Só um e-mail (teste): " + corpo.publico.email, pessoas: 1, aparelhos: 2, status: "enviado", enviados: 2, falhas: 0, removidos: 0, abertos: 0 });
        return json({ ok: true, envio: 1, status: "enviado", enviados: 2, falhas: 0, removidos: 0, pessoas: 1 });
      }
      return json({ ok: false, error: "acao_desconhecida" }, 400);
    }
    if (url.pathname.includes("/functions/v1/")) return json({});
    return json([]);
  });
  return chamadas;
}

async function contexto(browser, { tipo, email, admin, lembrado, sessao }) {
  const base = tipo === "iphone" ? devices["iPhone 13"] : tipo === "android" ? devices["Pixel 7"] : {};
  const viewport = tipo === "desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  // O perfil "iPhone 13" do Playwright vem com iOS 15 (sem push na web); aqui usamos iOS 17.5.
  const ua = tipo === "iphone" ? { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" } : {};
  const ctx = await browser.newContext({ ...base, ...ua, viewport, locale: "pt-BR" });
  await ctx.addInitScript(({ email, lembrado, sessao, REF }) => {
    if (sessionStorage.getItem("fc-teste-iniciado")) return; // só na 1ª carga: depois o app manda
    sessionStorage.setItem("fc-teste-iniciado", "1");
    localStorage.setItem("fc-sermon-auth-email", email);
    localStorage.setItem("fc-idioma-manual", "pt-BR");
    localStorage.setItem("i18nextLng", "pt-BR");
    if (lembrado) localStorage.setItem("fc-admin-lembrado", lembrado);
    if (sessao) localStorage.setItem(`sb-${REF}-auth-token`, sessao);
  }, { email, lembrado, sessao: sessao ?? null, REF });
  const page = await ctx.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(String(e)));
  const chamadas = simular(page, { admin });
  return { ctx, page, erros, chamadas };
}

const print = (page, nome, fullPage = false) => page.screenshot({ path: path.join(PRINTS, nome), fullPage });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const resultados = [];
const ok = (m) => { resultados.push(`ok  ${m}`); console.log(`ok  ${m}`); };

try {
  // 1) Celular Android, admin pela sessão: convite + sininho; menu com Admin; troca direta para o painel.
  {
    const { ctx, page, erros } = await contexto(browser, { tipo: "android", email: ADMIN, admin: ADMIN, sessao: sessaoFalsa(ADMIN) });
    await page.goto(BASE + "/");
    await page.getByRole("heading", { name: "Ative as notificações" }).waitFor();
    ok("celular: convite de notificações aparece");
    assert.equal(await page.locator('[data-push-estado="pode-ativar"]').filter({ visible: true }).count(), 1);
    ok("celular: sininho no topo (estado pode-ativar)");
    await print(page, "01-celular-convite-e-sininho.png");
    await page.getByRole("button", { name: "Menu" }).first().click();
    const admin = page.getByRole("link", { name: /^Admin/ });
    await admin.waitFor();
    ok("celular: botão Admin no menu (admin_users pela sessão)");
    await print(page, "02-celular-menu-com-admin.png");
    await admin.click();
    await page.getByRole("heading", { name: "Painel de Administração" }).first().waitFor({ timeout: 10000 }).catch(() => {});
    await page.waitForURL(/fc-control-panel/);
    assert.equal(await page.locator('input[type="password"]').count(), 0, "não pode pedir senha na sessão");
    ok("celular: Admin abre o painel direto, sem senha");
    await page.locator("header button").first().click(); // abre a lateral do painel
    await page.getByRole("button", { name: "Notificações" }).click();
    await page.getByText("Firebase pronto · fc-teste").waitFor();
    ok("celular: aba Notificações com selo do Firebase");
    await page.getByLabel("Título").fill("Rute chegou na Jornada");
    await page.getByLabel("Mensagem").fill("O mapa interativo de Rute já está no app. Toque para abrir.");
    await page.getByTestId("push-contagem").getByText("1 pessoa(s)").waitFor();
    await print(page, "03-celular-admin-notificacoes.png", true);
    await page.locator('header a[href="/"]').click();
    await page.waitForURL(BASE + "/");
    await page.getByRole("heading", { name: "Ative as notificações" }).waitFor();
    ok("celular: Voltar ao app volta para a Início");
    assert.deepEqual(erros, []);
    await ctx.close();
  }

  // 2) iPhone fora da Tela de Início: o sininho explica que precisa instalar primeiro.
  {
    const { ctx, page, erros } = await contexto(browser, { tipo: "iphone", email: CLIENTE, admin: null });
    await page.goto(BASE + "/");
    await page.getByRole("heading", { name: "Primeiro, instale o app" }).waitFor();
    ok("iPhone: convite pede para instalar primeiro");
    await page.locator('[data-push-estado="ios-instalar"]').filter({ visible: true }).click();
    await page.getByRole("dialog").getByText("Adicionar à Tela de Início").waitFor();
    await print(page, "04-iphone-instalar-primeiro.png");
    ok("iPhone: janela do sininho com o passo a passo");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Menu" }).first().click();
    await page.getByRole("button", { name: "Sair" }).waitFor();
    assert.equal(await page.getByRole("link", { name: /^Admin/ }).count(), 0);
    ok("cliente: menu sem botão Admin");
    await print(page, "05-cliente-menu-sem-admin.png");
    assert.deepEqual(erros, []);
    await ctx.close();
  }

  // 3) Computador: Dock com Admin, painel com prévia, confirmação, envio e histórico.
  {
    const { ctx, page, erros, chamadas } = await contexto(browser, { tipo: "desktop", email: ADMIN, admin: ADMIN, sessao: sessaoFalsa(ADMIN) });
    await page.goto(BASE + "/");
    const dockAdmin = page.locator('.dock a[href="/fc-control-panel"]');
    await dockAdmin.waitFor();
    ok("computador: ícone Admin no Dock");
    assert.equal(await page.locator('header [data-push-estado]').filter({ visible: true }).count(), 1);
    ok("computador: sininho no cabeçalho");
    await dockAdmin.hover();
    await page.waitForTimeout(700);
    await print(page, "06-computador-dock-admin.png");
    await dockAdmin.click();
    await page.waitForURL(/fc-control-panel/);
    await page.getByRole("button", { name: "Notificações" }).click();
    await page.getByLabel("Título").fill("Rute chegou na Jornada");
    await page.getByLabel("Mensagem").fill("O mapa interativo de Rute já está no app. Toque para abrir.");
    await page.getByLabel("Ao tocar, abre").selectOption("/jornada");
    await page.getByTestId("push-contagem").getByText("1 pessoa(s)").waitFor();
    await print(page, "07-computador-notificacoes-previa.png", true);
    ok("computador: prévia iPhone/Android e contagem");
    await page.getByLabel("Todos com acesso").check();
    await page.getByTestId("push-contagem").getByText("31 pessoa(s)").waitFor();
    ok("computador: contagem muda com o público (31 pessoas)");
    await page.getByLabel("Só um e-mail (teste)").check();
    await page.getByTestId("push-contagem").getByText("1 pessoa(s)").waitFor();
    await page.getByRole("button", { name: "Enviar teste" }).click();
    await page.getByRole("alertdialog").getByText("Tem certeza? Vai para 1 pessoa(s).").waitFor();
    await print(page, "08-computador-confirmacao.png");
    ok("computador: confirmação com o número de pessoas");
    await page.getByRole("button", { name: "Sim, enviar para 1" }).click();
    await page.getByRole("cell", { name: /Rute chegou na Jornada/ }).waitFor();
    await print(page, "09-computador-historico.png", true);
    ok("computador: envio aparece no histórico");
    const envio = chamadas.find((c) => c.corpo?.acao === "enviar")?.corpo;
    assert.equal(envio.confirmar, 1);
    assert.equal(envio.link, "/jornada");
    assert.equal(envio.creds._admin_email, ADMIN);
    assert.equal(envio.creds._admin_password, "");
    ok("computador: pedido de envio leva confirmar=1, link /jornada e sessão sem senha");
    assert.deepEqual(erros, []);
    await ctx.close();
  }

  // 4) Login antigo (sem sessão): o painel pede e-mail + senha e tem "Voltar ao app".
  {
    const { ctx, page, erros } = await contexto(browser, { tipo: "desktop", email: CLIENTE, admin: null });
    await page.goto(BASE + "/fc-control-panel");
    await page.locator('input[type="password"]').waitFor();
    await page.getByRole("link", { name: "Voltar ao app" }).waitFor();
    await print(page, "10-login-antigo-do-painel.png");
    ok("sem sessão: login antigo do painel continua, com Voltar ao app");
    assert.equal(await page.locator('.dock a[href="/fc-control-panel"]').count(), 0);
    await page.getByRole("link", { name: "Voltar ao app" }).click();
    await page.locator(".dock").waitFor();
    assert.equal(await page.locator('.dock a[href="/fc-control-panel"]').count(), 0);
    ok("cliente: Dock sem Admin");
    assert.deepEqual(erros, []);
    await ctx.close();
  }

  // 5) Service worker do PWA: continua registrado, com o push-sw importado; push entregue vira notificação.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.grantPermissions(["notifications"], { origin: BASE });
    const page = await ctx.newPage();
    simular(page, {});
    await ctx.addInitScript(() => { localStorage.setItem("fc-sermon-auth-email", "cliente@teste.fc"); localStorage.setItem("fc-idioma-manual", "pt-BR"); });
    await page.goto(BASE + "/");
    const sw = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return { script: reg.active?.scriptURL ?? "", escopo: reg.scope };
    });
    assert.match(sw.script, /\/sw\.js$/);
    ok(`PWA: service worker ${new URL(sw.script).pathname} ativo (escopo ${new URL(sw.escopo).pathname})`);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("ServiceWorker.enable");
    const regId = await new Promise((resolve) => {
      cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => { const r = e.registrations.find((x) => !x.isDeleted); if (r) resolve(r.registrationId); });
    });
    await cdp.send("ServiceWorker.deliverPushMessage", {
      origin: new URL(BASE).origin, registrationId: regId,
      data: JSON.stringify({ data: { titulo: "Teste do FC", texto: "Chegou pelo service worker", link: "/jornada", envio: "9", tag: "fc-9" } }),
    });
    let notas = [];
    for (let i = 0; i < 20 && !notas.length; i++) {
      await page.waitForTimeout(250);
      notas = await page.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ t: n.title, b: n.body, d: n.data })));
    }
    assert.equal(notas[0]?.t, "Teste do FC");
    assert.equal(notas[0]?.b, "Chegou pelo service worker");
    assert.equal(notas[0]?.d?.link, "/jornada");
    ok("PWA: push entregue ao service worker vira notificação com título, texto e link");
    await ctx.close();
  }

  // 6) Token REAL do Firebase do FC (só com firebase-ferramentas-do-cristao.json presente e TOKEN_REAL=1).
  //    A gravação no banco continua simulada; o token não é impresso.
  if (process.env.TOKEN_REAL === "1") {
    // Contexto comum do Playwright é anônimo, e o Chrome anônimo não tem Push API: aqui vai um perfil temporário.
    const perfil = fs.mkdtempSync(path.join((await import("node:os")).tmpdir(), "fc-push-perfil-"));
    const ctx = await chromium.launchPersistentContext(perfil, { channel: "chrome", headless: true, viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await ctx.grantPermissions(["notifications"], { origin: BASE });
    await ctx.addInitScript(() => { localStorage.setItem("fc-sermon-auth-email", "cliente@teste.fc"); localStorage.setItem("fc-idioma-manual", "pt-BR"); });
    const page = ctx.pages()[0] ?? await ctx.newPage();
    const chamadas = simular(page, {});
    page.on("console", (m) => { if (/push|messaging/i.test(m.text())) console.log("   console:", m.text().replace(/[A-Za-z0-9_:-]{100,}/g, "<token>").slice(0, 300)); });
    await page.goto(BASE + "/");
    await page.getByRole("button", { name: "Ativar notificações" }).click();
    await page.getByRole("heading", { name: "Ativar notificações" }).waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
    let ins = null;
    for (let i = 0; i < 120 && !ins; i++) { await page.waitForTimeout(500); ins = chamadas.find((c) => c.path.endsWith("/rpc/push_inscrever"))?.corpo; }
    assert.ok(ins, "push_inscrever não foi chamado");
    assert.match(ins._token, /^[A-Za-z0-9_:-]{100,}$/);
    assert.equal(ins._email, "cliente@teste.fc");
    assert.equal(ins._lang, "pt-BR");
    ok(`Firebase: token real gerado (${ins._token.length} caracteres) e enviado para push_inscrever`);
    assert.equal(await page.locator('header [data-push-estado="ativo"]').filter({ visible: true }).count(), 1);
    ok("Firebase: sininho fica no estado ativo");
    await ctx.close();
    fs.rmSync(perfil, { recursive: true, force: true });
  }
} finally {
  await browser.close();
}
console.log(`\n${resultados.length} conferências ok · prints em ${PRINTS}`);
