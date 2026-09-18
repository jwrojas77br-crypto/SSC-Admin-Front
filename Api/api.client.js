import {
  APP_CONFIG
} from "../Config/config.js";

export async function enviarPost(
  ruta,
  contenido,
  { reintentos = 0 } = {}
) {
  let ultimoError;

  for (let intento = 0; intento <= reintentos; intento += 1) {
    try {
      const respuesta = await fetch(
        APP_CONFIG.apiUrl + ruta,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          cache: "no-store",
          body: JSON.stringify(contenido)
        }
      );

      const datos = await respuesta.json().catch(function() {
        return {};
      });

      if (!respuesta.ok || !datos.ok) {
        const error = new Error(
          datos.mensaje || "No fue posible conectar con el servidor."
        );
        error.status = respuesta.status;
        error.codigo = datos.codigo || "";

        const transitorio = respuesta.status === 404 || respuesta.status >= 500;

        if (transitorio && intento < reintentos) {
          ultimoError = error;
          continue;
        }

        throw error;
      }

      return datos;
    } catch (error) {
      ultimoError = error;

      if (intento >= reintentos || (error.status && error.status < 500 && error.status !== 404)) {
        throw error;
      }
    }
  }

  throw ultimoError || new Error("No fue posible conectar con el servidor.");
}
