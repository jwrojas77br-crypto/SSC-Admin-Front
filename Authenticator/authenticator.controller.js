import {
  iniciarConfiguracionAuthenticator,
  completarConfiguracionAuthenticator
} from "./authenticator.service.js";

import {
  mostrarPanelAuthenticator,
  mostrarConfiguracionAuthenticator,
  mostrarCargandoAuthenticator,
  mostrarErrorAuthenticator,
  mostrarAuthenticatorConfirmado,
  obtenerCodigoAuthenticator,
  alIniciarAuthenticator,
  alCambiarCodigoAuthenticator,
  alConfirmarAuthenticator
} from "./authenticator.view.js";

let eventosRegistrados = false;
let configuracionPreparada = false;

export function inicializarAuthenticator(
  usuario
) {
  mostrarPanelAuthenticator(usuario);

  if (eventosRegistrados) {
    return;
  }

  alIniciarAuthenticator(
    manejarInicioConfiguracion
  );

  alCambiarCodigoAuthenticator(
    manejarCambioCodigo
  );

  alConfirmarAuthenticator(
    manejarConfirmacion
  );

  eventosRegistrados = true;
}

async function manejarInicioConfiguracion() {
  mostrarCargandoAuthenticator(true);

  try {
    const resultado =
      await iniciarConfiguracionAuthenticator();

    configuracionPreparada = true;

    mostrarConfiguracionAuthenticator(
      resultado.secreto,
      resultado.uri
    );

  } catch (error) {
    mostrarErrorAuthenticator(
      error.message
    );

  } finally {
    mostrarCargandoAuthenticator(false);
  }
}

function manejarCambioCodigo() {
  if (configuracionPreparada) {
    mostrarErrorAuthenticator("");
  }
}

async function manejarConfirmacion() {
  if (!configuracionPreparada) {
    return;
  }

  mostrarCargandoAuthenticator(true);

  try {
    const resultado =
      await completarConfiguracionAuthenticator(
        obtenerCodigoAuthenticator()
      );

    configuracionPreparada = false;

    mostrarAuthenticatorConfirmado(
      resultado.mensaje
    );

  } catch (error) {
    mostrarErrorAuthenticator(
      error.message
    );

  } finally {
    mostrarCargandoAuthenticator(false);
  }
}