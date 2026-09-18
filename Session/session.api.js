import {
  enviarPost
} from "../Api/api.client.js";

export function validarSesionEnBackend(token) {
  return enviarPost(
    "/api/auth/validate-session",
    {
      token: token
    },
    { reintentos: 1 }
  );
}
