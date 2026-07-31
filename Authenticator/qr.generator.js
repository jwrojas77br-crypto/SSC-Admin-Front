export function generarQrAuthenticator(
  contenedor,
  uri
) {
  if (!window.QRCode) {
    throw new Error(
      "El generador de QR no está disponible."
    );
  }

  contenedor.innerHTML = "";

  new window.QRCode(
    contenedor,
    {
      text: uri,
      width: 200,
      height: 200,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel:
        window.QRCode.CorrectLevel.M
    }
  );
}