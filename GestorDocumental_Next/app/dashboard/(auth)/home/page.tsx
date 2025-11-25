"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { page_routes } from "@/lib/routes-config";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { getColorForSection } from "./colors-menuitems";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { WelcomeCard } from "./welcome-card";
import { useUserPermissions } from "./use-user-permissions";
import MapPage from "@/components/dashboard/map";

export default function MainMenu() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { permissions: userPermissions, user, isLoading } = useUserPermissions();

  const toggleExpand = useCallback((id: string) => {
    setExpandedSection((currentExpanded) => (currentExpanded === id ? null : id));
  }, []);

  const router = useRouter();

  const getIconFromString = (iconName: string | undefined, size: "small" | "large" = "small") => {
    if (!iconName) return null;

    // @ts-ignore
    const Icon = LucideIcons[iconName];

    if (!Icon) return null;

    return size === "large" ? <Icon className="h-8 w-8" /> : <Icon className="h-4 w-4" />;
  };

  // Función para verificar si el usuario tiene los permisos necesarios
  const hasRequiredPermissions = (requiredPermissions: string[] = []): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => userPermissions.includes(permission));
  };

  // Filtrar elementos basándose en permisos
  const filterItemsByPermissions = (items: any[]): any[] => {
    return items.filter((item) => {
      // Verificar si el usuario tiene permisos para este elemento
      if (!hasRequiredPermissions(item.hasPermissions)) {
        return false;
      }

      // Si tiene subelementos, filtrarlos también
      if (item.items) {
        const filteredSubItems = filterItemsByPermissions(item.items);
        // Solo incluir el elemento padre si tiene subelementos accesibles
        if (filteredSubItems.length === 0) {
          return false;
        }
        item.items = filteredSubItems;
      }

      return true;
    });
  };

  // Mostrar loading mientras se cargan los permisos
  if (isLoading) {
    return (
      <div className="container py-10">
        <h1 className="mb-8 text-center text-3xl font-bold">Panel de Control</h1>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  // Filtrar y procesar las secciones del menú
  const menuSections = page_routes
    .map((route) => {
      // Filtrar elementos de la ruta basándose en permisos
      const filteredItems = filterItemsByPermissions([...route.items]);

      // Si no hay elementos accesibles, no mostrar la sección
      if (filteredItems.length === 0) {
        return null;
      }

      const directItems = filteredItems
        .filter((item) => !item.items || item.title === "Configuración")
        .map((item) => {
          if (!item.items) {
            return {
              title: item.title,
              href: item.href,
              icon: getIconFromString(item.icon)
            };
          } else if (item.title === "Configuración") {
            const configItems = (item.items || []).map((subItem) => ({
              title: subItem.title,
              href: subItem.href,
              icon: getIconFromString(subItem.icon),
              parentTitle: item.title
            }));
            return {
              title: item.title,
              href: item.href,
              icon: getIconFromString(item.icon),
              subItems: configItems
            };
          }
          return null;
        })
        .filter(Boolean);

      const configSubItems = filteredItems
        .filter((item) => item.items && item.title === "Configuración")
        .flatMap((item) =>
          (item.items || []).map((subItem) => ({
            title: subItem.title,
            href: subItem.href,
            icon: getIconFromString(subItem.icon),
            parentTitle: "Configuración"
          }))
        );

      // Procesar elementos de "Configuraciones"
      const masterItems = filteredItems
        .filter((item) => item.items && item.title === "Configuraciones")
        .flatMap((item) =>
          (item.items || []).map((subItem) => ({
            title: subItem.title,
            href: subItem.href,
            icon: getIconFromString(subItem.icon),
            parentTitle: "Configuraciones"
          }))
        );

      const allMenuItems = [
        ...directItems.filter((item) => !item?.subItems),
        ...configSubItems,
        ...masterItems
      ];

      // Encontrar el primer elemento accesible para usar como href principal
      const firstAccessibleItem = filteredItems.find((item) => item.href && item.href !== "/");
      const mainHref = firstAccessibleItem?.href || route.items[0]?.href;

      return {
        id: route.appKey.toLowerCase().replace("app", ""),
        title: route.title,
        description: `Gestión de ${route.title.toLowerCase()}`,
        icon: getIconFromString(filteredItems[0]?.icon, "large"),
        color: getColorForSection(route.title),
        href: mainHref,
        submenu: allMenuItems
      };
    })
    .filter(Boolean); // Eliminar secciones nulas

  // Si no hay secciones accesibles, mostrar mensaje
  if (menuSections.length === 0) {
    return (
      <div className="container py-10">
        <h1 className="mb-8 text-center text-3xl font-bold">Panel de Control</h1>
        <WelcomeCard />
        <div className="py-8 text-center">
          <div className="mx-auto max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <p className="font-medium text-yellow-800">Sin permisos de acceso</p>
            <p className="mt-2 text-sm text-yellow-600">
              No tienes permisos para acceder a ninguna sección del panel.
            </p>
            {user && (
              <p className="mt-2 text-xs text-yellow-600">
                Usuario: {user.name} ({user.role})
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">HOME</h1>

      {/* Información del usuario (opcional, puedes comentar esta sección) */}
      {/* {user && (
        <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground">
            Bienvenido, <span className="font-medium">{user.name}</span> ({user.role})
          </p>
        </div>
      )} */}

      {/* <WelcomeCard />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        {menuSections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader
              className={cn(
                "flex flex-row items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity py-6 pl-6 pr-3",
                section.color,
              )}
            >
              <div className="flex-1 flex items-center gap-4" onClick={() => router.push(section.href)}>
                <div className="rounded-full p-2 bg-white/90">{section.icon}</div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription className="text-white-700">{section.description}</CardDescription>
                </div>
              </div>

              {section.submenu.length > 0 && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(section.id)
                  }}
                  className="flex items-center justify-center w-12 h-12 rounded-md hover:bg-white/30 cursor-pointer transition-colors ml-2"
                  aria-label={expandedSection === section.id ? "Colapsar menú" : "Expandir menú"}
                >
                  <ChevronDown
                    className={cn("h-5 w-5 transition-transform", expandedSection === section.id ? "rotate-180" : "")}
                  />
                </div>
              )}
            </CardHeader>

            {section.submenu.length > 0 && (
              <div
                className={cn(
                  "overflow-hidden transition-[max-height] duration-300 ease-in-out",
                  expandedSection === section.id ? "max-h-96" : "max-h-0",
                )}
              >
                <div className="max-h-80 overflow-y-auto">
                  <CardFooter className="flex flex-col gap-2 p-6 pt-4">
                    {section.submenu.map((item) => (
                      <div
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </CardFooter>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div> */}

      <MapPage />

      {/* Debug info - puedes comentar esta sección en producción */}
      {/* {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              Debug: Permisos del usuario ({userPermissions.length})
            </summary>
            <div className="mt-2 text-xs">
              <pre className="whitespace-pre-wrap">{JSON.stringify(userPermissions, null, 2)}</pre>
            </div>
          </details>
        </div>
      )} */}
    </div>
  );
}
