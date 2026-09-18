import { enviarPost } from "../Api/api.client.js";

export function consultarPendientesReasignacion(token) {
    return enviarPost(
        "/api/reasignar/pendientes",
        { token },
        { reintentos: 1 }
    );
}

export function confirmarReasignacion(
    token,
    idsTarjetas,
    nombreConductor,
    motivo,
    observacion,
    operacionId,
    entregasConductor
) {
    return enviarPost("/api/reasignar/confirmar", {
        token,
        idsTarjetas,
        nombreConductor,
        motivo,
        observacion,
        operacionId,
        entregasConductor
    }, { reintentos: 1 });
}
