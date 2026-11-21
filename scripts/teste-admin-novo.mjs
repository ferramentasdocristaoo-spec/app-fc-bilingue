// Painel Admin no padrão do app novo (21/11/2026, Aoliabe): prints de todas as abas em 390×844 e 1440×900,
// tema claro e escuro, e conferências de legibilidade (nada < 14 px, toques ≥ 48 px, sem rolagem lateral).
// TODO o Supabase é simulado (page.route): nada vai para a produção, nenhuma senha é usada, nada é enviado.
// Uso:
//   npx vite build --outDir /tmp/fc-admin-novo-dist
//   npx vite preview --outDir /tmp/fc-admin-novo-dist --port 3188 &
//   node scripts/teste-admin-novo.mjs [http://localhost:3188] [pasta-dos-prints]
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3188";
const PRINTS = process.argv[3] || path.resolve("../direcoes-identidade/prints/admin-novo");
fs.mkdirSync(PRINTS, { recursive: true });
const ADMIN = "dono@teste.fc";
const REF = "rwyyggtsjbwnwzsnlkgy";
const VAZIO = process.env.VAZIO === "1"; // banco vazio: confere os estados vazios

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({ sub: "11111111-1111-1111-1111-111111111111", email: ADMIN, role: "authenticated", exp: 4102444800 })}.x`;
const sessao = JSON.stringify({
  access_token: jwt, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: 4102444800,
  user: { id: "11111111-1111-1111-1111-111111111111", aud: "authenticated", role: "authenticated", email: ADMIN, email_confirmed_at: "2026-11-01T00:00:00Z", app_metadata: {}, user_metadata: {} },
});

const dia = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const NOMES = ["pr.joao@igreja.com.br", "maria.santos@gmail.com", "ana.lima@outlook.com", "pastor.marcos@uol.com.br", "debora.c@hotmail.com", "irmao.pedro@gmail.com", "missionaria.ruth@yahoo.com", "lucas.oliveira@gmail.com"];
const acessos = VAZIO ? [] : Array.from({ length: 240 }, (_, i) => {
  const plan = i % 10 < 6 ? "br_mensal" : i % 10 < 8 ? "intl_anual" : i % 10 === 8 ? null : "manual";
  return {
    id: `u${i}`, email: i < NOMES.length ? NOMES[i] : `assinante${i}@exemplo.com`, bloqueado: i % 47 === 5, plan,
    sku: plan, expires_at: i % 19 === 3 ? "2026-10-01T00:00:00Z" : plan === "br_mensal" ? "2026-12-21T00:00:00Z" : null,
    created_at: new Date(Date.now() - i * 3.1 * 86400000).toISOString(), total_count: 240,
  };
});
const envios = VAZIO ? [] : [
  { id: 3, criado_em: new Date(Date.now() - 86400000).toISOString(), criado_por: ADMIN, titulo: "Rute chegou na Jornada", texto: "O mapa interativo de Rute já está no app. Toque para abrir.", link: "/jornada", publico_rotulo: "Todos com acesso · idioma pt-BR", pessoas: 180, aparelhos: 214, status: "enviado", enviados: 209, falhas: 3, removidos: 2, abertos: 61 },
  { id: 2, criado_em: new Date(Date.now() - 4 * 86400000).toISOString(), criado_por: ADMIN, titulo: "Ruth arrived in the Journey", texto: "Ruth's interactive map is in the app.", link: "/jornada", publico_rotulo: "Todos com acesso · idioma en", pessoas: 40, aparelhos: 44, status: "parcial", enviados: 40, falhas: 4, removidos: 0, abertos: 9 },
];

function rpc(nome, corpo) {
  if (VAZIO && nome.startsWith("admin_") && nome !== "admin_dashboard_stats") return [];
  switch (nome) {
    case "app_access_info": return { status: "ok", plan: "br_mensal", idiomas_liberados: false };
    case "app_access_status": return "ok";
    case "session_admin_email": return ADMIN;
    case "is_session_admin": return true;
    case "admin_dashboard_stats": return VAZIO ? { total_users: 0, blocked_users: 0, active_users_7d: 0, usage_today: 0, usage_7d: 0, total_cache: 0, total_usage: 0, total_prayers: 0 }
      : { total_users: 240, blocked_users: 5, active_users_7d: 132, usage_today: 87, usage_7d: 1210, total_cache: 930, total_usage: 15400, total_prayers: 64 };
    case "admin_list_emails_paginated": {
      const s = (corpo?._search || "").toLowerCase();
      const lista = acessos.filter((a) => a.email.includes(s));
      return lista.slice(corpo._offset, corpo._offset + corpo._limit).map((a) => ({ ...a, total_count: lista.length }));
    }
    case "admin_user_growth": return Array.from({ length: 30 }, (_, i) => ({ day: dia(29 - i), new_users: (i * 7) % 5 + (i === 29 ? 4 : 0) }));
    case "admin_cache_stats": return [{ action: "gerar-esboco", total: 420 }, { action: "raio-x", total: 260 }, { action: "devocional", total: 150 }, { action: "nomes", total: 100 }];
    case "admin_top_tools": return [{ tool: "Oficina de Sermões", uses: 904 }, { tool: "Bíblia", uses: 811 }, { tool: "Raio-X de Versículo", uses: 611 }, { tool: "Devocional Diário", uses: 402 }, { tool: "Mural de Oração", uses: 230 }];
    case "admin_top_users": return NOMES.slice(0, 5).map((email, i) => ({ email, uses: 88 - i * 11, last_seen: new Date(Date.now() - i * 86400000).toISOString() }));
    case "admin_usage_by_day": return Array.from({ length: corpo._days }, (_, i) => ({ day: dia(corpo._days - 1 - i), uses: 20 + ((i * 13) % 37) }));
    case "admin_usage_by_hour": return Array.from({ length: 24 }, (_, h) => ({ hour: h, uses: h < 6 ? 2 : 10 + ((h * 17) % 40) }));
    case "admin_usage_by_weekday": return Array.from({ length: 7 }, (_, w) => ({ weekday: w, uses: 80 + w * 21 }));
    case "admin_retention_stats": return { one_time: 30, casual: 61, regular: 44, power: 12, inactive_users: 93, avg_uses: 7.4 };
    case "admin_list_cache": return Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, action: ["gerar-esboco", "raio-x", "devocional", "nomes"][i % 4], cache_key: `sha256:${"9f3a1c".repeat(6)}${i}`, created_at: new Date(Date.now() - i * 86400000).toISOString(), expires_at: null, total_count: 930 }));
    case "admin_list_library_skus": return [{ sku: "APOCALIPSE-8V", product_slug: "apocalipse-revelado" }, { sku: "KIT-PREGADOR", product_slug: "kit-do-pregador" }];
    case "admin_list_library_entitlements": return NOMES.slice(0, 4).map((email, i) => ({ id: `e${i}`, email, product_slug: i % 2 ? "kit-do-pregador" : "apocalipse-revelado", source_sku: i === 2 ? null : "APOCALIPSE-8V", created_at: new Date(Date.now() - i * 5 * 86400000).toISOString(), total_count: 4 }));
    default: return [];
  }
}

function simular(page) {
  page.route(/\.supabase\.co\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const corpo = req.postDataJSON?.() ?? null;
    const json = (b, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(b) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    const m = url.pathname.match(/\/rpc\/([a-z_]+)/);
    if (m) return json(rpc(m[1], corpo));
    if (url.pathname.endsWith("/functions/v1/push-send")) {
      const a = corpo?.acao;
      if (a === "status") return json({ ok: true, configurado: true, projeto: "ferramentas-do-cristao", aparelhos: VAZIO ? 0 : 214 });
      if (a === "historico") return json({ ok: true, envios });
      if (a === "contar") return json({ ok: true, pessoas: 180, aparelhos: 214, rotulo: "Todos com acesso" });
      return json({ ok: false, error: "acao_desconhecida" }, 400); // nunca envia nada
    }
    if (url.pathname.endsWith("/functions/v1/ai-assistant")) {
      if (corpo?.action === "jornada-uso") return json({ result: { used: 6, limit: 40, remaining: 34 } });
      return json({ result: null });
    }
    if (url.pathname.includes("/rest/v1/")) return json([]);
    return json({});
  });
}

/** Legibilidade: textos visíveis < 14 px e alvos de toque visíveis < 44 px de altura (48 é o alvo; 44 é o piso). */
async function conferir(page) {
  return page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && r.bottom > 0; };
    const pequenos = [];
    for (const el of document.querySelectorAll(".adm-root *")) {
      if (!vis(el)) continue;
      const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!temTexto) continue;
      const px = parseFloat(getComputedStyle(el).fontSize) * (parseFloat(getComputedStyle(document.documentElement).zoom) || 1);
      if (px < 13.9) pequenos.push(`${px}px "${el.textContent.trim().slice(0, 30)}"`);
    }
    const toques = [];
    for (const el of document.querySelectorAll(".adm-root :is(button, a[href], select, input:not([type=checkbox]):not([type=radio]))")) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 43.5) toques.push(`${Math.round(r.height)}px "${(el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30)}"`);
    }
    // Algo passando da borda direita (nem sempre gera rolagem: o body pode cortar).
    const fora = [...document.querySelectorAll(".adm-main *")].filter((el) => !el.closest(".adm-wm, .overflow-x-auto, .overflow-auto") && vis(el) && el.getBoundingClientRect().right > window.innerWidth + 1);
    const lateral = document.documentElement.scrollWidth > window.innerWidth + 1 || fora.length ? fora.slice(0, 3).map((el) => `${el.tagName}.${String(el.className).slice(0, 40)}`) : false;
    return { pequenos: [...new Set(pequenos)].slice(0, 8), toques: [...new Set(toques)].slice(0, 8), lateral };
  });
}

const ABAS = [
  { id: "dashboard", nome: "inicio", espera: "Assinantes ativos" },
  { id: "users", nome: "assinantes", espera: "pr.joao@igreja.com.br" },
  { id: "notificacoes", nome: "notificacoes", espera: "Rute chegou na Jornada" },
  { id: "jornada", nome: "jornada", espera: null },
  { id: "analytics", nome: "analises", espera: "Tendência de uso por dia" },
  { id: "livraria", nome: "livraria", espera: "APOCALIPSE-8V" },
  { id: "sermons", nome: "esbocos", espera: "Esboços são privados" },
  { id: "cache", nome: "cache", espera: "Total em cache" },
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const achados = [];
let n = 0;
try {
  for (const [w, h, tam] of [[390, 844, "celular"], [1440, 900, "computador"]]) {
    for (const tema of ["claro", "escuro"]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, locale: "pt-BR", isMobile: w < 500, hasTouch: w < 500 });
      await ctx.addInitScript(({ s, REF, tema }) => {
        localStorage.setItem(`sb-${REF}-auth-token`, s);
        localStorage.setItem("fc-sermon-auth-email", "dono@teste.fc");
        localStorage.setItem("i18nextLng", "pt-BR");
        localStorage.setItem("fc-sermon-theme", tema === "claro" ? "light" : "dark");
      }, { s: sessao, REF, tema });
      const page = await ctx.newPage();
      const erros = [];
      page.on("pageerror", (e) => erros.push(String(e)));
      simular(page);
      for (const aba of ABAS) {
        if (VAZIO && aba.espera && aba.id !== "sermons") aba.espera = null;
        await page.goto(`${BASE}/fc-control-panel#${aba.id}`);
        if (aba.espera) await page.getByText(aba.espera).first().waitFor({ timeout: 15000 });
        await page.waitForTimeout(900);
        const c = await conferir(page);
        if (c.pequenos.length || c.toques.length || c.lateral) achados.push({ tela: `${tam}-${tema}-${aba.nome}`, ...c });
        const nome = `${VAZIO ? "vazio-" : ""}${tam}-${tema}-${aba.nome}`;
        await page.screenshot({ path: path.join(PRINTS, `${nome}.png`) }); // o que aparece na tela
        if (tam === "celular" && !VAZIO) {
          // Página inteira, sem a barra fixa repetida no meio do print.
          const estilo = await page.addStyleTag({ content: ".adm-bnav{display:none!important}" });
          await page.screenshot({ path: path.join(PRINTS, `${nome}-inteira.png`), fullPage: true });
          await estilo.evaluate((el) => el.remove());
        }
        n++;
      }
      if (tam === "celular" && tema === "claro" && !VAZIO) {
        // Folha "Mais", atalho "Buscar assinante" e "Voltar ao app" à vista.
        await page.goto(`${BASE}/fc-control-panel#dashboard`);
        await page.getByText("Assinantes ativos").waitFor();
        await page.locator(".adm-bnav").getByRole("button", { name: "Mais" }).click();
        await page.getByRole("dialog", { name: "Mais do painel" }).waitFor();
        await page.waitForTimeout(500); // fim da animação da folha
        await page.screenshot({ path: path.join(PRINTS, "celular-claro-folha-mais.png") });
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Buscar assinante" }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Buscar assinante por e-mail");
        assert.ok(await page.locator("header.adm-top a[href='/']").isVisible(), "Voltar ao app visível no celular");
        console.log("ok  folha Mais, atalho Buscar assinante (cursor na busca) e Voltar ao app visível");
      }
      assert.deepEqual(erros, [], `erros de página: ${erros.join(" | ")}`);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
console.log(`${n} prints em ${PRINTS}`);
if (achados.length) { console.log("ACHADOS:"); console.log(JSON.stringify(achados, null, 1)); process.exitCode = 1; } else console.log("ok  nenhum texto < 14 px, nenhum toque < 44 px, sem rolagem lateral");
