"use client"

import { useState, useEffect } from "react"

interface AuthData {
  user: {
    id: number
    name: string
    email: string
    role: string
    permissions: string[]
  }
  message: string
}

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<AuthData["user"] | null>(null)

  useEffect(() => {
    try {
      const authDataString = localStorage.getItem("auth_data")

      if (authDataString) {
        const authData: AuthData = JSON.parse(authDataString)
        console.log("Datos cargados del localStorage:", authData)

        if (authData.user && authData.user.permissions) {
          setPermissions(authData.user.permissions)
          setUser(authData.user)
        }
      }
    } catch (error) {
      console.error("Error al cargar permisos del localStorage:", error)
      setPermissions([])
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { permissions, user, isLoading }
}
