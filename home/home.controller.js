import {
    comprobarSesionActual
} from "../Session/session.service.js";

import {
    eliminarSesion,
    obtenerTokenSesion,
    obtenerUsuarioSesion
} from "../Session/session.storage.js";

import {
    consultarResumenHome
} from "./home.api.js";

import { ROLES } from "../Config/roles.js";
import { crearSpinner } from "../Shared/spinner.js";
import {
    guardarResumenCache,
    obtenerResumenCache
} from "../Shared/data.cache.js";

function mostrarUsuarioHome(usuario) {
    const nombre = String(usuario?.nombre || "").trim();
    const rol = String(usuario?.rol || "").trim().toUpperCase();

    const iniciales = nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(parte => Array.from(parte)[0])
        .join("")
        .toUpperCase();

    document.getElementById("homeUserName").textContent =
        nombre || "Usuario";

    document.getElementById("homeUserInitials").textContent =
        iniciales || "U";

    document.getElementById("homeUserRoleCode").textContent =
        rol || "—";

    document.getElementById("homeUserRoleName").textContent =
        Object.hasOwn(ROLES, rol)
            ? ROLES[rol]
            : "Rol no reconocido";
}

function validarResumen(resumen) {
    return Boolean(
        resumen &&
        Number.isSafeInteger(resumen.disponibles) &&
        Number.isSafeInteger(resumen.asignadas) &&
        Number.isSafeInteger(resumen.pendientes) &&
        resumen.disponibles >= 0 &&
        resumen.asignadas >= 0 &&
        resumen.pendientes >= 0
    );
}

function mostrarResumen(resumen) {
    document.getElementById("homeAvailableCount").textContent = String(resumen.disponibles);
    document.getElementById("homeAssignedCount").textContent = String(resumen.asignadas);
    document.getElementById("homePendingCount").textContent = String(resumen.pendientes);
    document.getElementById("homeSummaryStatus").replaceChildren();
    document.querySelector(".ssc-home__stats").hidden = false;
}

async function cargarResumenHome({ mostrarIndicador = true } = {}) {
    const disponibles = document.getElementById("homeAvailableCount");
    const asignadas = document.getElementById("homeAssignedCount");
    const pendientes = document.getElementById("homePendingCount");
    const mensaje = document.getElementById("homeSummaryStatus");
    const stats = document.querySelector(".ssc-home__stats");
    const actualizar = document.getElementById("homeSummaryRefresh");

    actualizar.disabled = true;
    disponibles.textContent = "—";
    asignadas.textContent = "—";
    pendientes.textContent = "—";
    stats.hidden = true;
    if (mostrarIndicador) {
        mensaje.replaceChildren(
            crearSpinner({ mensaje: "Cargando resumen…" })
        );
    } else {
        mensaje.replaceChildren();
    }

    try {
        const resultado = await consultarResumenHome(
            obtenerTokenSesion()
        );

        const resumen = resultado.resumen;

        if (!validarResumen(resumen)) {
            throw new Error("El servidor devolvió un resumen no válido.");
        }

        guardarResumenCache(resumen);
        mostrarResumen(resumen);
    } catch (error) {
        if (error.codigo === "SESION_NO_VALIDA") {
            eliminarSesion();
            window.location.replace(
                new URL("../index.html", import.meta.url).href
            );
            return;
        }

        mensaje.textContent =
            "No se pudo cargar el resumen. " + error.message;
    } finally {
        actualizar.disabled = false;
    }
}

async function inicializarHome() {
    // Retira el indicador de navegación utilizado al regresar desde Asignar.
    const parametros = new URLSearchParams(window.location.search);
    const regresaDeAsignar = parametros.get("origen") === "asignar";
    const usuarioGuardado = obtenerUsuarioSesion();

    document.getElementById("homeSessionStatus").replaceChildren(
        crearSpinner({ mensaje: "Validando tu acceso…" })
    );

    // El resumen se solicitará después de terminar la validación de sesión.
    document.getElementById("homeSummaryStatus").replaceChildren();

    // Consume la indicación para que una recarga vuelva al flujo normal.
    if (regresaDeAsignar) {
        const url = new URL(window.location.href);
        url.searchParams.delete("origen");
        window.history.replaceState(window.history.state, "", url.href);
    }

    // Mantiene el Home oculto hasta validar la sesión y cargar su resumen.
    const resultado = await comprobarSesionActual();

    if (!resultado.valida) {
        window.location.replace(
            new URL("../index.html", import.meta.url).href
        );
        return;
    }

    mostrarUsuarioHome(resultado.usuario || usuarioGuardado);

    document.getElementById("homeSettingsButton")
        .addEventListener("click", () => {
            window.location.assign(
                new URL(
                    "../index.html?configuracion=authenticator",
                    import.meta.url
                ).href
            );
        });

    document.getElementById("homeSummaryRefresh")
        .addEventListener("click", function () {
            cargarResumenHome();
        });

    const resumenGuardado = obtenerResumenCache();

    if (validarResumen(resumenGuardado)) {
        mostrarResumen(resumenGuardado);
        document.getElementById("homeSummaryRefresh").disabled = false;
    } else {
        document.getElementById("homeSessionStatus").replaceChildren(
            crearSpinner({ mensaje: "Cargando resumen…" })
        );
        await cargarResumenHome({ mostrarIndicador: false });
    }

    // Revela la vista cuando todos los datos iniciales ya están preparados.
    document.querySelector(".ssc-home").hidden = false;
    document.getElementById("homeSessionStatus").replaceChildren();
    document.getElementById("homeSessionStatus").hidden = true;
}

inicializarHome();
