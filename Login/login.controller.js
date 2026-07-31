import {
  obtenerMetodoAcceso,
  mostrarMetodoCorreo,
  mostrarMetodoAuthenticator,
  alCambiarMetodoAcceso
} from "./login.view.js";

import {
  solicitarCodigoPorCorreo,
  verificarCodigoPorCorreo,
  iniciarSesionConAuthenticator
} from "./login.api.js";

import {
  obtenerCorreo,
  obtenerCodigo,
  correoEsValido,
  codigoEsValido,
  mostrarErrorCorreo,
  habilitarBotonLogin,
  mostrarMensajeLogin,
  mostrarErrorLogin,
  mostrarCargando,
  mostrarPasoCodigo,
  mostrarPasoCorreo,
  mostrarLoginExitoso,
  seleccionarCodigo,
  alCambiarCorreo,
  alCambiarCodigo,
  alEnviarLogin,
  alCambiarCorreoSolicitado
} from "./login.view.js";

import {
  guardarSesion
} from "../Session/session.storage.js";

import {
  comprobarSesionActual
} from "../Session/session.service.js";

import {
  inicializarAuthenticator
} from "../Authenticator/authenticator.controller.js";

let pasoActual = "correo";

function manejarCambioCorreo() {
  const correoVacio =
    obtenerCorreo() === "";

  if (correoVacio) {
    mostrarErrorCorreo("");
    habilitarBotonLogin(false);
    return;
  }

  if (!correoEsValido()) {
    mostrarErrorCorreo(
      "Ingresa un correo válido."
    );

    habilitarBotonLogin(false);
    return;
  }

  mostrarErrorCorreo("");

  const puedeContinuar =
    pasoActual === "totp"
      ? codigoEsValido()
      : true;

  habilitarBotonLogin(
    puedeContinuar
  );
}

function manejarCambioCodigo() {
  const usaCodigo =
    pasoActual === "codigo" ||
    pasoActual === "totp";

  if (!usaCodigo) {
    return;
  }

  mostrarMensajeLogin("");

  habilitarBotonLogin(
    correoEsValido() &&
    codigoEsValido()
  );
}

async function manejarEnvioLogin() {
  if (pasoActual === "correo") {
    await procesarSolicitudCodigo();
    return;
  }

  if (pasoActual === "codigo") {
    await procesarVerificacionCodigo();
    return;
  }

  if (pasoActual === "totp") {
    await procesarLoginTotp();
  }
}

async function procesarSolicitudCodigo() {
  if (!correoEsValido()) {
    manejarCambioCorreo();
    return;
  }

  mostrarCargando(true);

  try {
    const resultado =
      await solicitarCodigoPorCorreo(
        obtenerCorreo()
      );

    pasoActual = "codigo";

    mostrarPasoCodigo(
      resultado.mensaje
    );

  } catch (error) {
    mostrarErrorLogin(error.message);

  } finally {
    mostrarCargando(false);

    habilitarBotonLogin(
      pasoActual === "correo"
        ? correoEsValido()
        : codigoEsValido()
    );
  }
}

async function procesarVerificacionCodigo() {
  if (!codigoEsValido()) {
    return;
  }

  mostrarCargando(true);

  try {
    const resultado =
      await verificarCodigoPorCorreo(
        obtenerCorreo(),
        obtenerCodigo()
      );

    completarAutenticacion(
      resultado
    );

  } catch (error) {
    mostrarErrorLogin(
      error.message
    );

    seleccionarCodigo();

  } finally {
    mostrarCargando(false);

    if (pasoActual === "codigo") {
      habilitarBotonLogin(
        codigoEsValido()
      );
    }
  }
}

function manejarCambioCorreoSolicitado() {
  pasoActual = "correo";

  mostrarPasoCorreo();
  manejarCambioCorreo();
}

alCambiarCorreo(manejarCambioCorreo);
alCambiarCodigo(manejarCambioCodigo);
alEnviarLogin(manejarEnvioLogin);

alCambiarCorreoSolicitado(
  manejarCambioCorreoSolicitado
);

async function inicializarLogin() {
  mostrarMensajeLogin(
    "Comprobando sesión…"
  );

  habilitarBotonLogin(false);

  const resultado =
    await comprobarSesionActual();

  if (resultado.valida) {
    pasoActual = "autenticado";

    mostrarLoginExitoso(
      resultado.usuario
    );

    inicializarAuthenticator(
      resultado.usuario
    );

    return;
  }

  mostrarMensajeLogin("");
  manejarCambioCorreo();
}

function manejarCambioMetodo(metodo) {
  mostrarErrorCorreo("");
  mostrarMensajeLogin("");

  if (metodo === "totp") {
    pasoActual = "totp";
    mostrarMetodoAuthenticator();

    habilitarBotonLogin(
      correoEsValido() &&
      codigoEsValido()
    );

    return;
  }

  pasoActual = "correo";
  mostrarMetodoCorreo();
  manejarCambioCorreo();
}

function completarAutenticacion(resultado) {
  guardarSesion(
    resultado.token,
    resultado.usuario
  );

  pasoActual = "autenticado";

  mostrarLoginExitoso(
    resultado.usuario
  );

  inicializarAuthenticator(
    resultado.usuario
  );
}

async function procesarLoginTotp() {
  if (
    !correoEsValido() ||
    !codigoEsValido()
  ) {
    manejarCambioCorreo();
    return;
  }

  mostrarCargando(true);

  try {
    const resultado =
      await iniciarSesionConAuthenticator(
        obtenerCorreo(),
        obtenerCodigo()
      );

    completarAutenticacion(resultado);

  } catch (error) {
    mostrarErrorLogin(error.message);
    seleccionarCodigo();

  } finally {
    mostrarCargando(false);

    if (pasoActual === "totp") {
      habilitarBotonLogin(
        correoEsValido() &&
        codigoEsValido()
      );
    }
  }
}

alCambiarMetodoAcceso(
  manejarCambioMetodo
);
inicializarLogin();
