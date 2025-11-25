"use server";

import { cookies } from "next/headers";

// Función para controlar la obtención de las cookies SSR.
export default function cookieManagerServer(cookieName: string, responseJson: boolean = true) {
  const cookieManager = cookies().get(cookieName);
  let result;

  if (cookieManager) {
    result = responseJson
      ? JSON.parse(decodeURIComponent(cookieManager.value))
      : decodeURIComponent(cookieManager.value);
  }
  return result || null;
}
