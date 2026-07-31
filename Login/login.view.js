const loginForm =
  document.getElementById("loginForm");

const codeStep =
  document.getElementById("codeStep");

const accessCodeInput =
  document.getElementById("accessCode");

const loginButtonText =
  document.getElementById("loginButtonText");

const loginHint =
  document.getElementById("loginHint");

const changeEmailButton =
  document.getElementById("changeEmailButton");

const emailInput =
  document.getElementById("email");

const loginButton =
  document.getElementById("loginButton");

const emailValidation =
  document.getElementById("emailValidation");

const loginMessage =
  document.getElementById("loginMessage");

const authMethod =
  document.getElementById("authMethod");

const authMethodInputs =
  document.querySelectorAll(
    'input[name="authMethod"]'
  );

export function obtenerCorreo() {
  return emailInput.value.trim();
}

export function correoEsValido() {
  const correo = obtenerCorreo();

  return (
    correo !== "" &&
    emailInput.checkValidity()
  );
}

export function mostrarErrorCorreo(mensaje) {
  emailValidation.textContent = mensaje;
}

export function habilitarBotonLogin(habilitado) {
  loginButton.disabled = !habilitado;
}

export function mostrarMensajeLogin(mensaje) {
  loginMessage.textContent = mensaje;
}

export function mostrarCargando(cargando) {
  loginButton.disabled = cargando;

  loginButton.classList.toggle(
    "loading",
    cargando
  );

  if (cargando) {
    mostrarMensajeLogin("Conectando…");
  }
}

export function mostrarPasoCodigo(mensaje) {
  emailInput.readOnly = true;
  codeStep.hidden = false;
  changeEmailButton.hidden = false;

  loginButtonText.textContent =
    "Verificar código";

  loginHint.textContent = mensaje;
  loginMessage.textContent = "";

  accessCodeInput.focus();
}

export function mostrarErrorLogin(mensaje) {
  loginMessage.classList.remove("success");
  loginMessage.textContent = mensaje;
}

export function alCambiarCorreo(manejador) {
  emailInput.addEventListener(
    "input",
    manejador
  );
}

export function alEnviarLogin(manejador) {
  loginForm.addEventListener(
    "submit",
    function (evento) {
      evento.preventDefault();
      manejador();
    }
  );
}

export function alCambiarCodigo(manejador) {
  accessCodeInput.addEventListener(
    "input",
    function () {
      accessCodeInput.value =
        accessCodeInput.value
          .replace(/\D/g, "")
          .slice(0, 6);

      manejador(accessCodeInput.value);
    }
  );
}

export function alCambiarCorreoSolicitado(
  manejador
) {
  changeEmailButton.addEventListener(
    "click",
    manejador
  );
}

export function obtenerCodigo() {
  return accessCodeInput.value;
}

export function codigoEsValido() {
  return obtenerCodigo().length === 6;
}

export function mostrarLoginExitoso(usuario) {
  authMethod.hidden = true;

  const saludo = usuario.nombre
    ? "Bienvenido, " + usuario.nombre + "."
    : "Bienvenido.";

  emailInput.value =
    usuario.correo || emailInput.value;

  emailInput.readOnly = true;

  accessCodeInput.value = "";
  codeStep.hidden = true;

  loginMessage.classList.add("success");
  loginMessage.textContent = saludo;

  loginHint.textContent =
    "Inicio de sesión completado.";

  loginButton.hidden = true;
  changeEmailButton.hidden = true;
}

export function seleccionarCodigo() {
  accessCodeInput.focus();
  accessCodeInput.select();
}

export function mostrarPasoCorreo() {
  authMethod.hidden = false;
  
  emailInput.readOnly = false;

  accessCodeInput.value = "";
  codeStep.hidden = true;

  changeEmailButton.hidden = true;
  loginButton.hidden = false;

  loginButtonText.textContent =
    "Enviar código";

  loginHint.textContent =
    "Te enviaremos un código de acceso a tu correo";

  loginMessage.textContent = "";
  loginMessage.classList.remove("success");

  emailInput.focus();
}

export function obtenerMetodoAcceso() {
  const seleccionado =
    document.querySelector(
      'input[name="authMethod"]:checked'
    );

  return seleccionado
    ? seleccionado.value
    : "email";
}

export function alCambiarMetodoAcceso(
  manejador
) {
  authMethodInputs.forEach(
    function (input) {
      input.addEventListener(
        "change",
        function () {
          manejador(input.value);
        }
      );
    }
  );
}

export function mostrarMetodoCorreo() {
  emailInput.readOnly = false;

  accessCodeInput.value = "";
  codeStep.hidden = true;

  loginButton.hidden = false;
  changeEmailButton.hidden = true;

  loginButtonText.textContent =
    "Enviar código";

  loginHint.textContent =
    "Te enviaremos un código de acceso a tu correo";

  loginMessage.textContent = "";
}

export function mostrarMetodoAuthenticator() {
  emailInput.readOnly = false;

  accessCodeInput.value = "";
  codeStep.hidden = false;

  loginButton.hidden = false;
  changeEmailButton.hidden = true;

  loginButtonText.textContent =
    "Entrar con Authenticator";

  loginHint.textContent =
    "Introduce el código actual de la aplicación";

  loginMessage.textContent = "";

  accessCodeInput.focus();
}