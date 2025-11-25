import type { FetchOptions } from "@/types/fetch"

// Función para realizar peticiones estructuradas a la API de FastAPI
export default async function fetchModel<T = any>(
  endPoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const apiFastAPIUrl =
    process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000/api/"

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  }

  const token = getAuthToken()
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // 🔥 Usar siempre include para que las cookies funcionen
    credentials: options.credentials || "include",
  }

  // ⚡ Manejo especial de FormData
  if (options.body) {
    if (options.body instanceof FormData) {
      config.body = options.body
      // ❌ No poner Content-Type, el navegador lo asigna
    } else {
      config.body = JSON.stringify(options.body)
      ;(config.headers as Record<string, string>)["Content-Type"] =
        "application/json"
    }
  }

  const response = await fetch(apiFastAPIUrl + endPoint, config)

  let responseJson: any
  try {
    responseJson = await response.json()
  } catch (error) {
    responseJson = { message: "Error en la respuesta del servidor" }
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_data")
      localStorage.removeItem("user_info")
      window.location.href = "/login"
    }

    const error = new Error("Sesión expirada o no autorizada") as any
    error.status = 401
    error.data = responseJson
    throw error
  }

  if (!response.ok) {
    const error = new Error(
      responseJson.detail || responseJson.message || "Error en la petición"
    )
    ;(error as any).status = response.status
    ;(error as any).data = responseJson
    throw error
  }

  // 🔑 Guardar datos de login (token + user) en localStorage
  if (endPoint.includes("login") && response.ok && responseJson.access_token) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auth_token", responseJson.access_token)
        localStorage.setItem("auth_data", JSON.stringify(responseJson))
        if (responseJson.user) {
          localStorage.setItem("user_info", JSON.stringify(responseJson.user))
        }
      } catch (error) {
        console.error("Error al guardar datos de autenticación:", error)
      }
    }
    // 🚀 devolver la respuesta tal cual, no normalizar
    return responseJson as T
  }

  // 🔥 Normalizar respuesta solo si NO es login
  const normalizeResponse = (json: any) => {
    if (Array.isArray(json)) {
      return { data: json, count: json.length }
    }

    if (json && typeof json === "object" && "data" in json && Array.isArray(json.data)) {
      return { data: json.data, count: json.count || json.data.length }
    }

    if (json && typeof json === "object" && !Array.isArray(json)) {
      return { data: [json], count: 1 }
    }

    // Si es null, undefined o un valor primitivo
    return { data: [json], count: 1 }
  }

  return normalizeResponse(responseJson) as T
}

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("auth_token")
  } catch (error) {
    console.error("Error al obtener token de autenticación:", error)
    return null
  }
}

export const logout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_data")
    localStorage.removeItem("user_info")
    window.location.href = "/login"
  }
}

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null
}
