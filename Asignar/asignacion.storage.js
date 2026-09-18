// Clave exclusiva para la selección temporal de una asignación.
const SELECCION_ASIGNACION_KEY = "sscAsignacionPendiente";

/**
 * Conserva temporalmente la selección mientras se revisa el resumen.
 * La confirmación definitiva se realizará posteriormente en el backend.
 */
export function guardarSeleccionAsignacion(seleccion) {
    sessionStorage.setItem(
        SELECCION_ASIGNACION_KEY,
        JSON.stringify(seleccion)
    );
}

/** Recupera la selección pendiente o null si no es válida. */
export function obtenerSeleccionAsignacion() {
    const contenido = sessionStorage.getItem(
        SELECCION_ASIGNACION_KEY
    );

    if (!contenido) {
        return null;
    }

    try {
        return JSON.parse(contenido);
    } catch (error) {
        eliminarSeleccionAsignacion();
        return null;
    }
}

/** Elimina la selección después de confirmarla o cancelarla. */
export function eliminarSeleccionAsignacion() {
    sessionStorage.removeItem(SELECCION_ASIGNACION_KEY);
}