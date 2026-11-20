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
      includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Fontes auto-hospedadas (só latin/latin-ext) entram no precache para uso offline
        globPatterns: ["**/*.{js,wasm,css,html}", "**/*latin*.woff2"],
        // Gravuras da Jornada (domínio público): ficam no aparelho depois da primeira visita.
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith("/jornada/") && url.pathname.endsWith(".webp"),
          handler: "CacheFirst",
          options: { cacheName: "jornada-gravuras", expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 180 } },
        }, {
          // Fontes .woff do PDF do sermão (o pdf-lib não lê woff2 com subconjunto): ficam no aparelho no 1º PDF.
          urlPattern: ({ url }) => url.pathname.startsWith("/assets/") && url.pathname.endsWith(".woff"),
          handler: "CacheFirst",
          options: { cacheName: "pdf-fontes", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
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
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
