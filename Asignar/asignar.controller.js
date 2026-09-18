import { consultarDatosAsignacion } from "./asignar.api.js";
import { obtenerTokenSesion } from "../Session/session.storage.js";
import { crearSpinner } from "../Shared/spinner.js";
import {
    guardarAsignacionCache,
    obtenerAsignacionCache
} from "../Shared/data.cache.js";
import {
    eliminarSeleccionAsignacion,
    guardarSeleccionAsignacion,
    obtenerSeleccionAsignacion
} from "./asignacion.storage.js";

let tokenSesion = "";
let territorios = [];
let tarjetasDisponibles = [];
let conductores = [];
let detalleActual = null;
const seleccionadas = new Map();

function mostrarOpcionesIniciales() {
    const selectorConductor = document.getElementById("asignarConductor");
    const selectorTerritorio = document.getElementById("asignarTerritorio");

    selectorConductor.replaceChildren(new Option("Seleccionar conductor…", ""));
    conductores.forEach(function (conductor, indice) {
        selectorConductor.add(new Option(conductor.nombre, String(indice)));
    });

    selectorTerritorio.replaceChildren(new Option("Seleccionar territorio…", ""));
    territorios.forEach(function (territorio) {
        const cantidad = Number(territorio.cantidad) || 0;
        const texto = `${territorio.numero} ${territorio.barrio} · ` +
            `${cantidad} ${cantidad === 1 ? "tarjeta" : "tarjetas"}`;
        selectorTerritorio.add(new Option(texto, territorio.numero));
    });

    selectorConductor.disabled = conductores.length === 0;
    selectorTerritorio.disabled = territorios.length === 0;
}

function validarDatosAsignacion(resultado) {
    if (
        !Array.isArray(resultado.territorios) ||
        !Array.isArray(resultado.tarjetas) ||
        !Array.isArray(resultado.conductores)
    ) {
        throw new Error("El servidor devolvió datos no válidos.");
    }
}

/** Actualiza los datos sin perder las selecciones que todavía son válidas. */
async function actualizarDatosAsignacion() {
    const estado = document.getElementById("asignarStatus");
    const botonActualizar = document.getElementById("asignarActualizar");
    const selectorConductor = document.getElementById("asignarConductor");
    const selectorTerritorio = document.getElementById("asignarTerritorio");
    const valorConductorAnterior = selectorConductor.value;
    const conductorAnterior = valorConductorAnterior === ""
        ? null
        : conductores[Number(valorConductorAnterior)];
    const territorioAnterior = selectorTerritorio.value;

    botonActualizar.disabled = true;
    estado.replaceChildren(
        crearSpinner({ mensaje: "Actualizando los datos de asignación…" })
    );

    try {
        const resultado = await consultarDatosAsignacion(tokenSesion);
        validarDatosAsignacion(resultado);

        territorios = resultado.territorios;
        tarjetasDisponibles = resultado.tarjetas;
        conductores = resultado.conductores;
        guardarAsignacionCache({ territorios, tarjetas: tarjetasDisponibles, conductores });

        const idsDisponibles = new Set(
            tarjetasDisponibles.map(function (tarjeta) {
                return tarjeta.id;
            })
        );

        seleccionadas.forEach(function (elemento, id) {
            if (!idsDisponibles.has(id)) {
                seleccionadas.delete(id);
            }
        });

        mostrarOpcionesIniciales();
        document.getElementById("asignarControles").hidden = false;

        if (conductorAnterior) {
            const nuevoIndice = conductores.findIndex(function (conductor) {
                return conductor.nombre === conductorAnterior.nombre;
            });

            if (nuevoIndice >= 0) {
                selectorConductor.value = String(nuevoIndice);
            }
        }

        if (territorios.some(function (territorio) {
            return territorio.numero === territorioAnterior;
        })) {
            selectorTerritorio.value = territorioAnterior;
        }

        cambiarTerritorio();
        actualizarResumenSeleccion();
        estado.textContent = "Datos actualizados correctamente.";
    } catch (error) {
        estado.textContent = "No se pudieron actualizar los datos. " + error.message;
    } finally {
        botonActualizar.disabled = false;
    }
}

/** Recupera la selección cuando el usuario vuelve desde el resumen. */
function restaurarSeleccionPendiente() {
    const seleccion = obtenerSeleccionAsignacion();
    const idsDisponibles = new Set(
        tarjetasDisponibles.map(function (tarjeta) {
            return tarjeta.id;
        })
    );

    if (!seleccion || !seleccion.conductor || !Array.isArray(seleccion.grupos)) {
        return;
    }

    const indiceConductor = conductores.findIndex(function (conductor) {
        return conductor.nombre === seleccion.conductor.nombre;
    });

    if (indiceConductor >= 0) {
        document.getElementById("asignarConductor").value = String(indiceConductor);
    }

    seleccion.grupos.forEach(function (grupo) {
        if (!grupo.territorio || !Array.isArray(grupo.tarjetas)) {
            return;
        }

        grupo.tarjetas.forEach(function (tarjeta) {
            if (tarjeta && tarjeta.id && idsDisponibles.has(tarjeta.id)) {
                seleccionadas.set(tarjeta.id, {
                    territorio: grupo.territorio,
                    tarjeta,
                    entregaConductor: tarjeta.entregaConductor || ""
                });
            }
        });
    });
}

function textoTransporte(tarjeta) {
    const valor = tarjeta.minutosCaminando;
    const minutos = Number(valor);
    const tiempoValido = valor !== null && valor !== undefined &&
        String(valor).trim() !== "" && Number.isFinite(minutos);
    const transporte = tarjeta.deCarro ? "Carro" : "Caminando";
    const tiempo = tiempoValido
        ? `${minutos} min${tarjeta.deCarro ? " a pie" : ""}`
        : "Tiempo no indicado";

    return `${transporte} · ${tiempo}`;
}

function mostrarTarjetas(tarjetas) {
    const lista = document.getElementById("asignarTarjetas");
    const plantilla = document.getElementById("asignarTarjetaTemplate");
    const fragmento = document.createDocumentFragment();

    tarjetas.forEach(function (tarjeta) {
        const copia = plantilla.content.cloneNode(true);
        const casilla = copia.querySelector(".ssc-asignar__checkbox");
        const entrega = copia.querySelector(".ssc-asignar__delivery");
        const opcionesEntrega = copia.querySelectorAll(".ssc-asignar__delivery-option");
        const seleccionAnterior = seleccionadas.get(tarjeta.id);

        copia.querySelector(".ssc-asignar__card-title").textContent =
            `Tarjeta ${tarjeta.id}`;
        copia.querySelector(".ssc-asignar__card-meta").textContent =
            textoTransporte(tarjeta);
        casilla.value = tarjeta.id;
        casilla.checked = Boolean(seleccionAnterior);
        casilla.disabled = !tarjeta.tieneDigital && !tarjeta.tieneFisica;
        casilla.setAttribute("aria-label", `Seleccionar tarjeta ${tarjeta.id}`);

        opcionesEntrega.forEach(function (opcion) {
            opcion.name = `entrega-${tarjeta.id}`;
            opcion.dataset.tarjetaId = tarjeta.id;
            opcion.disabled = opcion.value === "Digital"
                ? !tarjeta.tieneDigital
                : !tarjeta.tieneFisica;
            opcion.checked = seleccionAnterior?.entregaConductor === opcion.value;
        });
        entrega.hidden = !casilla.checked;

        if (casilla.disabled) {
            copia.querySelector(".ssc-asignar__card-meta").textContent +=
                " · Sin formato disponible";
        }
        fragmento.appendChild(copia);
    });

    lista.replaceChildren(fragmento);
}

function actualizarResumenSeleccion() {
    const cantidad = seleccionadas.size;
    const territoriosElegidos = new Set(
        Array.from(seleccionadas.values(), function (elemento) {
            return elemento.territorio.numero;
        })
    ).size;

    const boton = document.getElementById("asignarRevisar");
    const conductorElegido = document.getElementById("asignarConductor").value !== "";
    const entregasCompletas = Array.from(seleccionadas.values()).every(function (elemento) {
        return ["Digital", "Física"].includes(elemento.entregaConductor);
    });
    document.getElementById("asignarSeleccionActual").textContent = cantidad
        ? `${cantidad} seleccionada${cantidad === 1 ? "" : "s"}` +
            (entregasCompletas ? "" : " · indica el formato")
        : "";
    boton.disabled = !conductorElegido || cantidad === 0 || !entregasCompletas;
    boton.textContent = cantidad
        ? `Revisar ${cantidad} tarjeta${cantidad === 1 ? "" : "s"} · ` +
            `${territoriosElegidos} territorio${territoriosElegidos === 1 ? "" : "s"}`
        : "Revisar asignación";
}

function cambiarSeleccionTarjeta(evento) {
    const opcionEntrega = evento.target.closest(".ssc-asignar__delivery-option");

    if (opcionEntrega) {
        const seleccion = seleccionadas.get(opcionEntrega.dataset.tarjetaId);

        if (seleccion) {
            seleccion.entregaConductor = opcionEntrega.value;
            actualizarResumenSeleccion();
        }
        return;
    }

    const casilla = evento.target.closest(".ssc-asignar__checkbox");

    if (!casilla || !detalleActual) {
        return;
    }

    const tarjeta = detalleActual.tarjetas.find(function (elemento) {
        return elemento.id === casilla.value;
    });

    if (!tarjeta) {
        return;
    }

    if (casilla.checked) {
        let entregaConductor = "";

        if (tarjeta.tieneDigital && !tarjeta.tieneFisica) entregaConductor = "Digital";
        if (!tarjeta.tieneDigital && tarjeta.tieneFisica) entregaConductor = "Física";

        seleccionadas.set(tarjeta.id, {
            territorio: detalleActual.territorio,
            tarjeta,
            entregaConductor
        });
    } else {
        seleccionadas.delete(tarjeta.id);
    }

    mostrarTarjetas(detalleActual.tarjetas);
    actualizarResumenSeleccion();
}

function cambiarTerritorio() {
    const numero = document.getElementById("asignarTerritorio").value;
    const estado = document.getElementById("asignarTarjetasStatus");
    const lista = document.getElementById("asignarTarjetas");

    detalleActual = null;
    lista.replaceChildren();

    if (!numero) {
        estado.textContent = "Selecciona un territorio para ver sus tarjetas.";
        return;
    }

    const territorio = territorios.find(function (elemento) {
        return elemento.numero === numero;
    });
    const tarjetas = tarjetasDisponibles.filter(function (tarjeta) {
        return tarjeta.territorio === numero;
    });

    if (!territorio) {
        estado.textContent = "El territorio seleccionado no está disponible.";
        return;
    }

    detalleActual = { territorio, tarjetas };
    mostrarTarjetas(tarjetas);
    actualizarResumenSeleccion();
    estado.textContent = tarjetas.length
        ? ""
        : "Este territorio no tiene tarjetas disponibles.";
}

function abrirResumen() {
    const valorConductor = document.getElementById("asignarConductor").value;

    if (valorConductor === "") {
        actualizarResumenSeleccion();
        return;
    }

    const indiceConductor = Number(valorConductor);
    const conductor = conductores[indiceConductor];

    if (!conductor || seleccionadas.size === 0) {
        actualizarResumenSeleccion();
        return;
    }

    const gruposPorTerritorio = new Map();

    seleccionadas.forEach(function (elemento) {
        const numero = elemento.territorio.numero;

        if (!gruposPorTerritorio.has(numero)) {
            gruposPorTerritorio.set(numero, {
                territorio: elemento.territorio,
                tarjetas: []
            });
        }

        gruposPorTerritorio.get(numero).tarjetas.push({
            ...elemento.tarjeta,
            entregaConductor: elemento.entregaConductor
        });
    });

    guardarSeleccionAsignacion({
        conductor,
        grupos: Array.from(gruposPorTerritorio.values())
    });

    window.location.assign(new URL("./Resumen/resumen.html", import.meta.url).href);
}

async function inicializarAsignar() {
    const estado = document.getElementById("asignarStatus");
    const botonActualizar = document.getElementById("asignarActualizar");
    const parametros = new URLSearchParams(window.location.search);

    // Entrar desde Inicio comienza una asignación nueva. La selección se
    // conserva únicamente cuando se regresa desde la pantalla de resumen.
    if (parametros.get("nueva") === "1") {
        eliminarSeleccionAsignacion();
        seleccionadas.clear();

        const urlLimpia = new URL(window.location.href);
        urlLimpia.searchParams.delete("nueva");
        window.history.replaceState(window.history.state, "", urlLimpia.href);
    }

    tokenSesion = obtenerTokenSesion();

    if (!tokenSesion) {
        window.location.replace(new URL("../index.html", import.meta.url).href);
        return;
    }

    botonActualizar.addEventListener("click", actualizarDatosAsignacion);
    document.getElementById("asignarConductor")
        .addEventListener("change", actualizarResumenSeleccion);
    document.getElementById("asignarTerritorio")
        .addEventListener("change", cambiarTerritorio);
    document.getElementById("asignarTarjetas")
        .addEventListener("change", cambiarSeleccionTarjeta);
    document.getElementById("asignarRevisar")
        .addEventListener("click", abrirResumen);

    const datosGuardados = obtenerAsignacionCache();

    if (datosGuardados) {
        try {
            validarDatosAsignacion(datosGuardados);
            territorios = datosGuardados.territorios;
            tarjetasDisponibles = datosGuardados.tarjetas;
            conductores = datosGuardados.conductores;
            mostrarOpcionesIniciales();
            restaurarSeleccionPendiente();
            document.getElementById("asignarControles").hidden = false;
            estado.textContent = "";
            botonActualizar.disabled = false;
            actualizarResumenSeleccion();
            return;
        } catch (error) {
            // Si el contenido local no tiene la estructura esperada, consulta al servidor.
        }
    }

    estado.replaceChildren(crearSpinner({ mensaje: "Cargando datos de asignación…" }));

    try {
        const resultado = await consultarDatosAsignacion(tokenSesion);

        validarDatosAsignacion(resultado);

        territorios = resultado.territorios;
        tarjetasDisponibles = resultado.tarjetas;
        conductores = resultado.conductores;
        guardarAsignacionCache({ territorios, tarjetas: tarjetasDisponibles, conductores });
        mostrarOpcionesIniciales();
        restaurarSeleccionPendiente();

        document.getElementById("asignarControles").hidden = false;
        estado.textContent = "";
        botonActualizar.disabled = false;
        actualizarResumenSeleccion();
    } catch (error) {
        estado.textContent = "No se pudo preparar la asignación. " + error.message;
        botonActualizar.disabled = false;
    }
}

inicializarAsignar();
