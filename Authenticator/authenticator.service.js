import {
  prepararAuthenticator,
  confirmarAuthenticator
} from "./authenticator.api.js";

import {
  obtenerTokenSesion
} from "../Session/session.storage.js";

export function iniciarConfiguracionAuthenticator() {
  const token = obtenerTokenSesion();

  if (!token) {
    throw new Error(
      "Debes iniciar sesión para configurar Authenticator."
    );
  }

  return prepararAuthenticator(token);
}

export function completarConfiguracionAuthenticator(
  codigo
) {
  const token = obtenerTokenSesion();

  if (!token) {
    throw new Error(
      "La sesión no está disponible."
    );
  }

  return confirmarAuthenticator(
    token,
    codigo
  );
}