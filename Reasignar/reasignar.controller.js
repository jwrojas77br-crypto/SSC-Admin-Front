import { obtenerTokenSesion } from "../Session/session.storage.js";
import { crearSpinner } from "../Shared/spinner.js";
import {
    guardarReasignacionCache,
    guardarResumenCache,
    obtenerReasignacionCache
} from "../Shared/data.cache.js";
import {
    consultarPendientesReasignacion,
    confirmarReasignacion
} from "./reasignar.api.js";

let tokenSesion = "";
let pendientes = [];
let conductores = [];
let motivos = [];
let procesoEnCurso = false;
const seleccionadas = new Set();
const entregasSeleccionadas = new Map();

function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function mostrarOpciones() {
    const conductor = document.getElementById("reasignarConductor");
    const motivo = document.getElementById("reasignarMotivo");

    conductor.replaceChildren(new Option("Seleccionar conductor…", ""));
    conductores.forEach(function (elemento, indice) {
        conductor.add(new Option(elemento.nombre, String(indice)));
    });

    motivo.replaceChildren(new Option("Seleccionar motivo…", ""));
    motivos.forEach(function (elemento) {
        motivo.add(new Option(elemento, elemento));
    });

    conductor.disabled = conductores.length === 0;
    motivo.disabled = motivos.length === 0;
}

function mostrarPendientes(lista) {
    const contenedor = document.getElementById("reasignarLista");
    const plantilla = document.getElementById("reasignarTarjetaTemplate");
    const fragmento = document.createDocumentFragment();

    lista.forEach(function (asignacion) {
        const copia = plantilla.content.cloneNode(true);
        const casilla = copia.querySelector(".ssc-reasignar__checkbox");
        const selectorEntrega = copia.querySelector(".ssc-reasignar__delivery");
        const opcionesEntrega = copia.querySelectorAll(".ssc-reasignar__delivery-option");

        copia.querySelector(".ssc-reasignar__card-title").textContent =
            `Tarjeta ${asignacion.id}`;
        copia.querySelector(".ssc-reasignar__card-territory").textContent =
            `${asignacion.territorio} ${asignacion.barrio}`.trim();
        const estatus = String(asignacion.estatus || "Pendiente").trim();
        const entregaPublicador = String(asignacion.entregaPublicador || "").trim();
        const entregaConductor = String(asignacion.entregaConductor || "").trim();
        const entrega = normalizar(estatus) === "asignada"
            ? entregaPublicador
            : entregaConductor;
        const etiquetaEstatus = copia.querySelector(".ssc-reasignar__card-status");
        etiquetaEstatus.textContent = entrega && normalizar(entrega) !== "no indicada"
            ? `${estatus} · ${entrega}`
            : estatus;
        etiquetaEstatus.dataset.estatus = normalizar(estatus);
        copia.querySelector(".ssc-reasignar__card-meta").textContent =
            `Conductor actual: ${asignacion.conductor}` +
            (asignacion.fechaAsignada ? ` · Desde ${asignacion.fechaAsignada}` : "");
        const entregaNueva = entregasSeleccionadas.get(asignacion.id) || "";
        const aviso = copia.querySelector(".ssc-reasignar__card-warning");
        const entregaAnteriorFisica = normalizar(entrega) === "fisica";

        if (entregaAnteriorFisica) {
            aviso.hidden = false;
            aviso.textContent = entregaNueva === "Física"
                ? "La copia física se transferirá al conductor nuevo."
                : "Si eliges Digital, la copia física anterior quedará pendiente de devolución.";
        } else {
            aviso.hidden = true;
        }
        casilla.value = asignacion.id;
        casilla.checked = seleccionadas.has(asignacion.id);
        casilla.disabled = !asignacion.tieneDigital && !asignacion.tieneFisica;
        casilla.setAttribute("aria-label", `Seleccionar tarjeta ${asignacion.id}`);

        opcionesEntrega.forEach(function (opcion) {
            opcion.name = `reasignar-entrega-${asignacion.id}`;
            opcion.dataset.tarjetaId = asignacion.id;
            opcion.disabled = opcion.value === "Digital"
                ? !asignacion.tieneDigital
                : !asignacion.tieneFisica;
            opcion.checked = entregaNueva === opcion.value;
        });
        selectorEntrega.hidden = !casilla.checked;
        fragmento.appendChild(copia);
    });

    contenedor.replaceChildren(fragmento);
    document.getElementById("reasignarListaStatus").textContent = lista.length
        ? ""
        : "No hay asignaciones que coincidan con la búsqueda.";
}

function filtrarPendientes() {
    const consulta = normalizar(document.getElementById("reasignarBuscar").value);
    const filtradas = pendientes.filter(function (asignacion) {
        return normalizar(
            `${asignacion.id} ${asignacion.territorio} ${asignacion.barrio} ` +
            `${asignacion.conductor} ${asignacion.estatus} ${asignacion.entregaPublicador}`
        ).includes(consulta);
    });

    mostrarPendientes(filtradas);
}

function actualizarFormulario() {
    const cantidad = seleccionadas.size;
    const motivo = document.getElementById("reasignarMotivo").value;
    const observacion = document.getElementById("reasignarObservacion").value.trim();
    const tieneConductor = document.getElementById("reasignarConductor").value !== "";
    const observacionValida = motivo !== "Otro" || Boolean(observacion);
    const entregasCompletas = Array.from(seleccionadas).every(function (id) {
        return ["Digital", "Física"].includes(entregasSeleccionadas.get(id));
    });

    document.getElementById("reasignarCantidad").textContent = cantidad
        ? `${cantidad} seleccionada${cantidad === 1 ? "" : "s"}` +
            (entregasCompletas ? "" : " · indica la entrega")
        : "";
    document.getElementById("reasignarObservacionGroup").hidden = motivo !== "Otro";

    const boton = document.getElementById("reasignarConfirmar");
    boton.disabled = procesoEnCurso || !cantidad || !tieneConductor || !motivo ||
        !observacionValida || !entregasCompletas;
    boton.textContent = cantidad
        ? `Reasignar ${cantidad} tarjeta${cantidad === 1 ? "" : "s"}`
        : "Reasignar tarjetas";
}

function cambiarSeleccion(evento) {
    const opcionEntrega = evento.target.closest(".ssc-reasignar__delivery-option");

    if (opcionEntrega) {
        entregasSeleccionadas.set(
            opcionEntrega.dataset.tarjetaId,
            opcionEntrega.value
        );
        filtrarPendientes();
        actualizarFormulario();
        return;
    }

    const casilla = evento.target.closest(".ssc-reasignar__checkbox");

    if (!casilla) return;
    if (casilla.checked) {
        seleccionadas.add(casilla.value);
        const asignacion = pendientes.find(function (elemento) {
            return elemento.id === casilla.value;
        });

        if (asignacion?.tieneDigital && !asignacion?.tieneFisica) {
            entregasSeleccionadas.set(casilla.value, "Digital");
        } else if (!asignacion?.tieneDigital && asignacion?.tieneFisica) {
            entregasSeleccionadas.set(casilla.value, "Física");
        }
    } else {
        seleccionadas.delete(casilla.value);
        entregasSeleccionadas.delete(casilla.value);
    }
    filtrarPendientes();
    actualizarFormulario();
}

async function cargarPendientes(mensaje = "Cargando asignaciones para reasignar…") {
    const estado = document.getElementById("reasignarStatus");
    const actualizar = document.getElementById("reasignarActualizar");

    actualizar.disabled = true;
    delete estado.dataset.estado;
    estado.replaceChildren(crearSpinner({ mensaje }));

    try {
        let resultado = await consultarPendientesReasignacion(tokenSesion);

        // Repite una lectura si una versión transitoria devuelve un cuerpo incompleto.
        if (
            !Array.isArray(resultado.pendientes) ||
            !Array.isArray(resultado.conductores) ||
            !Array.isArray(resultado.motivos)
        ) {
            resultado = await consultarPendientesReasignacion(tokenSesion);
        }

        if (
            !Array.isArray(resultado.pendientes) ||
            !Array.isArray(resultado.conductores) ||
            !Array.isArray(resultado.motivos)
        ) {
            throw new Error("El servidor devolvió datos no válidos.");
        }

        pendientes = resultado.pendientes;
        conductores = resultado.conductores;
        motivos = resultado.motivos;
        guardarReasignacionCache({ pendientes, conductores, motivos });
        seleccionadas.clear();
        entregasSeleccionadas.clear();
        mostrarOpciones();
        filtrarPendientes();
        document.getElementById("reasignarControles").hidden = false;
        estado.textContent = pendientes.length
            ? ""
            : "No hay tarjetas Pendientes o Asignadas para reasignar.";
        actualizarFormulario();
    } catch (error) {
        estado.dataset.estado = "error";
        estado.textContent = "No se pudieron cargar las reasignaciones. " + error.message;
    } finally {
        actualizar.disabled = false;
    }
}

async function procesarReasignacion() {
    if (procesoEnCurso) return;

    const indice = document.getElementById("reasignarConductor").value;
    const conductor = indice === "" ? null : conductores[Number(indice)];
    const motivo = document.getElementById("reasignarMotivo").value;
    const observacion = document.getElementById("reasignarObservacion").value.trim();
    const idsProcesados = Array.from(seleccionadas);
    const entregasProcesadas = Object.fromEntries(
        idsProcesados.map(function (id) {
            return [id, entregasSeleccionadas.get(id)];
        })
    );

    if (!conductor || seleccionadas.size === 0 || !motivo) {
        actualizarFormulario();
        return;
    }

    procesoEnCurso = true;
    const operacionId = crypto.randomUUID();
    actualizarFormulario();
    const estado = document.getElementById("reasignarStatus");
    estado.dataset.estado = "procesando";
    estado.replaceChildren(crearSpinner({
        mensaje: `Reasignando las tarjetas al conductor ${conductor.nombre}…`
    }));

    try {
        const resultado = await confirmarReasignacion(
            tokenSesion,
            idsProcesados,
            conductor.nombre,
            motivo,
            observacion,
            operacionId,
            entregasProcesadas
        );

        estado.dataset.estado = "correcto";
        estado.textContent = resultado.mensaje || "Las tarjetas fueron reasignadas correctamente.";

        if (resultado.resumen) {
            guardarResumenCache(resultado.resumen);
        }

        // Toda reasignación vuelve a Pendiente y la nueva entrega será digital.
        pendientes = pendientes.map(function (asignacion) {
            if (!idsProcesados.includes(asignacion.id)) return asignacion;
            return {
                ...asignacion,
                conductor: conductor.nombre,
                encargado: "",
                acompanante: "",
                estatus: "Pendiente",
                entregaConductor: entregasProcesadas[asignacion.id],
                entregaPublicador: "",
                fechaAsignada: "Actualizada recientemente"
            };
        });
        guardarReasignacionCache({ pendientes, conductores, motivos });
        seleccionadas.clear();
        entregasSeleccionadas.clear();

        window.setTimeout(function () {
            procesoEnCurso = false;
            delete estado.dataset.estado;
            estado.textContent = pendientes.length
                ? ""
                : "No hay tarjetas Pendientes o Asignadas para reasignar.";
            document.getElementById("reasignarConductor").value = "";
            document.getElementById("reasignarMotivo").value = "";
            document.getElementById("reasignarObservacion").value = "";
            filtrarPendientes();
            actualizarFormulario();
        }, 1800);
    } catch (error) {
        procesoEnCurso = false;
        estado.dataset.estado = "error";
        estado.textContent = error.message;
        actualizarFormulario();
    }
}

function inicializarEventos() {
    document.getElementById("reasignarBuscar").addEventListener("input", filtrarPendientes);
    document.getElementById("reasignarLista").addEventListener("change", cambiarSeleccion);
    document.getElementById("reasignarConductor").addEventListener("change", actualizarFormulario);
    document.getElementById("reasignarMotivo").addEventListener("change", actualizarFormulario);
    document.getElementById("reasignarObservacion").addEventListener("input", actualizarFormulario);
    document.getElementById("reasignarActualizar").addEventListener("click", function () {
        cargarPendientes("Actualizando asignaciones para reasignar…");
    });
    document.getElementById("reasignarConfirmar").addEventListener("click", procesarReasignacion);
}

function inicializarReasignacion() {
    tokenSesion = obtenerTokenSesion();

    if (!tokenSesion) {
        window.location.replace(new URL("../index.html", import.meta.url).href);
        return;
    }

    inicializarEventos();
    const datosGuardados = obtenerReasignacionCache();

    if (
        datosGuardados &&
        Array.isArray(datosGuardados.pendientes) &&
        Array.isArray(datosGuardados.conductores) &&
        Array.isArray(datosGuardados.motivos)
    ) {
        pendientes = datosGuardados.pendientes;
        conductores = datosGuardados.conductores;
        motivos = datosGuardados.motivos;
        mostrarOpciones();
        filtrarPendientes();
        document.getElementById("reasignarControles").hidden = false;
        document.getElementById("reasignarStatus").textContent = pendientes.length
            ? ""
            : "No hay tarjetas Pendientes o Asignadas para reasignar.";
        document.getElementById("reasignarActualizar").disabled = false;
        actualizarFormulario();
    } else {
        cargarPendientes();
    }
}

inicializarReasignacion();
