import Link from "next/link"
import { ShieldX, Home, ArrowLeft, Lock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-muted/40 p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-t-4 border-t-destructive bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 bg-destructive/5 border-b">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 rounded-full animate-pulse"></div>
                <div className="relative bg-destructive/10 p-6 rounded-full">
                  <ShieldX className="h-16 w-16 text-destructive" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Badge variant="destructive" className="text-lg px-4 py-2 font-bold">
                ERROR 403
              </Badge>
              <CardTitle className="text-3xl font-bold text-foreground">Acceso Denegado</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Mensaje principal */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <span className="text-lg">Permisos Insuficientes</span>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                No tienes los permisos necesarios para acceder a esta sección del sistema. Si crees que esto es un
                error, contacta con tu administrador.
              </p>
            </div>

            <Separator className="my-6" />

            {/* Información adicional */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">¿Qué puedes hacer?</span>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Verifica que tienes los permisos correctos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Contacta con tu administrador del sistema
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Regresa a una sección permitida
                </li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1" size="lg">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Ir al Dashboard
                </Link>
              </Button>

              <Button asChild variant="outline" className="flex-1" size="lg">
                <Link href="javascript:history.back()" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver Atrás
                </Link>
              </Button>
            </div>

            {/* Información de contacto */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                ¿Necesitas ayuda? Contacta con el{" "}
                <Link href="mailto:admin@tuempresa.com" className="text-primary hover:underline font-medium">
                  administrador del sistema
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Decoración adicional */}
        <div className="flex justify-center mt-8 space-x-2">
          <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  )
}
