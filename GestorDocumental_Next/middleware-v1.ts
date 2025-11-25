import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("laravel_session");
  const user_info = request.cookies.get("user_info");

  const publicRoutes = ["/dashboard/login", "/dashboard/register"];
  const redirectToHomeRoutes = ["/", "/dashboard"];

  const protectedRoutes: string[] = [
    // "/dashboard/users",
    // "/dashboard/permissions",
    // "/dashboard/roles"
  ];

  // Si no hay sesión y no es login/register => redirige a login
  if (!token || !user_info) {
    if (!publicRoutes.includes(request.nextUrl.pathname)) {
      const response = NextResponse.redirect(new URL("/dashboard/login", request.url));
      response.cookies.delete("laravel_session");
      response.cookies.delete("user_info");
      response.cookies.delete("XSRF-TOKEN");
      return response;
    }
  }

  if (token && user_info) {
    const role = JSON.parse(user_info.value).role;

    // Redirige a /dashboard/home si accede a "/" o "/dashboard"
    if (redirectToHomeRoutes.includes(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/dashboard/home", request.url));
    }

    // Aquí defines qué roles pueden acceder a rutas protegidas
    const roleAccessMap: { [key: string]: string[] } = {
    //   "/dashboard/users": ["admin"],
    //   "/dashboard/permissions": ["admin"],
    //   "/dashboard/roles": ["admin"]
    };

    for (const route of protectedRoutes) {
      if (request.nextUrl.pathname.startsWith(route)) {
        const allowedRoles = roleAccessMap[route];
        if (!allowedRoles.includes(role)) {
          return NextResponse.redirect(new URL("/dashboard/error/403", request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"]
};



// import { NextResponse, type NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   // TODO: Remove this before demo.
//   if (["/", "/dashboard"].includes(request.nextUrl.pathname)) {
//     return NextResponse.redirect(new URL("/dashboard/home", request.url));
//   }

//   return NextResponse.next();

//   const token = request.cookies.get("laravel_session");
//   const user_info = request.cookies.get("user_info");

//   const publicRoutes = ["/dashboard/login", "/dashboard/register"];
//   const redirectToHomeRoutes = ["/", "/dashboard"];

//   const protectedRoutes: string[] = [
//     // "/dashboard/users",
//     // "/dashboard/permissions",
//     // "/dashboard/roles"
//   ];

//   // Si no hay sesión y no es login/register => redirige a login
//   if (!token || !user_info) {
//     if (!publicRoutes.includes(request.nextUrl.pathname)) {
//       const response = NextResponse.redirect(new URL("/dashboard/login", request.url));
//       response.cookies.delete("laravel_session");
//       response.cookies.delete("user_info");
//       response.cookies.delete("XSRF-TOKEN");
//       return response;
//     }
//   }

//   if (token && user_info) {
//     const role = JSON.parse(user_info.value).role;

//     // Redirige a /dashboard/home si accede a "/" o "/dashboard"
//     if (redirectToHomeRoutes.includes(request.nextUrl.pathname)) {
//       return NextResponse.redirect(new URL("/dashboard/home", request.url));
//     }

//     // Aquí defines qué roles pueden acceder a rutas protegidas
//     const roleAccessMap: { [key: string]: string[] } = {
//       //   "/dashboard/users": ["admin"],
//       //   "/dashboard/permissions": ["admin"],
//       //   "/dashboard/roles": ["admin"]
//     };

//     for (const route of protectedRoutes) {
//       if (request.nextUrl.pathname.startsWith(route)) {
//         const allowedRoles = roleAccessMap[route];
//         if (!allowedRoles.includes(role)) {
//           return NextResponse.redirect(new URL("/dashboard/error/403", request.url));
//         }
//       }
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/", "/dashboard/:path*"]
// };
