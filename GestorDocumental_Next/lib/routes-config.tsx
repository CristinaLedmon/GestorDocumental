export type PageRoutesType = {
  appKey: string;
  title: string;
  items: PageRoutesItemType;
};

type PageRoutesItemType = {
  title: string;
  href: string;
  icon?: string;
  isComing?: boolean;
  hasRole?: string[]; // Mantener por compatibilidad temporal
  hasPermissions?: string[];
  isNew?: boolean;
  newTab?: boolean;
  items?: PageRoutesItemType;
}[];

type AuthData = {
  user: {
    id: number;
    name: string;
    email: string;
    permissions: string[];
  };
  message: string;
};

export const aplicacions = [
  { appKey: "appGeneral", title: "General", href: "/dashboard/map" }
];

export const page_routes: PageRoutesType[] = [
  {
    appKey: "appGeneral",
    title: "Administracion",
    items: [
      {
        title: "Usuarios",
        href: "/dashboard/admin/users",
        icon: "User",
        hasPermissions: []
      }
    ]
  },
  {
    appKey: "appGeneral",
    title: "General",
    items: [
        {
        title: "Ejemplo",
        href: "/dashboard/example",
        icon: "User",
        hasPermissions: []
      },
       {
        title: "Carpetas",
        href: "/dashboard/folders",
        icon: "Folder",
        hasPermissions: []
      }
    ]
  },


];

// Función para obtener permisos del localStorage
function getUserPermissionsFromStorage(): string[] {
  try {
    const authDataString = localStorage.getItem("auth_data");

    if (!authDataString) {
      return [];
    }

    const authData: AuthData = JSON.parse(authDataString);

    if (!authData.user || !authData.user.permissions) {
      console.log("❌ Estructura de datos de autenticación inválida");
      return [];
    }

    console.log("✅ Permisos del usuario:", authData.user.permissions);
    return authData.user.permissions;
  } catch (error) {
    console.error("❌ Error al obtener permisos del localStorage:", error);
    return [];
  }
}

function hasAccessToItem(userPermissions: string[], item: PageRoutesItemType[number]): boolean {
  if (!item.hasPermissions || item.hasPermissions.length === 0) {
    return true;
  }

  const hasAccess = item.hasPermissions.some((perm) => userPermissions.includes(perm));
  console.log(hasAccess ? "✅ Access granted" : "❌ Access denied");
  return hasAccess;
}

function getFirstAccessibleRoute(
  userPermissions: string[],
  routes: PageRoutesType[]
): string | null {
  for (const route of routes) {
    for (const item of route.items) {
      // Primero buscar en subelementos si existen
      if (item.items) {
        for (const child of item.items) {
          const childPath = findAccessiblePathInItem(child, userPermissions);
          if (childPath) {
            return childPath;
          }
        }
      }

      // Luego verificar el item principal si tiene una ruta válida
      if (hasAccessToItem(userPermissions, item) && item.href && item.href !== "/") {
        return item.href;
      }
    }
  }

  console.log("❌ No accessible route found");
  return null;
}

function findAccessiblePathInItem(
  item: PageRoutesItemType[number],
  userPermissions: string[]
): string | null {
  // Si el item tiene subelementos, buscar primero en ellos
  if (item.items) {
    for (const child of item.items) {
      const childPath = findAccessiblePathInItem(child, userPermissions);
      if (childPath) {
        return childPath;
      }
    }
  }

  // Solo considerar el item actual si tiene acceso Y tiene una ruta válida (no "/" o vacía)
  if (hasAccessToItem(userPermissions, item) && item.href && item.href !== "/") {
    return item.href;
  }

  console.log("❌ No accessible path found for item:", item.title);
  return null;
}

// Función principal que ahora obtiene los permisos automáticamente
export function getSmartRouteForApp(appKey: string): string {
  // Obtener permisos del localStorage
  const userPermissions = getUserPermissionsFromStorage();

  if (userPermissions.length === 0) {
    console.log("❌ No user permissions found, redirecting to home");
    return "/";
  }

  const appRoutes = page_routes.find((r) => r.appKey === appKey);
  if (!appRoutes) {
    console.log("❌ App routes not found for:", appKey);
    return "/";
  }

  // Buscar la primera ruta accesible dentro del módulo
  const firstAccessibleRoute = getFirstAccessibleRoute(userPermissions, [appRoutes]);
  return firstAccessibleRoute || "/";
}

// Función auxiliar para obtener permisos (por si la necesitas en otro lugar)
export function getUserPermissions(): string[] {
  return getUserPermissionsFromStorage();
}
