"use client";

import Icon from "@/components/icon";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar";
import { page_routes, aplicacions, type PageRoutesType } from "@/lib/routes-config";
import { hasPermission, hasAccessToApp } from "@/lib/permissions";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import useAuth from "@/hooks/use-auth";
import SidebarHeaderLogoAndSelector from "./sidebarHeaderLogoAndSelector";
import { useAppSelectedStateStore } from "@/store/appSelectedStateStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { toggleSidebar, isMobile, state } = useSidebar();
  const router = useRouter();
  const { user, permissions, isLoading, isAuthenticated } = useAuth();

  const { selectedApp, setSelectedApp } = useAppSelectedStateStore();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logs
  useEffect(() => {
    console.log("=== SIDEBAR DEBUG ===");
    console.log("isLoading:", isLoading);
    console.log("isAuthenticated:", isAuthenticated);
    console.log("user:", user);
    console.log("permissions:", permissions);
    console.log("permissions length:", permissions?.length);
    console.log("===================");
  }, [isLoading, isAuthenticated, user, permissions]);

  // Filtrar las aplicaciones basadas en permisos

  const availableApps = useMemo(() => {
    if (isLoading || !permissions || permissions.length === 0) return [];
    return aplicacions.filter((app) => {
      const appRoutes = page_routes.filter((route) => route.appKey === app.appKey);
      return hasAccessToApp(permissions, appRoutes);
    });
  }, [permissions, isLoading]);

  // Crear appRoutes solo con las aplicaciones disponibles
  const appRoutes: Record<string, PageRoutesType[]> = useMemo(() => {
    const routes: Record<string, PageRoutesType[]> = {};

    availableApps.forEach((app) => {
      routes[app.appKey] = page_routes.filter((route) => route.appKey === app.appKey);
    });

    return routes;
  }, [availableApps]);

  const appKeyFromPath = useMemo(() => {
    return Object.keys(appRoutes).find((key) =>
      appRoutes[key]?.some((route) =>
        route.items.some((item) => item.href && pathname.startsWith(item.href))
      )
    );
  }, [appRoutes, pathname]);

  console.log("DATOS DEL USUARIO=", user);
  console.log(
    "Aplicaciones disponibles:",
    availableApps.map((app) => app.appKey)
  );

  useEffect(() => {
    if (!isClient) return;

    const localStorageApp = localStorage.getItem("selectedApp");

    // Verificar si la app seleccionada está disponible
    if (selectedApp && !availableApps.some((app) => app.appKey === selectedApp)) {
      // Si la app seleccionada no está disponible, seleccionar la primera disponible
      if (availableApps.length > 0) {
        setSelectedApp(availableApps[0].appKey);
      } else {
        setSelectedApp("");
      }
    } else if (
      !selectedApp &&
      localStorageApp &&
      availableApps.some((app) => app.appKey === localStorageApp)
    ) {
      setSelectedApp(localStorageApp);
    } else if (!selectedApp && appKeyFromPath) {
      setSelectedApp(appKeyFromPath);
    } else if (!selectedApp && availableApps.length > 0) {
      // Si no hay app seleccionada, seleccionar la primera disponible
      setSelectedApp(availableApps[0].appKey);
    }
  }, [isClient, selectedApp, appKeyFromPath, setSelectedApp, availableApps]);

  const effectiveAppKey = selectedApp?.length ? selectedApp : appKeyFromPath;
  const filteredRoutes = effectiveAppKey ? appRoutes[effectiveAppKey] || [] : [];

  useEffect(() => {
    if (isMobile) toggleSidebar();

    // Solo redirigir si ya terminó de cargar y no hay permisos
    if (!isLoading && (!permissions || permissions.length === 0)) {
      console.log("Redirigiendo a 403 - Sin permisos");
      router.push("/dashboard/error/403");
    }
  }, [pathname, router, permissions, isMobile, toggleSidebar, isLoading]);

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <SidebarContainer collapsible="icon">
        <SidebarContent className="flex items-center justify-center">
          <div className="text-muted-foreground">Cargando...</div>
        </SidebarContent>
      </SidebarContainer>
    );
  }

  // Si no hay aplicaciones disponibles, no mostrar el sidebar
  if (!isClient || availableApps.length === 0) return null;

  return (
    <SidebarContainer collapsible="icon">
      <SidebarHeaderLogoAndSelector
        state={state}
        availableApps={availableApps} // Pasar las aplicaciones disponibles al selector
      />
      <SidebarContent className="overflow-hidden">
        <ScrollArea>
          {filteredRoutes.map((route, key) => (
            <SidebarGroup key={key}>
              <SidebarGroupLabel>{route.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {route.items.map((item, key) => {
                    // Verificar si el usuario tiene permisos para ver este item
                    const canViewItem = item.hasPermissions
                      ? hasPermission(permissions || [], item.hasPermissions)
                      : true; // Si no tiene hasPermissions definido, mostrar por defecto

                    if (!canViewItem) return null;

                    return (
                      <SidebarMenuItem key={key}>
                        {item.items?.length ? (
                          <Collapsible className="group/collapsible">
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.title}>
                                {item.icon && <Icon name={item.icon} className="size-4" />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items.map((subItem, subKey) => {
                                  // Verificar permisos para sub-items
                                  const canViewSubItem = subItem.hasPermissions
                                    ? hasPermission(permissions || [], subItem.hasPermissions)
                                    : true;

                                  if (!canViewSubItem) return null;

                                  return (
                                    <SidebarMenuSubItem key={subKey}>
                                      <SidebarMenuSubButton
                                        isActive={pathname === subItem.href}
                                        asChild>
                                        <Link
                                          href={subItem.href}
                                          target={subItem.newTab ? "_blank" : ""}>
                                          {subItem.icon && (
                                            <Icon name={subItem.icon} className="size-4" />
                                          )}
                                          <span>{subItem.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            isActive={pathname === item.href}>
                            <Link href={item.href} target={item.newTab ? "_blank" : ""}>
                              {item.icon && <Icon name={item.icon} className="size-4" />}
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>
    </SidebarContainer>
  );
}
