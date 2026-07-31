
// URL pública de Cloudflare Worker. El Front nunca llama directamente a Apps Script.
const API_URL =
  "https://ssc-admin-api-dev.espaju132449.workers.dev";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .then(registration => console.log("SW registrado:", registration.scope))
      .catch(error => console.error("Error registrando SW:", error));
  });
}
