import { enviarPost } from "../Api/api.client.js";

/**
 * Consulta en una sola solicitud territorios, tarjetas y conductores.
 * El Front filtrará localmente las tarjetas al cambiar de territorio.
 */
export function consultarDatosAsignacion(token) {
    return enviarPost(
        "/api/asignar/territorios",
        { token }
    );
}
