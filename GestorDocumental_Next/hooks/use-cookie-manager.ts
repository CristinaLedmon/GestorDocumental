// Función para controlar la obtención de las cookies.
export default function cookieManager(cookieName: string, responseJson: boolean = true) {
  if (typeof window === "undefined") {
    return null; // Función para evitar renderizar si se pone como SSR.
  }
  const cookieManager = document.cookie.split("; ").find((row) => row.startsWith(cookieName + "="));
  let cookieManagerParse = [];
  let result;

  if (cookieManager) {
    const cookieManagerData = cookieManager.split("=")[1];
    if (responseJson) {
      cookieManagerParse = JSON.parse(decodeURIComponent(cookieManagerData));
      result = cookieManagerParse;
    } else {
      result = decodeURIComponent(cookieManagerData);
    }
  }

  return result;
}
