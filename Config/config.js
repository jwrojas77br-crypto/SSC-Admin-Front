const esEntornoLocal = [
  "localhost",
  "127.0.0.1"
].includes(window.location.hostname);

export const APP_CONFIG = Object.freeze({
  apiUrl: esEntornoLocal
    ? "https://ssc-admin-api-dev.espaju132449.workers.dev"
    : "https://ssc-admin-api.espaju132449.workers.dev",

  entorno: esEntornoLocal ? "DEV" : "PROD"
});
