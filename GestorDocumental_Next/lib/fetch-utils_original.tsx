import type { FetchOptions } from "@/types/fetch"

let csrfTokenFetched = false

// Función para obtener el CSRF token de Sanctum
async function getCsrfToken(): Promise<void> {
  if (csrfTokenFetched) return

  // Obtener la URL base sin el prefijo /api
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
  const baseUrl = apiUrl.replace(/\/api\/?$/, "") // Remover /api del final si existe

  try {
    await fetch(`${baseUrl}/sanctum/csrf-cookie`, {
      method: "GET",
      credentials: "include",
    })
    csrfTokenFetched = true
    await new Promise((resolve) => setTimeout(resolve, 100))
  } catch (error) {
    console.error("Error al obtener CSRF token:", error)
  }
}

// Función para realizar peticiones a la API de Laravel con Sanctum
export default async function fetchModel<T = any>(endPoint: string, options: FetchOptions = {}): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/"

  if (options.method && ["POST", "PUT", "DELETE", "PATCH"].includes(options.method.toUpperCase())) {
    await getCsrfToken()
  }

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  }

  const csrfToken = getCookie("XSRF-TOKEN")
  if (csrfToken) {
    defaultHeaders["X-XSRF-TOKEN"] = decodeURIComponent(csrfToken)
  }

  const token = getAuthToken()
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  console.log("[DEBUG] Token agregado al header:", token)

  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  }

  // Manejo especial de FormData
  if (options.body) {
    if (options.body instanceof FormData) {
      config.body = options.body
      // No poner Content-Type, el navegador lo asigna automáticamente
    } else {
      config.body = JSON.stringify(options.body)
      ;(config.headers as Record<string, string>)["Content-Type"] = "application/json"
    }
  }

  const response = await fetch(apiUrl + endPoint, config)

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
      window.location.href = "/dashboard/login"
    }

    const error = new Error("Sesión expirada o no autorizada") as any
    error.status = 401
    error.data = responseJson
    throw error
  }

  if (!response.ok) {
    const error = new Error(responseJson.detail || responseJson.message || "Error en la petición")
    ;(error as any).status = response.status
    ;(error as any).data = responseJson
    throw error
  }

  if (endPoint.includes("login") && response.ok && responseJson.token) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auth_token", responseJson.token)
        localStorage.setItem("auth_data", JSON.stringify(responseJson))
        if (responseJson.user) {
          localStorage.setItem("user_info", JSON.stringify(responseJson.user))
        }
      } catch (error) {
        console.error("Error al guardar datos de autenticación:", error)
      }
    }
    return responseJson as T
  }

  // Normalizar respuesta
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

    return { data: [json], count: 1 }
  }

  return normalizeResponse(responseJson) as T
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
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

export const logout = async (): Promise<void> => {
  try {
    await fetchModel("logout", { method: "POST" })
  } catch (error) {
    console.error("Error al hacer logout:", error)
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_data")
      localStorage.removeItem("user_info")
      csrfTokenFetched = false
      window.location.href = "/dashboard/login"
    }
  }
}

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null
}
