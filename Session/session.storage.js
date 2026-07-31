const TOKEN_KEY =
    "sscAdminSession";

const USER_KEY =
    "sscAdminUser";

export function guardarSesion(
    token,
    usuario
) {
    sessionStorage.setItem(
        TOKEN_KEY,
        token
    );

    sessionStorage.setItem(
        USER_KEY,
        JSON.stringify(usuario)
    );
}

export function eliminarSesion() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
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