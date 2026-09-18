import { enviarPost } from "../../Api/api.client.js";

/** Envía al backend los datos mínimos necesarios para crear la asignación. */
export function confirmarAsignacion(
    token,
    nombreConductor,
    tarjetas
) {
    return enviarPost(
        "/api/asignar/confirmar",
        {
            token,
            nombreConductor,
            tarjetas
        }
    );
}
