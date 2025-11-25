"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import useAuth from "@/hooks/use-auth"

interface UsePermissionsProps {
  requiredReadPermission: string
  requiredWritePermission?: string
  redirectOnNoAccess?: string
}

export function usePermissions({
  requiredReadPermission,
  requiredWritePermission,
  redirectOnNoAccess = "/dashboard/pages/error/403",
}: UsePermissionsProps) {
  const [loading, setLoading] = useState(true)
  const [canRead, setCanRead] = useState(false)
  const [canWrite, setCanWrite] = useState(false)
  const router = useRouter()
  const { user, permissions, hasPermission, isLoading } = useAuth()

  useEffect(() => {
    // Esperar a que termine de cargar los datos de autenticación
    if (isLoading) return

    const isValidPermissions = Array.isArray(permissions) && permissions.length > 0

    console.log("=== USE PERMISSIONS DEBUG ===")
    console.log("requiredReadPermission:", requiredReadPermission)
    console.log("permissions:", permissions)
    console.log("isValidPermissions:", isValidPermissions)
    console.log("hasReadPermission:", permissions?.includes(requiredReadPermission))
    console.log("=============================")

    // Verificar permisos de lectura
    if (isValidPermissions && !permissions.includes(requiredReadPermission)) {
      router.push(redirectOnNoAccess)
      return
    }

    // Establecer permisos
    setCanRead(isValidPermissions && permissions.includes(requiredReadPermission))

    if (requiredWritePermission) {
      setCanWrite(isValidPermissions && permissions.includes(requiredWritePermission))
    }

    setLoading(false)
  }, [router, requiredReadPermission, requiredWritePermission, redirectOnNoAccess, permissions, isLoading])

  return {
    userInfo: user,
    loading: loading || isLoading, // Combinar ambos estados de loading
    canRead,
    canWrite,
    hasPermission,
  }
}

// Componente wrapper incluido en el mismo archivo
interface PermissionWrapperProps {
  children: ReactNode
  requiredReadPermission: string
  requiredWritePermission?: string
  redirectOnNoAccess?: string
  loadingComponent?: ReactNode
}

export function PermissionWrapper({
  children,
  requiredReadPermission,
  requiredWritePermission,
  redirectOnNoAccess,
  loadingComponent = (
    <div className="flex items-center justify-center h-32">
      <div className="text-muted-foreground">Verificando permisos...</div>
    </div>
  ),
}: PermissionWrapperProps) {
  const { loading } = usePermissions({
    requiredReadPermission,
    requiredWritePermission,
    redirectOnNoAccess,
  })

  if (loading) {
    return <>{loadingComponent}</>
  }

  return <>{children}</>
}
