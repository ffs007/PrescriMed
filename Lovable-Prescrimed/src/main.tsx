import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./pwa/registerServiceWorker";

// Stale chunk after a new deploy (old cached index referencing removed files):
// reload once to fetch the fresh version instead of showing a blank screen.
const RELOAD_KEY = "prescrimed.chunkReloadAt";
function recoverFromStaleChunk(e?: Event) {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < 10_000) return; // avoid reload loops
  e?.preventDefault();
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
}
window.addEventListener("vite:preloadError", recoverFromStaleChunk);
window.addEventListener("unhandledrejection", (e) => {
  const msg = String((e as PromiseRejectionEvent).reason?.message || "");
  if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
    recoverFromStaleChunk(e);
  }
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Elemento raiz do PrescriMed não encontrado.");
createRoot(rootElement).render(<App />);

void registerServiceWorker();
