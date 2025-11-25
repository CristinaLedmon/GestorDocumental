import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")


  const publicRoutes = ["/dashboard/login", "/dashboard/register"]
  const redirectToHomeRoutes = ["/", "/dashboard"]

  const protectedRoutes: string[] = [
    // "/dashboard/users",
    // "/dashboard/permissions",
    // "/dashboard/roles"
  ]

  // Si no hay token y no es login/register => redirige a login
    console.log("TOKEN ACTUAL EN STORAGE=" + token)
  if (!token) {
        console.log("TOKEN ACTUAL EN STORAGE=" + token)
    if (!publicRoutes.includes(request.nextUrl.pathname)) {
      const response = NextResponse.redirect(new URL("/dashboard/login", request.url))
      response.cookies.delete("access_token")
      return response
    }
  }

  // Si hay token, redirige rutas base a /dashboard/map
  if (token) {
    if (redirectToHomeRoutes.includes(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/dashboard/map", request.url))
    }

    // TODO: Implementar verificación de roles cuando sea necesario
    // Para esto necesitarías decodificar el JWT o hacer una llamada al backend
    // para obtener la información del usuario y sus roles

    // Ejemplo de verificación de roles (comentado hasta que implementes la lógica):
    /*
    const roleAccessMap: { [key: string]: string[] } = {
      "/dashboard/users": ["admin"],
      "/dashboard/permissions": ["admin"],
      "/dashboard/roles": ["admin"]
    };

    for (const route of protectedRoutes) {
      if (request.nextUrl.pathname.startsWith(route)) {
        const allowedRoles = roleAccessMap[route];
        // Aquí necesitarías obtener el rol del usuario desde el token o API
        // if (!allowedRoles.includes(userRole)) {
        //   return NextResponse.redirect(new URL("/dashboard/error/403", request.url));
        // }
      }
    }
    */
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
}
