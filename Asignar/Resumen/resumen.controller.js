import {
    eliminarSeleccionAsignacion,
    obtenerSeleccionAsignacion
} from "../asignacion.storage.js";
import { obtenerTokenSesion } from "../../Session/session.storage.js";
import { crearSpinner } from "../../Shared/spinner.js";
import {
    guardarAsignacionCache,
    guardarReasignacionCache,
    guardarResumenCache,
    obtenerAsignacionCache,
    obtenerReasignacionCache
} from "../../Shared/data.cache.js";
import { confirmarAsignacion } from "./resumen.api.js";

let confirmacionEnCurso = false;

function esSeleccionValida(seleccion) {
    return Boolean(
        seleccion &&
        seleccion.conductor &&
        String(seleccion.conductor.nombre || "").trim() &&
        Array.isArray(seleccion.grupos) &&
        seleccion.grupos.length > 0 &&
        seleccion.grupos.every(function (grupo) {
            return grupo.territorio &&
                String(grupo.territorio.numero || "").trim() &&
                String(grupo.territorio.barrio || "").trim() &&
                Array.isArray(grupo.tarjetas) &&
                grupo.tarjetas.length > 0 &&
                grupo.tarjetas.every(function (tarjeta) {
                    return ["Digital", "Física"].includes(tarjeta.entregaConductor);
                });
        })
    );
}

function crearTarjetaResumen(tarjeta) {
    const elemento = document.createElement("li");
    elemento.className = "ssc-resumen__card";

    const informacion = document.createElement("div");
    informacion.className = "ssc-resumen__card-info";

    const titulo = document.createElement("strong");
    titulo.textContent = `Tarjeta ${tarjeta.id}`;

    const detalles = document.createElement("span");
    detalles.className = "ssc-resumen__card-meta";

    const transporte = tarjeta.deCarro ? "Carro" : "Caminando";
    const valor = tarjeta.minutosCaminando;
    const minutos = Number(valor);
    const tieneTiempo = valor !== null && valor !== undefined &&
        String(valor).trim() !== "" && Number.isFinite(minutos);
    const tiempo = tieneTiempo
        ? `${minutos} min${tarjeta.deCarro ? " a pie" : ""}`
        : "Tiempo no indicado";

    detalles.textContent = `${transporte} · ${tiempo}`;
    const entrega = document.createElement("span");
    entrega.className = "ssc-resumen__card-delivery";
    entrega.textContent = `Pendiente · ${tarjeta.entregaConductor}`;
    informacion.append(titulo, detalles, entrega);

    const confirmacion = document.createElement("span");
    confirmacion.className = "ssc-resumen__card-check";
    confirmacion.textContent = "✓";
    confirmacion.setAttribute("aria-hidden", "true");

    elemento.append(informacion, confirmacion);
    return elemento;
}

function crearGrupoResumen(grupo) {
    const seccion = document.createElement("section");
    seccion.className = "ssc-resumen__territory-group";

    const titulo = document.createElement("h3");
    titulo.className = "ssc-resumen__territory-title";
    titulo.textContent = `${grupo.territorio.numero} ${grupo.territorio.barrio}`;

    const cantidad = document.createElement("p");
    cantidad.className = "ssc-resumen__territory-count";
    cantidad.textContent = `${grupo.tarjetas.length} ` +
        `${grupo.tarjetas.length === 1 ? "tarjeta" : "tarjetas"}`;

    const lista = document.createElement("ul");
    lista.className = "ssc-resumen__cards";

    grupo.tarjetas.forEach(function (tarjeta) {
        lista.appendChild(crearTarjetaResumen(tarjeta));
    });

    seccion.append(titulo, cantidad, lista);
    return seccion;
}

async function procesarConfirmacion(seleccion) {
    if (confirmacionEnCurso) {
        return;
    }

    const mensaje = document.getElementById("resumenStatus");
    const botonConfirmar = document.getElementById("resumenConfirmar");
    const botonAgregar = document.getElementById("resumenAgregar");
    const token = obtenerTokenSesion();

    if (!token) {
        window.location.replace(new URL("../../index.html", import.meta.url).href);
        return;
    }

    const tarjetas = seleccion.grupos.flatMap(function (grupo) {
        return grupo.tarjetas.map(function (tarjeta) {
            return {
                id: tarjeta.id,
                territorio: grupo.territorio.numero,
                entregaConductor: tarjeta.entregaConductor
            };
        });
    });

    confirmacionEnCurso = true;
    botonConfirmar.disabled = true;
    botonAgregar.disabled = true;
    mensaje.dataset.estado = "procesando";
    mensaje.replaceChildren(
        crearSpinner({
            mensaje: `Registrando las tarjetas asignadas al conductor ${seleccion.conductor.nombre}…`
        })
    );

    try {
        const resultado = await confirmarAsignacion(
            token,
            seleccion.conductor.nombre,
            tarjetas
        );

        if (resultado.resumen) {
            guardarResumenCache(resultado.resumen);
        }

        const datosAsignacion = obtenerAsignacionCache();
        if (datosAsignacion) {
            const idsAsignados = new Set(tarjetas.map(function (tarjeta) {
                return tarjeta.id;
            }));
            const tarjetasRestantes = datosAsignacion.tarjetas.filter(function (tarjeta) {
                return !idsAsignados.has(tarjeta.id);
            });
            const cantidadPorTerritorio = new Map();

            tarjetasRestantes.forEach(function (tarjeta) {
                cantidadPorTerritorio.set(
                    tarjeta.territorio,
                    (cantidadPorTerritorio.get(tarjeta.territorio) || 0) + 1
                );
            });

            guardarAsignacionCache({
                ...datosAsignacion,
                tarjetas: tarjetasRestantes,
                territorios: datosAsignacion.territorios.map(function (territorio) {
                    return {
                        ...territorio,
                        cantidad: cantidadPorTerritorio.get(territorio.numero) || 0
                    };
                })
            });
        }

        const datosReasignacion = obtenerReasignacionCache();
        if (datosReasignacion) {
            const nuevasPendientes = seleccion.grupos.flatMap(function (grupo) {
                return grupo.tarjetas.map(function (tarjeta) {
                    return {
                        id: tarjeta.id,
                        conductor: seleccion.conductor.nombre,
                        estatus: "Pendiente",
                        entregaConductor: tarjeta.entregaConductor,
                        fechaAsignada: "Ahora",
                        territorio: grupo.territorio.numero,
                        barrio: grupo.territorio.barrio
                    };
                });
            });

            guardarReasignacionCache({
                ...datosReasignacion,
                pendientes: datosReasignacion.pendientes.concat(nuevasPendientes)
            });
        }

        eliminarSeleccionAsignacion();
        mensaje.dataset.estado = "correcto";
        mensaje.textContent = resultado.mensaje ||
            "La asignación fue registrada correctamente.";

        window.setTimeout(function () {
            window.location.replace(new URL("../asignar.html", import.meta.url).href);
        }, 1800);
    } catch (error) {
        confirmacionEnCurso = false;
        botonConfirmar.disabled = false;
        botonAgregar.disabled = false;
        mensaje.dataset.estado = "error";
        mensaje.textContent = error.message;
    }
}

function inicializarResumen() {
    const mensaje = document.getElementById("resumenStatus");
    const seleccion = obtenerSeleccionAsignacion();

    if (!esSeleccionValida(seleccion)) {
        mensaje.textContent =
            "No hay una selección pendiente. Regresa y elige las tarjetas.";
        return;
    }

    document.getElementById("resumenConductor").textContent =
        seleccion.conductor.nombre;

    const contenedor = document.getElementById("resumenGrupos");
    const fragmento = document.createDocumentFragment();

    seleccion.grupos.forEach(function (grupo) {
        fragmento.appendChild(crearGrupoResumen(grupo));
    });

    contenedor.replaceChildren(fragmento);
    mensaje.textContent = "";

    const botonConfirmar = document.getElementById("resumenConfirmar");
    botonConfirmar.disabled = false;
    botonConfirmar.addEventListener("click", function () {
        procesarConfirmacion(seleccion);
    });

    document.getElementById("resumenBack")
        .addEventListener("click", () => window.history.back());
    document.getElementById("resumenAgregar")
        .addEventListener("click", () => window.history.back());
}

inicializarResumen();
