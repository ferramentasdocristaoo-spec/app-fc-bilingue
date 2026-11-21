// Teste no navegador da tradução das notificações (21/11/2026, Noé). Supabase TODO simulado (page.route):
// nada vai para a produção, nenhuma notificação sai, nenhuma chave é usada. As traduções simuladas abaixo
// são as que o Claude Haiku devolveu no teste real (scripts fora do repo, 21/11).
// Uso:
//   VITE_PUSH_PREVIEW=1 npx vite build --outDir /tmp/fc-admin-push-dist
//   npx vite preview --outDir /tmp/fc-admin-push-dist --port 3178 &
//   node scripts/teste-admin-traducao.mjs [http://localhost:3178] [pasta-dos-prints]
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";

const BASE = process.argv[2] || "http://localhost:3178";
const PRINTS = process.argv[3] || path.resolve("prints/admin-traducao");
fs.mkdirSync(PRINTS, { recursive: true });
const ADMIN = "dono@teste.fc";
const REF = "rwyyggtsjbwnwzsnlkgy";
const TITULO = "Rute chegou na Jornada 🌾";
const TEXTO = "Você já pode seguir Rute de Moabe até Belém no mapa interativo. Toque para abrir.";
const TRAD = {
  "pt-PT": { titulo: "Rute chegou à Jornada 🌾", texto: "Já podes seguir Rute de Moabe até Belém no mapa interativo. Toca para abrir." },
  en: { titulo: "Ruth has arrived on the Journey 🌾", texto: "You can now follow Ruth from Moab to Bethlehem on the interactive map. Tap to open." },
  es: { titulo: "Rut llegó a la Jornada 🌾", texto: "Ya puedes seguir a Rut desde Moab hasta Belén en el mapa interactivo. Toca para abrir." },
  fr: { titulo: "Ruth est arrivée dans le Voyage 🌾", texto: "Vous pouvez maintenant suivre Ruth de Moab jusqu'à Bethléem sur la carte interactive. Touchez pour ouvrir." },
  it: { titulo: "Rut è arrivata nel Viaggio 🌾", texto: "Ora puoi seguire Rut da Moab fino a Betlemme sulla mappa interattiva. Tocca per aprire." },
  de: { titulo: "Rut ist auf der Reise angekommen 🌾", texto: "Du kannst Rut jetzt von Moab bis Betlehem auf der interaktiven Karte folgen. Tippe zum Öffnen." },
};

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
        const POR = { "pt-BR": 24, "pt-PT": 3, en: 6, es: 4, fr: 1, it: 1, de: 2 };
        const n = p.tipo === "email" ? 1 : p.foraIdiomas ? 5 : POR[p.idiomas?.[0]] ?? 0;
        return json({ ok: true, pessoas: n, aparelhos: n, rotulo: p.tipo === "email" ? `Só um e-mail (teste): ${p.email}` : "Todos com acesso" });
      }
      if (a === "traduzir") {
        await new Promise((r) => setTimeout(r, 600));
        return json({ ok: true, cache: false, traducoes: Object.fromEntries(corpo.idiomas.map((l) => [l, TRAD[l]])) });
      }
      if (a === "enviar") {
        const id = envios.length + 1;
        const rot = corpo.publico.tipo === "email" ? "Só um e-mail (teste): " + corpo.publico.email
          : corpo.publico.foraIdiomas ? `Todos com acesso · outros idiomas (fora ${corpo.publico.foraIdiomas.join(", ")})` : `Todos com acesso · idioma ${corpo.publico.idiomas.join(", ")}`;
        envios.unshift({ id, criado_em: new Date().toISOString(), criado_por: ADMIN, titulo: corpo.titulo, texto: corpo.texto, link: corpo.link, publico_rotulo: rot, pessoas: corpo.confirmar, aparelhos: corpo.confirmar, status: "enviado", enviados: corpo.confirmar, falhas: 0, removidos: 0, abertos: 0 });
        return json({ ok: true, envio: id, status: "enviado", enviados: corpo.confirmar, falhas: 0, removidos: 0, pessoas: corpo.confirmar });
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
const ok = (m) => console.log(`ok  ${m}`);

async function fluxo(tipo, sufixo) {
  const { ctx, page, erros, chamadas } = await contexto(browser, { tipo, email: ADMIN, admin: ADMIN, sessao: sessaoFalsa(ADMIN) });
  await page.goto(BASE + "/fc-control-panel");
  // Painel novo (21/11): celular = barra inferior (aba "Avisos"); computador = lateral ("Notificações").
  if (tipo !== "desktop") await page.locator(".adm-bnav").getByRole("button", { name: "Avisos" }).click();
  else await page.locator(".adm-side").getByRole("button", { name: "Notificações" }).click();
  await page.getByLabel("Título em português").fill(TITULO);
  await page.getByLabel("Mensagem em português").fill(TEXTO);
  await page.getByLabel("Ao tocar, abre").selectOption("/jornada");
  await page.getByLabel("Todos com acesso").check();
  for (const l of ["Português (Portugal)", "Inglês", "Espanhol", "Francês", "Italiano", "Alemão"]) await page.getByLabel(l, { exact: true }).check();
  await print(page, `01-${sufixo}-escrever-e-idiomas.png`, true);
  // Desde 1fdec62 a tradução sai sozinha 1,5 s depois de escrever/marcar (não há mais botão "Traduzir para N").
  await page.getByLabel("Título em Inglês").waitFor();
  await page.waitForFunction((v) => document.querySelector('[aria-label="Título em Alemão"], #push-titulo-de')?.value === v || [...document.querySelectorAll("input")].some((i) => i.value === v), TRAD.de.titulo);
  assert.equal(await page.getByLabel("Título em Alemão").inputValue(), TRAD.de.titulo);
  ok(`${sufixo}: Traduzir preenche as 6 versões editáveis`);
  assert.equal(chamadas.filter((c) => c.corpo?.acao === "traduzir").length, 1);
  ok(`${sufixo}: uma chamada só de tradução`);
  await page.getByLabel("Título em Inglês").fill("Ruth is now on the Journey 🌾");
  await page.getByRole("button", { name: "en", exact: true }).click();
  await page.getByTestId("push-contagem").getByText("41 pessoa(s)").waitFor();
  ok(`${sufixo}: contagem por idioma (41 no total)`);
  await print(page, `02-${sufixo}-versoes-e-previa-en.png`, true);
  // Contraste e tamanho mínimo das letras na seção (regra de legibilidade do FC).
  const pequenas = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((el) => {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false;
    return parseFloat(getComputedStyle(el).fontSize) < 14;
  }).map((el) => el.textContent.trim().slice(0, 40)));
  assert.deepEqual(pequenas, []);
  ok(`${sufixo}: nenhum texto abaixo de 14 px no painel`);
  const toques = await page.evaluate(() => [...document.querySelectorAll('[data-testid="push-idiomas"] label, [data-testid="push-idiomas"] button, [aria-label="Idioma da prévia"] button')]
    .map((el) => el.getBoundingClientRect().height).filter((h) => h < 47.5));
  assert.deepEqual(toques, []);
  ok(`${sufixo}: idiomas, Traduzir e prévia com toque de 48 px`);
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await page.getByRole("alertdialog").getByText("Tem certeza? Vai para 41 pessoa(s).").waitFor();
  await page.waitForTimeout(500); // fim da animação do diálogo
  await print(page, `03-${sufixo}-confirmacao-por-idioma.png`);
  await page.getByRole("button", { name: "Sim, enviar para 41" }).click();
  await page.getByRole("cell", { name: /Ruth is now on the Journey/ }).waitFor();
  const envios = chamadas.filter((c) => c.corpo?.acao === "enviar").map((c) => c.corpo);
  assert.equal(envios.length, 7);
  assert.equal(envios[0].titulo, TITULO);
  assert.deepEqual(envios[0].publico.idiomas, ["pt-BR"]);
  assert.equal(envios.find((e) => e.publico.idiomas[0] === "en").titulo, "Ruth is now on the Journey 🌾");
  ok(`${sufixo}: 7 envios, um por idioma, pt-BR como foi escrito e en com a correção do dono`);
  await print(page, `04-${sufixo}-historico.png`, true);
  assert.deepEqual(erros, []);
  await ctx.close();
}

try {
  await fluxo("desktop", "1440");
  await fluxo("android", "390");
  console.log("tudo ok");
} finally {
  await browser.close();
}
