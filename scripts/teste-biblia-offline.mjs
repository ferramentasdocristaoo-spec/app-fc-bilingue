// Teste no Chrome da Bíblia offline (21/11/2026, Noé).
// O Supabase é simulado (page.route): nada vai para a produção. O texto vem de verdade do bolls.life
// (o capítulo pela "bible-proxy" simulada e a tradução completa direto do bolls.life, como no app).
// Uso:
//   VITE_SUPABASE_URL=https://rwyyggtsjbwnwzsnlkgy.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=teste npx vite build --outDir /tmp/fc-offline-dist
//   npx vite preview --outDir /tmp/fc-offline-dist --port 3191 &
//   node scripts/teste-biblia-offline.mjs [http://localhost:3191] [pasta-dos-prints]
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";

const BASE = process.argv[2] || "http://localhost:3191";
const PRINTS = process.argv[3] || path.resolve("../direcoes-identidade/prints/biblia-offline");
fs.mkdirSync(PRINTS, { recursive: true });

const resultados = [];
const ok = (m) => { resultados.push(`ok  ${m}`); console.log(`ok  ${m}`); };

function simular(page, contador) {
  return page.route(/\.supabase\.co\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    // Sem internet no teste: o route do Playwright ainda seria chamado; aqui ele falha como a rede real.
    if (contador.offline) return route.abort("internetdisconnected");
    const json = (b, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(b) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    if (url.pathname.endsWith("/functions/v1/bible-proxy")) {
      contador.capitulos++;
      const v = url.searchParams.get("version"), b = url.searchParams.get("bookId"), c = url.searchParams.get("chapter");
      const r = await fetch(`https://bolls.life/get-text/${v}/${b}/${c}/`);
      return route.fulfill({ status: r.status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: await r.text() });
    }
    if (url.pathname.endsWith("/rpc/app_access_info")) return json({ status: "ok", plan: null, idiomas_liberados: false });
    if (url.pathname.endsWith("/rpc/app_access_status")) return json("ok");
    if (url.pathname.endsWith("/rpc/session_admin_email")) return json(null);
    if (url.pathname.endsWith("/rpc/is_session_admin")) return json(false);
    if (url.pathname.includes("/functions/v1/")) return json({});
    return json([]);
  });
}

/** Textos < 14 px e toques < 48 px dentro de um seletor. */
async function legibilidade(page, seletor) {
  return page.evaluate((sel) => {
    const raiz = document.querySelector(sel);
    if (!raiz) return { erro: "sem " + sel };
    const pequenos = [], toques = [];
    raiz.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || cs.visibility === "hidden") return;
      const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (temTexto && parseFloat(cs.fontSize) < 14) pequenos.push(`${el.className || el.tagName}: ${cs.fontSize} "${el.textContent.trim().slice(0, 30)}"`);
      if (el.tagName === "BUTTON" && (r.height < 47.5 || r.width < 47.5)) toques.push(`${el.className || el.tagName}: ${Math.round(r.width)}×${Math.round(r.height)} "${el.textContent.trim().slice(0, 30)}"`);
    });
    return { pequenos, toques };
  }, seletor);
}

async function abrirLista(page) {
  await page.getByRole("button", { name: /^Versão:/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.waitForTimeout(400); // fim da animação de abertura (zoom 95% → 100%)
  return dialog;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const tamanhos = {};
try {
  for (const tela of [
    { nome: "celular", ctxOpts: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { nome: "computador", ctxOpts: { viewport: { width: 1440, height: 900 } } },
  ]) {
    const ctx = await browser.newContext({ ...tela.ctxOpts, locale: "pt-BR", serviceWorkers: "allow" });
    await ctx.addInitScript(() => {
      localStorage.setItem("fc-sermon-auth-email", "cliente@teste.fc");
      localStorage.setItem("fc-idioma-manual", "pt-BR");
      localStorage.setItem("i18nextLng", "pt-BR");
      localStorage.setItem("fc-push-convite", JSON.stringify({ adiado: 99, vezes: 99 }));
    });
    const page = await ctx.newPage();
    const erros = [];
    page.on("pageerror", (e) => erros.push(String(e)));
    const contador = { capitulos: 0 };
    await simular(page, contador);
    const zips = [];
    page.on("request", (r) => { if (r.url().includes("bolls.life/static/translations/")) zips.push(r.url().split("/").pop()); });

    // Internet lenta (~3G) no começo, para ver o "Baixando… N%" na linha da versão.
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 120 * 1024, uploadThroughput: 60 * 1024 });

    // 1) Abre João 3 (ARA, padrão pt-BR): lê pela internet na hora e a ARA começa a ser guardada sozinha.
    await page.goto(BASE + "/biblia?bookId=43&chapter=3");
    await page.getByText(/Porque Deus amou o mundo de tal maneira/).first().waitFor({ timeout: 20000 });
    ok(`${tela.nome}: João 3 abre na hora pela internet (ARA)`);
    let dialog = await abrirLista(page);
    await dialog.waitFor();
    const baixando = dialog.locator(".bv-status-downloading, .bv-status-queued, .bv-status-saving, .bv-status-ready").first();
    await baixando.waitFor({ timeout: 10000 });
    await dialog.locator(".bv-row.is-current .bv-status-downloading").waitFor({ timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(PRINTS, `${tela.nome}-01-lista-baixando.png`) });
    const statusArA = await dialog.locator(".bv-row.is-current .bv-status").textContent();
    assert.match(statusArA, /Baixando… \d+%/);
    ok(`${tela.nome}: progresso discreto na linha da versão: "${statusArA.trim()}"`);
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await dialog.locator(".bv-row.is-current .bv-status-ready").waitFor({ timeout: 60000 });
    assert.ok(zips.includes("ARA.zip"), "baixou ARA.zip");
    ok(`${tela.nome}: ARA baixada sozinha (sem botão), selo "${(await dialog.locator(".bv-row.is-current .bv-status").textContent()).trim()}"`);

    // 2) Toca na NAA: troca a leitura e já guarda a NAA.
    await dialog.getByRole("button", { name: /^NAA - Nova Almeida Atualizada/ }).click();
    await page.getByText(/^Porque Deus amou o mundo de tal maneira/).first().waitFor({ timeout: 20000 });
    dialog = await abrirLista(page);
    await dialog.locator(".bv-row.is-current .bv-status-ready").waitFor({ timeout: 60000 });
    ok(`${tela.nome}: NAA guardada ao tocar nela`);
    const leg = await legibilidade(page, '[role="dialog"]');
    assert.deepEqual(leg.pequenos, [], "textos < 14 px na lista: " + leg.pequenos.join("; "));
    assert.deepEqual(leg.toques, [], "toques < 48 px na lista: " + leg.toques.join("; "));
    ok(`${tela.nome}: lista de versões sem texto < 14 px e sem toque < 48 px`);
    await page.screenshot({ path: path.join(PRINTS, `${tela.nome}-02-lista-duas-no-celular.png`) });
    await dialog.locator(".bv-list").screenshot({ path: path.join(PRINTS, `${tela.nome}-02b-lista-inteira.png`) }).catch(() => {});
    tamanhos[tela.nome] = await page.evaluate(async () => {
      const est = await navigator.storage?.estimate?.();
      const persist = await navigator.storage?.persisted?.();
      return { usoTotalMB: est ? +(est.usage / 1e6).toFixed(1) : null, persistido: persist };
    });
    await page.keyboard.press("Escape");

    // O service worker do PWA (o mesmo de hoje) precisa estar controlando a página para abrir o app sem internet.
    const sw = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return "sem suporte";
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 15000))]);
      return reg ? "pronto" : "não registrou";
    });
    if (sw === "pronto" && !(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
      await page.reload();
      await page.getByText(/^Porque Deus amou o mundo de tal maneira/).first().waitFor({ timeout: 20000 });
    }
    console.log(`   service worker: ${sw}, controlando: ${await page.evaluate(() => !!navigator.serviceWorker?.controller)}`);

    // 3) Sem internet: próximo capítulo e até recarregar a página abrem do aparelho.
    await ctx.setOffline(true);
    contador.offline = true;
    const antes = contador.capitulos;
    await page.getByRole("button", { name: "Próximo capítulo" }).click();
    await page.getByRole("heading", { name: "João 4" }).waitFor();
    await page.getByText(/Quando Jesus soube que os fariseus/).waitFor({ timeout: 10000 });
    assert.equal(contador.capitulos, antes, "não pode pedir capítulo à internet");
    ok(`${tela.nome}: sem internet, João 4 (NAA) abre do aparelho`);
    // Recarregar sem internet: o app abre pelo service worker e volta no último capítulo/versão lidos, do aparelho.
    // (o endereço ainda é o de João 3; a versão volta na última escolhida, a NAA)
    await page.reload();
    await page.getByRole("heading", { name: "João 3" }).waitFor({ timeout: 20000 });
    await page.getByText(/Nicodemos/).first().waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: /^Versão: NAA/ }).waitFor();
    ok(`${tela.nome}: sem internet, recarregar o app (service worker) abre a Bíblia na NAA do aparelho`);
    await page.getByRole("button", { name: "Próximo capítulo" }).click();
    await page.getByText(/Quando Jesus soube que os fariseus/).waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(PRINTS, `${tela.nome}-02c-recarregado-sem-internet.png`) });

    // 4) Trocar de versão sem internet: ARA (guardada) abre; ACF (não guardada) dá o aviso gentil.
    dialog = await abrirLista(page);
    await dialog.getByText("Você está sem internet. Só as versões salvas no celular abrem agora.").waitFor();
    await dialog.getByRole("button", { name: /^ARA - Almeida Revista e Atualizada/ }).click();
    await page.getByText(/Quando, pois, o Senhor soube/).waitFor({ timeout: 10000 });
    ok(`${tela.nome}: sem internet, troca para a ARA (guardada) e lê`);
    dialog = await abrirLista(page);
    await dialog.getByRole("button", { name: /^ACF - Almeida Corrigida Fiel/ }).click();
    await page.getByRole("heading", { name: "Você está sem internet" }).waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: "Ler na ARA" }).waitFor();
    const legAviso = await legibilidade(page, ".biblia-offline-aviso");
    assert.deepEqual(legAviso.pequenos, [], legAviso.pequenos.join("; "));
    assert.deepEqual(legAviso.toques, [], legAviso.toques.join("; "));
    await page.screenshot({ path: path.join(PRINTS, `${tela.nome}-03-sem-internet-versao-nao-guardada.png`) });
    ok(`${tela.nome}: sem internet, ACF (não guardada) mostra aviso com "Ler na ARA"/"Ler na NAA"`);
    await page.getByRole("button", { name: "Ler na NAA" }).click();
    await page.getByText(/Quando Jesus soube que os fariseus/).waitFor({ timeout: 10000 });
    ok(`${tela.nome}: botão do aviso volta a ler na versão guardada`);

    // 5) Remover a ARA (com confirmação). Total cai para 1 versão.
    dialog = await abrirLista(page);
    await dialog.getByRole("button", { name: "Tirar ARA - Almeida Revista e Atualizada do celular" }).click();
    await page.screenshot({ path: path.join(PRINTS, `${tela.nome}-04-confirmar-remocao.png`) });
    await dialog.getByRole("button", { name: "Tirar do celular" }).click();
    await dialog.getByText(/^1 versão no celular · /).waitFor();
    const depois = await page.evaluate(() => new Promise((res) => {
      const req = indexedDB.open("fc-biblia-offline");
      req.onsuccess = () => {
        const tx = req.result.transaction(["capitulos", "versoes"], "readonly");
        const c = tx.objectStore("capitulos").getAllKeys();
        const v = tx.objectStore("versoes").getAll();
        tx.oncomplete = () => res({ ara: c.result.filter((k) => String(k).startsWith("ARA|")).length, naa: c.result.filter((k) => String(k).startsWith("NAA|")).length, versoes: v.result.map((x) => `${x.version}:${x.chapters}cap:${x.bytes}B:${x.downloadBytes}zip`) });
      };
    }));
    assert.equal(depois.ara, 0);
    assert.equal(depois.naa, 1189);
    ok(`${tela.nome}: ARA removida do aparelho; NAA continua com ${depois.naa} capítulos (${depois.versoes.join(", ")})`);
    await page.screenshot({ path: path.join(PRINTS, `${tela.nome}-05-depois-de-remover.png`) });
    await page.keyboard.press("Escape");

    assert.deepEqual(erros, [], "erros na página: " + erros.join(" | "));
    ok(`${tela.nome}: nenhum erro de página`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log("\nUso do armazenamento (navigator.storage.estimate, com NAA+ARA e o cache do app):", JSON.stringify(tamanhos));
console.log(`\n${resultados.length} conferências ok`);
