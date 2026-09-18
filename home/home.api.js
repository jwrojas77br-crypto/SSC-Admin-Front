import { enviarPost } from "../Api/api.client.js";

export function consultarResumenHome(token) {
  return enviarPost(
    "/api/home/resumen",
    { token },
    { reintentos: 1 }
  );
}
