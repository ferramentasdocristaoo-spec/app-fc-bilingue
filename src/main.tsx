

import './i18n';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent the service worker from interfering when the app is embedded in an iframe.
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();

if (isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
