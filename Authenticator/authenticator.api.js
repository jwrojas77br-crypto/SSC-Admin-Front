import {
  enviarPost
} from "../Api/api.client.js";

export function prepararAuthenticator(token) {
  return enviarPost(
    "/api/authenticator/setup",
    {
      token: token
    }
  );
}

export function confirmarAuthenticator(
  token,
  codigo
) {
  return enviarPost(
    "/api/authenticator/confirm",
    {
      token: token,
      codigo: codigo
    }
  );
}