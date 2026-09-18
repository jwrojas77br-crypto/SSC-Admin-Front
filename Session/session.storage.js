import { eliminarCacheDatosApp } from "../Shared/data.cache.js";

const TOKEN_KEY =
    "sscAdminSession";

const USER_KEY =
    "sscAdminUser";

const VALIDATED_AT_KEY =
    "sscAdminSessionValidatedAt";

export function guardarSesion(
    token,
    usuario
) {
    // Un inicio de sesión nuevo no debe reutilizar datos de otro usuario.
    eliminarCacheDatosApp();

    sessionStorage.setItem(
        TOKEN_KEY,
        token
    );

    sessionStorage.setItem(
        USER_KEY,
        JSON.stringify(usuario)
    );

    sessionStorage.setItem(
        VALIDATED_AT_KEY,
        String(Date.now())
    );
}

export function eliminarSesion() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(VALIDATED_AT_KEY);
    eliminarCacheDatosApp();
}

export function obtenerTokenSesion() {
  return sessionStorage.getItem(
    TOKEN_KEY
  );
}

export function obtenerUsuarioSesion() {
  const contenido =
    sessionStorage.getItem(USER_KEY);

  if (!contenido) {
    return null;
  }

  try {
    return JSON.parse(contenido);
  } catch (error) {
    eliminarSesion();
    return null;
  }
}

/** Indica si el servidor validó esta sesión dentro del periodo permitido. */
export function obtenerSesionLocalReciente(maximoMilisegundos) {
  const token = obtenerTokenSesion();
  const usuario = obtenerUsuarioSesion();
  const validadaEn = Number(sessionStorage.getItem(VALIDATED_AT_KEY));
  const antiguedad = Date.now() - validadaEn;

  if (
    !token ||
    !usuario ||
    !Number.isFinite(validadaEn) ||
    validadaEn <= 0 ||
    antiguedad < 0 ||
    antiguedad > maximoMilisegundos
  ) {
    return null;
  }

  return { token, usuario, validadaEn };
}
