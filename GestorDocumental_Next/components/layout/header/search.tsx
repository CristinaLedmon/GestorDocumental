"use client";

import React from "react";
import { CommandIcon, SearchIcon, ImagesIcon as icons } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { page_routes } from "@/lib/routes-config";
import { useEffect, useState } from "react";
import { useUserPermissions } from "./use-user-permissions";


import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type CommandItemProps = {
  item: {
    title: string;
    href: string;
    icon?: string;
    hasPermissions?: string[];
  };
};

export default function Search() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { permissions: userPermissions, isLoading } = useUserPermissions();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Función para verificar si el usuario tiene los permisos necesarios
  const hasRequiredPermissions = (requiredPermissions: string[] = []): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => userPermissions.includes(permission));
  };

  // Función para expandir elementos con subelementos y filtrar por permisos
  const expandAndFilterItems = (items: any[], parentTitle?: string): any[] => {
    const result: any[] = [];
    
    items.forEach((item) => {
      // Verificar permisos del elemento padre
      if (!hasRequiredPermissions(item.hasPermissions)) {
        return;
      }

      // Si el elemento tiene subelementos (como Configuraciones), expandirlos
      if (item.items && item.items.length > 0) {
        // Filtrar y expandir subelementos
        const filteredSubItems = item.items.filter((subItem: any) => 
          hasRequiredPermissions(subItem.hasPermissions)
        );
        
        // Añadir cada subelemento como elemento individual
        filteredSubItems.forEach((subItem: any) => {
          result.push({
            ...subItem,
            title: `${item.title} > ${subItem.title}`, // Mostrar jerarquía
            parentTitle: item.title
          });
        });
        
        // También añadir el elemento padre si tiene href propio
        if (item.href) {
          result.push({
            ...item,
            parentTitle: parentTitle
          });
        }
      } else {
        // Elemento simple sin subelementos
        result.push({
          ...item,
          parentTitle: parentTitle
        });
      }
    });
    
    return result;
  };

  const CommandItemComponent: React.FC<CommandItemProps> = ({ item }) => {
    const LucideIcon = icons[item.icon as keyof typeof icons];

    return (
      <CommandItem
        onSelect={() => {
          setOpen(false);
          router.push(item.href);
        }}>
        {/* {item.icon && LucideIcon && <LucideIcon className="me-2 !h-4 !w-4" />} */} 
        {/* PELIGRO AQUI */}
        <span>{item.title}</span>
      </CommandItem>
    );
  };

  // Procesar las rutas para expandir submenús y filtrar por permisos
  const processedRoutes = page_routes.map(route => {
    const expandedItems = expandAndFilterItems(route.items, route.title);
    
    // Si no hay elementos accesibles, no mostrar la sección
    if (expandedItems.length === 0) {
      return null;
    }
    
    return {
      ...route,
      items: expandedItems
    };
  }).filter(Boolean); // Eliminar secciones nulas

  return (
    <div className="ms-auto lg:me-auto lg:flex-1">
      <div className="relative hidden max-w-sm flex-1 lg:block">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
        <Input
          className="h-9 w-full cursor-pointer rounded-md border pl-10 pr-4 text-sm shadow-sm"
          placeholder="Buscar..."
          type="search"
          onFocus={() => setOpen(true)}
        />
        {/* <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium dark:bg-neutral-700 sm:flex">
          <CommandIcon className="size-3" />
          <span>k</span>
        </div> */}
      </div>
      <div className="block lg:hidden">
        <Button size="sm" variant="link" onClick={() => setOpen(true)} className="text-foreground">
          <SearchIcon className="size-5" />
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Escribe el comando de busqueda..." />
        <CommandList>
          <CommandEmpty>No se han encontrado resultados.</CommandEmpty>
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Cargando permisos...</span>
            </div>
          ) : (
            processedRoutes.map((route) => (
              <React.Fragment key={route.title}>
                <CommandGroup heading={route.title}>
                  {route.items.map((item, key) => (
                    <CommandItemComponent key={key} item={item} />
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}