import { enviarPost } from "../../Api/api.client.js";

/**
 * Consulta el territorio, sus tarjetas disponibles y los conductores.
 * El backend valida la sesión antes de devolver los datos.
 */
export function consultarDetalleTerritorio(token, numeroTerritorio) {
    return enviarPost(
        "/api/asignar/detalle",
        {
            token,
            numeroTerritorio
        }
    );
}