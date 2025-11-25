import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // El middleware de Next.js no puede acceder a localStorage directamente
  // Por lo tanto, solo verificamos rutas públicas vs protegidas

  const publicRoutes = ["/dashboard/login", "/dashboard/register"]
  const redirectToHomeRoutes = ["/", "/dashboard"]

  const protectedRoutes: string[] = [
    "/dashboard/users",
    "/dashboard/permissions",
    "/dashboard/roles",
    "/dashboard/home",
  ]

  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (redirectToHomeRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard/home", request.url))
  }

  // Permitir acceso a rutas públicas
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Las rutas protegidas se verificarán en el cliente con localStorage
  // Si no hay token, el componente redirigirá a login
  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
}
