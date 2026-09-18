const SVG_NS = "http://www.w3.org/2000/svg";
let secuenciaSpinner = 0;

/** Crea un <path>/<circle>/etc. en el namespace SVG con los atributos dados. */
function crearNodoSvg(etiqueta, atributos) {
    const nodo = document.createElementNS(SVG_NS, etiqueta);

    Object.entries(atributos).forEach(function ([nombre, valor]) {
        nodo.setAttribute(nombre, valor);
    });

    return nodo;
}

/** Arma el <svg> de la órbita: radar, pista, arco animado y pin central. */
function crearSvgOrbita(identificador) {
    const idGradienteArco = `sscSpinnerArcGrad-${identificador}`;
    const idGradienteNucleo = `sscSpinnerCoreGrad-${identificador}`;
    const svg = crearNodoSvg("svg", {
        class: "ssc-spinner__svg",
        viewBox: "0 0 220 220",
        fill: "none"
    });

    const defs = crearNodoSvg("defs", {});

    const gradienteArco = crearNodoSvg("linearGradient", {
        id: idGradienteArco,
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%"
    });

    [
        ["0%", "#60A5FA", "1"],
        ["60%", "#3B82F6", "0.8"],
        ["100%", "#93C5FD", "0"]
    ].forEach(function ([offset, color, opacidad]) {
        gradienteArco.appendChild(
            crearNodoSvg("stop", {
                offset,
                "stop-color": color,
                "stop-opacity": opacidad
            })
        );
    });

    const gradienteNucleo = crearNodoSvg("linearGradient", {
        id: idGradienteNucleo,
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%"
    });

    [
        ["0%", "#3B82F6"],
        ["100%", "#1D4ED8"]
    ].forEach(function ([offset, color]) {
        gradienteNucleo.appendChild(
            crearNodoSvg("stop", { offset, "stop-color": color })
        );
    });

    defs.appendChild(gradienteArco);
    defs.appendChild(gradienteNucleo);
    svg.appendChild(defs);

    svg.appendChild(
        crearNodoSvg("circle", {
            class: "ssc-spinner__radar",
            cx: "110",
            cy: "110",
            r: "78",
            stroke: "#3B82F6",
            "stroke-width": "2",
            "stroke-opacity": "0.6"
        })
    );

    svg.appendChild(
        crearNodoSvg("circle", {
            class: "ssc-spinner__track",
            cx: "110",
            cy: "110",
            r: "72",
            "stroke-width": "6",
            "stroke-linecap": "round"
        })
    );

    svg.appendChild(
        crearNodoSvg("circle", {
            class: "ssc-spinner__arc",
            cx: "110",
            cy: "110",
            r: "72",
            stroke: `url(#${idGradienteArco})`,
            "stroke-width": "6",
            "stroke-linecap": "round"
        })
    );

    const nucleo = crearNodoSvg("g", { class: "ssc-spinner__core" });

    nucleo.appendChild(
        crearNodoSvg("rect", {
            x: "70",
            y: "70",
            width: "80",
            height: "80",
            rx: "22",
            fill: `url(#${idGradienteNucleo})`
        })
    );

    const pin = crearNodoSvg("g", { class: "ssc-spinner__pin" });

    pin.appendChild(
        crearNodoSvg("path", {
            "fill-rule": "evenodd",
            "clip-rule": "evenodd",
            fill: "#FFFFFF",
            d: "M110 82C99.5066 82 91 90.5066 91 101C91 113.8 106.39 129.28 108.955 131.75C109.524 132.3 110.476 132.3 111.045 131.75C113.61 129.28 129 113.8 129 101C129 90.5066 120.493 82 110 82ZM110 93.4C114.197 93.4 117.6 96.8026 117.6 101C117.6 105.197 114.197 108.6 110 108.6C105.803 108.6 102.4 105.197 102.4 101C102.4 96.8026 105.803 93.4 110 93.4Z"
        })
    );

    nucleo.appendChild(pin);
    svg.appendChild(nucleo);

    return svg;
}

/**
 * Construye el spinner reutilizable como un fragmento de DOM.
 * `mensaje` se inserta como texto, nunca como HTML.
 * `pantallaCompleta` presenta siempre el indicador con el tamaño y fondo común.
 * Puede desactivarse únicamente cuando se necesite integrarlo dentro de un bloque.
 */
export function crearSpinner({ mensaje = "", pantallaCompleta = true } = {}) {
    secuenciaSpinner += 1;
    const identificador = `${Date.now()}-${secuenciaSpinner}`;
    const contenedor = document.createElement("div");
    contenedor.className = pantallaCompleta
        ? "ssc-spinner ssc-spinner--compacto ssc-spinner--pantalla"
        : "ssc-spinner ssc-spinner--compacto";

    const orbita = document.createElement("div");
    orbita.className = "ssc-spinner__orbit";
    orbita.appendChild(crearSvgOrbita(identificador));
    contenedor.appendChild(orbita);

    if (mensaje) {
        const mensajeElemento = document.createElement("p");
        mensajeElemento.className = "ssc-spinner__message";
        mensajeElemento.textContent = mensaje;
        contenedor.appendChild(mensajeElemento);
    }

    return contenedor;
}
