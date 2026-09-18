const VIGENCIA_DATOS = 10 * 60 * 1000;

const CLAVES = {
    resumen: "sscDatosResumen",
    asignacion: "sscDatosAsignacionV2",
    reasignacion: "sscDatosReasignacionV3"
};

function guardar(clave, datos) {
    sessionStorage.setItem(clave, JSON.stringify({
        guardadoEn: Date.now(),
        datos
    }));
}

function obtener(clave) {
    const contenido = sessionStorage.getItem(clave);

    if (!contenido) return null;

    try {
        const registro = JSON.parse(contenido);
        const antiguedad = Date.now() - Number(registro.guardadoEn);

        if (
            !registro.datos ||
            !Number.isFinite(antiguedad) ||
            antiguedad < 0 ||
            antiguedad > VIGENCIA_DATOS
        ) {
            sessionStorage.removeItem(clave);
            return null;
        }

        return registro.datos;
    } catch (error) {
        sessionStorage.removeItem(clave);
        return null;
    }
}

export const guardarResumenCache = datos => guardar(CLAVES.resumen, datos);
export const obtenerResumenCache = () => obtener(CLAVES.resumen);
export const guardarAsignacionCache = datos => guardar(CLAVES.asignacion, datos);
export const obtenerAsignacionCache = () => obtener(CLAVES.asignacion);
export const guardarReasignacionCache = datos => guardar(CLAVES.reasignacion, datos);
export const obtenerReasignacionCache = () => obtener(CLAVES.reasignacion);

export function eliminarCacheDatosApp() {
    Object.values(CLAVES).forEach(function (clave) {
        sessionStorage.removeItem(clave);
    });
}
