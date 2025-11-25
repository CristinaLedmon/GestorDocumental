"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { page_routes, aplicacions, type PageRoutesType } from "@/lib/routes-config";
import { hasPermission, hasAccessToApp } from "@/lib/permissions";

export default function HeaderMenu() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  const userPermissions = useMemo(() => {
    try {
      const authData = localStorage.getItem("auth_data");
      if (!authData) return [];
      const parsed = JSON.parse(authData);
      return parsed.user?.permissions || [];
    } catch {
      return [];
    }
  }, []);

  const availableApps = useMemo(() => {
    return aplicacions.filter((app) => {
      const routes = page_routes.filter((route) => route.appKey === app.appKey);
      return hasAccessToApp(userPermissions, routes);
    });
  }, [userPermissions]);

  const filteredRoutes: PageRoutesType[] = useMemo(() => {
    if (!availableApps.length) return [];
    const effectiveAppKey = availableApps[0].appKey;
    const routes = page_routes.filter((route) => route.appKey === effectiveAppKey);
    return routes.map((route) => ({
      ...route,
      items: route.items.filter((item) => hasPermission(userPermissions, item.hasPermissions || []))
    }));
  }, [availableApps, userPermissions]);

  if (!isClient) return null;

  return (
    <div className="flex items-center p-4 bg-transparent">
      {/* Logo + Plantilla */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-12">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Image src="/ledmon_logo_small_old.png" alt="Logo" width={32} height={32} />
        </div>
        <div className="font-semibold">Plantilla</div>
      </div>

      {/* Menú horizontal */}
      <nav className="flex gap-6 flex-1">
        {filteredRoutes.map((section) => (
          <div key={section.title} className="relative group">
            <span className="font-medium cursor-pointer hover:font-bold">{section.title}</span>

            {section.items.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-max bg-white border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {section.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href || "#"}
                    className={`block px-4 py-2 text-sm hover:font-bold ${
                      pathname === item.href ? "font-semibold" : ""
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
