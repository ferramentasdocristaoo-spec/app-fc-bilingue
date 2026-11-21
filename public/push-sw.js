// Notificações push do FC (21/11/2026, Noé). Este arquivo NÃO é um service worker separado: o sw.js gerado pelo
// vite-plugin-pwa (Workbox) faz importScripts("/push-sw.js") (vite.config.ts → workbox.importScripts). Assim o
// cache e a atualização automática do PWA continuam iguais; aqui só entram os eventos de push e de toque.
// A função push-send manda mensagens FCM só com "data": { titulo, texto, link, envio, tag, ping }.
// Todo push vira notificação visível (o iPhone cancela a inscrição de quem recebe push sem notificação).
self.addEventListener("push", (e) => {
  let bruto = {};
  try { bruto = e.data ? e.data.json() : {}; } catch { bruto = { data: { texto: e.data ? e.data.text() : "" } }; }
  const d = bruto.data || bruto;
  const n = bruto.notification || {};
  e.waitUntil(self.registration.showNotification(d.titulo || n.title || "Ferramentas do Cristão", {
    body: d.texto || n.body || "",
    tag: d.tag || "fc",
    icon: "/pwa-icon-192.png",
    badge: "/pwa-icon-192.png",
    data: { link: d.link || "/", envio: d.envio ? Number(d.envio) : null, ping: d.ping || null },
  }));
});

// Toque: abre o app no link; se o app já estiver aberto, usa a mesma janela. Link de fora vira a Início.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const { link, envio, ping } = e.notification.data || {};
  const url = new URL(link || "/", self.location.origin);
  if (url.origin !== self.location.origin) url.href = self.location.origin + "/";
  e.waitUntil((async () => {
    // Conta o toque no histórico do admin. Só aceita o endereço da própria função push-send.
    if (envio && typeof ping === "string" && /^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/push-send$/.test(ping)) {
      fetch(ping, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acao: "aberto", envio }) }).catch(() => {});
    }
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const j = janelas.find((w) => new URL(w.url).origin === self.location.origin);
    if (j) {
      try { await j.focus(); } catch { /* sem foco */ }
      try { await j.navigate(url.href); } catch { j.postMessage({ tipo: "abrir", link: url.pathname + url.search + url.hash }); }
      return;
    }
    await self.clients.openWindow(url.href);
  })());
});
