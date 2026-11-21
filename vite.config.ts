import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  build: {
    target: "esnext",
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png", "pwa-icon-maskable-512.png", "apple-touch-icon.png", "logo-fc-claro-192.png", "logo-fc-claro-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Notificações push (21/11/2026): o sw.js do PWA importa os eventos push/notificationclick.
        // Cache e atualização automática continuam iguais (ver public/push-sw.js).
        importScripts: ["/push-sw.js"],
        // Fontes auto-hospedadas (só latin/latin-ext) entram no precache para uso offline
        globPatterns: ["**/*.{js,wasm,css,html}", "**/*latin*.woff2"],
        // Gravuras da Jornada (domínio público): ficam no aparelho depois da primeira visita.
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith("/jornada/") && url.pathname.endsWith(".webp"),
          handler: "CacheFirst",
          options: { cacheName: "jornada-gravuras", expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 180 } },
        }],
      },
      manifest: {
        name: "Ferramentas do Cristão",
        short_name: "Ferramentas do Cristão",
        description: "Sua oficina completa para a Palavra e o Reino.",
        id: "/fc-sermon",
        theme_color: "#0e1c2e",
        background_color: "#0e1c2e",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          { src: "/screenshot-wide.jpg", sizes: "1280x720", type: "image/jpeg", form_factor: "wide" },
          { src: "/screenshot-narrow.jpg", sizes: "750x1334", type: "image/jpeg", form_factor: "narrow" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
