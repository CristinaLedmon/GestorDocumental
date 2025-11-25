import type { FetchOptions } from "@/types/fetch"

// Obtener token de localStorage
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("auth_token")
  } catch (error) {
    console.error("Error al obtener token de autenticación:", error)
    return null
  }
}

// Obtener cookie CSRF
const getCsrfCookie = async (): Promise<void> => {
  const res = await fetch("http://localhost:8000/sanctum/csrf-cookie", {
    method: "GET",
    credentials: "include",
  })
  if (!res.ok) throw new Error("No se pudo obtener la cookie CSRF")
}

// Función principal de fetch
export default async function fetchModel<T = any>(
  endPoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/"

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  }

  const token = getAuthToken()
  if (token) defaultHeaders.Authorization = `Bearer ${token}`

  const method = options.method?.toUpperCase() || "GET"

  // Para métodos stateful, obtener CSRF y enviar X-XSRF-TOKEN automáticamente
  const statefulMethods = ["POST", "PUT", "PATCH", "DELETE"]
  if (statefulMethods.includes(method)) {
    await getCsrfCookie()
    // Obtener token CSRF desde cookie
    const xsrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1]
    if (xsrfToken) defaultHeaders["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken)
  }

  const config: RequestInit = {
    method,
    headers: { ...defaultHeaders, ...options.headers },
    credentials: "include",
  }

  if (options.body) {
    if (options.body instanceof FormData) {
      config.body = options.body
    } else {
      config.body = JSON.stringify(options.body)
      ;(config.headers as Record<string, string>)["Content-Type"] = "application/json"
    }
  }

  const response = await fetch(apiUrl + endPoint, config)

  let responseJson: any
  try {
    responseJson = await response.json()
  } catch {
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

  // Guardar token al login
  if (endPoint.includes("login") && response.ok && responseJson.token) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auth_token", responseJson.token)
        localStorage.setItem("auth_data", JSON.stringify(responseJson))
        if (responseJson.user) localStorage.setItem("user_info", JSON.stringify(responseJson.user))
      } catch (error) {
        console.error("Error al guardar datos de autenticación:", error)
      }
    }
    return responseJson as T
  }

  // Normalizar respuesta
  const normalizeResponse = (json: any) => {
    if (Array.isArray(json)) return { data: json, count: json.length }
    if (json && typeof json === "object" && "data" in json && Array.isArray(json.data)) {
      return { data: json.data, count: json.count || json.data.length }
    }
    if (json && typeof json === "object" && !Array.isArray(json)) return { data: [json], count: 1 }
    return { data: [json], count: 1 }
  }

  return normalizeResponse(responseJson) as T
}

// Logout
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
      window.location.href = "/dashboard/login"
    }
  }
}

// Chequear autenticación
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null
}

export { getCsrfCookie }
