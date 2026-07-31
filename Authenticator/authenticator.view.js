import {
    generarQrAuthenticator
} from "./qr.generator.js";

const panel =
    document.getElementById(
        "authenticatorPanel"
    );

const status =
    document.getElementById(
        "authenticatorStatus"
    );

const startButton =
    document.getElementById(
        "startAuthenticatorButton"
    );

const setup =
    document.getElementById(
        "authenticatorSetup"
    );

const qrContainer =
    document.getElementById(
        "authenticatorQr"
    );

const secretElement =
    document.getElementById(
        "authenticatorSecret"
    );

const codeInput =
    document.getElementById(
        "authenticatorCode"
    );

const message =
    document.getElementById(
        "authenticatorMessage"
    );

const confirmButton =
    document.getElementById(
        "confirmAuthenticatorButton"
    );

export function mostrarPanelAuthenticator(
    usuario
) {
    panel.hidden = false;

    if (usuario.authenticatorActivo) {
        status.textContent =
            "Google Authenticator está activo.";

        startButton.hidden = true;
        setup.hidden = true;
        return;
    }

    status.textContent =
        "Configura una segunda opción de acceso.";

    startButton.hidden = false;
    setup.hidden = true;
}

export function mostrarConfiguracionAuthenticator(
    secreto,
    uri
) {
    startButton.hidden = true;
    setup.hidden = false;

    secretElement.textContent = secreto;

    generarQrAuthenticator(
        qrContainer,
        uri
    );

    message.textContent =
        "Escanea el QR o introduce la clave manual.";

    codeInput.value = "";
    confirmButton.disabled = true;

    codeInput.focus();
}

export function mostrarCargandoAuthenticator(
    cargando
) {
    startButton.disabled = cargando;

    if (cargando) {
        confirmButton.disabled = true;
        message.textContent = "Procesando…";
        return;
    }

    confirmButton.disabled =
        obtenerCodigoAuthenticator().length !== 6;
}

export function mostrarErrorAuthenticator(
    texto
) {
    message.classList.remove("success");
    message.textContent = texto;
}

export function mostrarAuthenticatorConfirmado(
    texto
) {
    message.classList.add("success");
    message.textContent = texto;

    codeInput.value = "";
    codeInput.disabled = true;
    confirmButton.hidden = true;

    status.textContent =
        "Google Authenticator está activo.";
}

export function obtenerCodigoAuthenticator() {
    return codeInput.value;
}

export function alIniciarAuthenticator(
    manejador
) {
    startButton.addEventListener(
        "click",
        manejador
    );
}

export function alCambiarCodigoAuthenticator(
    manejador
) {
    codeInput.addEventListener(
        "input",
        function () {
            codeInput.value = codeInput.value
                .replace(/\D/g, "")
                .slice(0, 6);

            const esValido =
                codeInput.value.length === 6;

            confirmButton.disabled = !esValido;

            manejador(codeInput.value);
        }
    );
}

export function alConfirmarAuthenticator(
    manejador
) {
    confirmButton.addEventListener(
        "click",
        manejador
    );
}