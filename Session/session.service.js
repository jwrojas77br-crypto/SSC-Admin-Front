import {
  validarSesionEnBackend
} from "./session.api.js";

import {
  obtenerTokenSesion,
  obtenerUsuarioSesion,
  obtenerSesionLocalReciente,
  guardarSesion,
  eliminarSesion
} from "./session.storage.js";

// Evita validar nuevamente al navegar durante una jornada completa.
const VIGENCIA_VALIDACION_LOCAL = 24 * 60 * 60 * 1000;

export async function comprobarSesionActual({ forzar = false } = {}) {
  const token = obtenerTokenSesion();

  if (!token) {
    return {
      valida: false,
      usuario: null
    };
  }

  if (!forzar) {
    const sesionReciente = obtenerSesionLocalReciente(
      VIGENCIA_VALIDACION_LOCAL
    );

    if (sesionReciente) {
      return {
        valida: true,
        usuario: sesionReciente.usuario,
        desdeCache: true
      };
    }
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
    // Solo elimina las credenciales cuando el servidor confirma su invalidez.
    if (error.codigo === "SESION_NO_VALIDA") {
      eliminarSesion();

      return {
        valida: false,
        usuario: null
      };
    }

    const usuarioGuardado = obtenerUsuarioSesion();

    if (usuarioGuardado) {
      return {
        valida: true,
        usuario: usuarioGuardado,
        temporal: true
      };
    }

    return {
      valida: false,
      usuario: null
    };
  }
}
