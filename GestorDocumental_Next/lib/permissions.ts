import type { PageRoutesType } from "@/lib/routes-config";

/**
 * Verifica si el usuario tiene al menos uno de los permisos requeridos
 */
export function hasPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (
    !requiredPermissions ||
    !Array.isArray(requiredPermissions) ||
    requiredPermissions.length === 0
  )
    return true;

  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Verifica si el usuario tiene todos los permisos requeridos
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (
    !requiredPermissions ||
    !Array.isArray(requiredPermissions) ||
    requiredPermissions.length === 0
  )
    return true;

  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

/**
 * Verifica si el usuario tiene acceso a algún elemento de una aplicación
 */
export function hasAccessToApp(userPermissions: string[], appRoutes: PageRoutesType[]): boolean {
  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0)
    return false;
  if (!appRoutes || !Array.isArray(appRoutes) || appRoutes.length === 0) return false;

  // Función recursiva para verificar permisos en items y sub-items
  const checkItemsAccess = (items: any[]): boolean => {
    if (!items || !Array.isArray(items)) return false;

    return items.some((item) => {
      // Verificar permisos directos del item
      if (item.hasPermissions && hasPermission(userPermissions, item.hasPermissions)) {
        return true;
      }

      // Verificar permisos en sub-items si existen
      if (item.items && Array.isArray(item.items)) {
        return checkItemsAccess(item.items);
      }

      return false;
    });
  };

  return appRoutes.some((route) => checkItemsAccess(route.items));
}

/**
 * Encuentra la primera ruta accesible para el usuario en una aplicación específica
 */
export function getFirstAccessibleRoute(
  userPermissions: string[],
  appRoutes: PageRoutesType[]
): string | null {
  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0)
    return null;
  if (!appRoutes || !Array.isArray(appRoutes) || appRoutes.length === 0) return null;

  // Función recursiva para encontrar la primera ruta accesible
  const findFirstAccessibleRoute = (items: any[]): string | null => {
    if (!items || !Array.isArray(items)) return null;

    for (const item of items) {
      // Si el item tiene permisos y el usuario los tiene, y tiene href, devolver esta ruta
      if (
        item.hasPermissions &&
        hasPermission(userPermissions, item.hasPermissions) &&
        item.href &&
        item.href !== "/"
      ) {
        return item.href;
      }

      // Si no tiene permisos directos pero tiene sub-items, buscar en ellos
      if (item.items && Array.isArray(item.items)) {
        const subRoute = findFirstAccessibleRoute(item.items);
        if (subRoute) return subRoute;
      }
    }

    return null;
  };

  // Buscar en todas las rutas de la aplicación
  for (const route of appRoutes) {
    const accessibleRoute = findFirstAccessibleRoute(route.items);
    if (accessibleRoute) return accessibleRoute;
  }

  return null;
}

/**
 * Verifica si el usuario tiene acceso a una ruta específica
 */
export function hasAccessToRoute(
  userPermissions: string[],
  appRoutes: PageRoutesType[],
  targetRoute: string
): boolean {
  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0)
    return false;
  if (!appRoutes || !Array.isArray(appRoutes) || appRoutes.length === 0) return false;
  if (!targetRoute) return false;

  // Función recursiva para buscar la ruta y verificar permisos
  const checkRouteAccess = (items: any[]): boolean => {
    if (!items || !Array.isArray(items)) return false;

    for (const item of items) {
      // Si encontramos la ruta, verificar permisos
      if (item.href === targetRoute) {
        return item.hasPermissions ? hasPermission(userPermissions, item.hasPermissions) : true;
      }

      // Buscar en sub-items
      if (item.items && Array.isArray(item.items)) {
        if (checkRouteAccess(item.items)) return true;
      }
    }

    return false;
  };

  // Buscar en todas las rutas de la aplicación
  return appRoutes.some((route) => checkRouteAccess(route.items));
}
