import {
  validarSesionEnBackend
} from "./session.api.js";

import {
  obtenerTokenSesion,
  guardarSesion,
  eliminarSesion
} from "./session.storage.js";

export async function comprobarSesionActual() {
  const token = obtenerTokenSesion();

  if (!token) {
    return {
      valida: false,
      usuario: null
    };
  }

  try {
    const resultado =
      await validarSesionEnBackend(token);

    guardarSesion(
      token,
      resultado.usuario
    );

    return {
      valida: true,
      usuario: resultado.usuario,
      venceEn: resultado.venceEn
    };

  } catch (error) {
    eliminarSesion();

    return {
      valida: false,
      usuario: null
    };
  }
}