import cookieManager from "@/hooks/use-cookie-manager"
import type { FetchOptions } from "@/types/fetch"

// Función para realizar peticiones estructuradas a la API de Laravel
export default async function fetchModel<T = any>(endPoint: string, options: FetchOptions = {}): Promise<T> {
  const apiLaravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API ?? "http://localhost:8000/api/"

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  }

  // Si la petición tiene un cuerpo y es de tipo FormData
  if (options.body && options.body instanceof FormData) {
    config.body = options.body
  } else if (options.body) {
    ;(config.headers as Record<string, string>)["Content-Type"] = "application/json"
    config.body = JSON.stringify(options.body)
  }

  // Si el método es POST, PUT o DELETE, agregar CSRF Token
  if (["POST", "PUT", "DELETE"].includes(config.method!)) {
    const csrfToken = await getCsrfToken()
    if (csrfToken && csrfToken !== null) {
      ;(config.headers as Record<string, string>)["X-XSRF-TOKEN"] = csrfToken
    } else {
      throw new Error("No pudimos obtener el csrf_token para validar los formularios. Inténtelo más tarde.")
    }
  }

  const response = await fetch(apiLaravelUrl + endPoint, config)

  // Verifica si la respuesta es en formato JSON
  const contentType = response.headers.get("Content-Type")

  let responseData: any

  // Corregido: Verificar el Content-Type en lugar de Accept
  if (!contentType) {
    throw new Error("No se recibió Content-Type en la respuesta.")
  }

  if (contentType.includes("application/json")) {
    responseData = await response.json() // Respuesta en JSON
  } else if (contentType.includes("application/pdf") || contentType.includes("application/octet-stream")) {
    // Si la respuesta es un archivo binario
    responseData = await response.blob()
  } else if (contentType.includes("text/plain")) {
    // Si la respuesta es texto plano
    responseData = await response.text()
  } else {
    throw new Error(`Formato de respuesta no soportado: ${contentType}`)
  }

  // Si la respuesta no es exitosa, lanza un error
  if (!response.ok) {
    const error = new Error(`Error en la petición: ${response.status} ${response.statusText}`)
    ;(error as any).data = responseData
    throw error
  }

  return responseData as T
}

// Función para obtener el csrf_token que nos valida los formularios de Laravel
const getCsrfToken = async (): Promise<string | null> => {
  const csrfCookie = cookieManager("XSRF-TOKEN", false)
  const apiLaravelTokenUrl = process.env.NEXT_PUBLIC_LARAVEL_CSRF_API ?? "http://localhost:8000/sanctum/csrf-cookie"

  if (csrfCookie) {
    return csrfCookie
  }

  const response = await fetch(apiLaravelTokenUrl, {
    credentials: "include",
  })

  const newCsrfCookie = cookieManager("XSRF-TOKEN", false)

  if (newCsrfCookie) {
    return newCsrfCookie
  }

  return null
}
