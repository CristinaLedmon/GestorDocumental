"use client"

import Logo from "@/components/layout/logo"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import fetchModel, { getCsrfCookie } from "@/lib/fetch-utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface LoginResponse {
  token: string
  user: {
    id: number
    name: string
    email: string
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1️⃣ Obtener cookie CSRF
      await getCsrfCookie()

      // 2️⃣ Hacer login
      const response = await fetchModel<LoginResponse>("login", {
        method: "POST",
        body: { email, password },
      })

      console.log("[v1] Login response:", response)

      toast({ title: "Inicio de sesión exitoso", description: "Bienvenido de vuelta!" })
      router.replace("/dashboard/home")
    } catch (error: any) {
      console.error("[v1] Login error:", error)
      toast({
        title: "Error inicio sesión",
        description: error.message || "Credenciales incorrectas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex pb-8 lg:h-screen lg:pb-0">
      <div className="hidden w-1/2 bg-gray-100 lg:block">
        <img
          src={`${process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL}/images/cover.png`}
          alt="Login visual"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md space-y-8 px-4">
          <div className="text-center">
            <Logo className="flex justify-center" width="w-72" />
            <p className="mt-2 text-sm text-gray-600">
              Por favor introduzca sus credenciales para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="sr-only">Dirección de correo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full"
                  placeholder="Dirección de correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password" className="sr-only">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="text-end">
                <Link href="/dashboard/forgot-password" className="ml-auto inline-block text-sm underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" variant={"default"} disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
