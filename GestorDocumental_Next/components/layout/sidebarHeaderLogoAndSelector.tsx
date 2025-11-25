"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SidebarHeader } from "@/components/ui/sidebar";
import { aplicacions } from "@/lib/routes-config";
import { useAppSelectedStateStore } from "@/store/appSelectedStateStore";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSmartRouteForApp } from "@/lib/routes-config";
import cookieManager from "@/hooks/use-cookie-manager";

export default function SidebarHeaderLogoAndSelector({
  state,
  availableApps = aplicacions
}: {
  state: string;
  availableApps?: typeof aplicacions;
}) {
  const { selectedApp, setSelectedApp } = useAppSelectedStateStore();
  const router = useRouter();

  useEffect(() => {
    if (selectedApp) {
      localStorage.setItem("selectedApp", selectedApp);
    }
  }, [selectedApp]);

  const handleSelectApp = (appKey: string) => {
    setSelectedApp(appKey);

    // Obtener permisos del usuario
    const userInfo = cookieManager("user_info") || { permissions: [] };
    const userPermissions = userInfo.permissions || [];

    // Obtener la ruta inteligente basada en permisos
    const smartRoute = getSmartRouteForApp(appKey);

    router.push(smartRoute);
  };

  const selectedAppTitle =
    availableApps.find((app) => app.appKey === selectedApp)?.title || "Seleccionar App";

  return (
    <SidebarHeader className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Image src="/ledmon_logo_small_old.png" alt="Logo" width={32} height={32} />
        </div>
        <div
          className={`flex flex-1 items-center justify-between transition-opacity duration-300 ${
            state === "collapsed" ? "opacity-0" : "opacity-100"
          }`}>
          <div className="font-semibold">Plantilla</div>
        </div>
      </div>
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
            disabled={availableApps.length <= 1}>
            {selectedAppTitle}
            <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
          {availableApps.map((app) => (
            <DropdownMenuItem key={app.appKey} onClick={() => handleSelectApp(app.appKey)}>
              {app.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu> */}
    </SidebarHeader>
  );
}
