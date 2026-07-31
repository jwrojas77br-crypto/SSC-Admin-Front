import {
  enviarPost
} from "../Api/api.client.js";

export function solicitarCodigoPorCorreo(correo) {
  return enviarPost(
    "/api/auth/request-code",
    {
      correo: correo
    }
  );
}

export function verificarCodigoPorCorreo(
  correo,
  codigo
) {
  return enviarPost(
    "/api/auth/verify-code",
    {
      correo: correo,
      codigo: codigo
    }
  );
}

export function iniciarSesionConAuthenticator(
  correo,
  codigo
) {
  return enviarPost(
    "/api/auth/login-totp",
    {
      correo: correo,
      codigo: codigo
    }
  );
}