import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import cookieManager from "@/hooks/use-cookie-manager";
import fetchModel from "@/lib/fetch-utils";
import { LogOut } from "lucide-react";
import Link from "next/link";

const handleLogout = async () => {
  document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax; Secure=${location.protocol === "https:"}`
  setTimeout(() => {
    window.location.href = "/dashboard/login";
  }, 1000);
  return;
  // try {
  //   const response = await fetchModel<{ success: string }>("logout", {
  //     method: "POST"
  //   });

  //   if (response.success) {
  //     // Redirigir al usuario después del logout
  //     window.location.href = "/dashboard/login";
  //   }
  // } catch (errorResponse) {
  //   toast({
  //     title: `Error cerrar sesión`,
  //     description: "Se ha producido un error al cerrar la sesión. Por favor inténtelo más tarde."
  //   });
  // }
};

export default function UserMenu() {
  const userInfo = cookieManager("user_info", true);
  return (
    <div className="ms-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-8 rounded-full">
            <AvatarImage src="/ledmon_logo_small_old.png" alt="Avatar Ledmon" />
            <AvatarFallback className="rounded-lg">LED</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start">
          <DropdownMenuLabel className="p-0 font-normal">
            <Link
              href={
                userInfo && userInfo.id
                  ? "/dashboard/users/actions/edit/" + userInfo.id
                  : "/dashboard/home"
              }>
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/ledmon_logo_small_old.png" alt="Avatar Ledmon" />
                  <AvatarFallback className="rounded-lg">LED</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {userInfo && userInfo.name ? userInfo.name : "Ledmon Example"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userInfo && userInfo.email ? userInfo.email : "example@ledmon.com"}
                  </span>
                </div>
              </div>
            </Link>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Button
              variant={"link"}
              size={"sm"}
              onClick={() => {
                handleLogout();
              }}>
              <LogOut className="me-2 size-4" />
              Cerrar sesión
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
