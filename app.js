
/**
 * El Service Worker se utiliza únicamente en la aplicación publicada.
 * En desarrollo puede conservar archivos antiguos y mezclarlos con cambios nuevos.
 */
const esServidorLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

if ("serviceWorker" in navigator && !esServidorLocal) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .then(registration => {
        console.log("SW registrado:", registration.scope);
      })
      .catch(error => {
        console.error("Error registrando SW:", error);
      });
  });
}
