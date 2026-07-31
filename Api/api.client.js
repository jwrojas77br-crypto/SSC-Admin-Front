import {
  APP_CONFIG
} from "../Config/config.js";

export async function enviarPost(
  ruta,
  contenido
) {
  const respuesta = await fetch(
    APP_CONFIG.apiUrl + ruta,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(contenido)
    }
  );

  const datos = await respuesta
    .json()
    .catch(function() {
      return {};
    });

  if (!respuesta.ok || !datos.ok) {
    throw new Error(
      datos.mensaje ||
      "No fue posible conectar con el servidor."
    );
  }

  return datos;
}