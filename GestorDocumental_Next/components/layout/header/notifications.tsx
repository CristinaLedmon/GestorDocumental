"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Check, Clock, ExternalLink, Info, MailOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow, subMonths, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import fetchModel from "@/lib/fetch-utils";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Alert = {
  id: number;
  title: string;
  content: string;
  id_object: number | null;
  url: string | null;
  is_read: boolean;
  model?: string;
  created_at: string | null;
};

const Notifications = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showRead, setShowRead] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // TODO: Remove this before demo.
    return;
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchModel<{ data: Alert[] }>("alerts");
        setAlerts(response.data);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las notificaciones",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setOpenModal(true);
  };

  const handleMarkAsRead = async () => {
    if (!selectedAlert) return;

    setIsMarkingAsRead(true);
    try {
      // Usar fetchModel para actualizar el estado de lectura
      await fetchModel<{ data: Alert }>(`alerts/${selectedAlert.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: { is_read: true }
      });

      // Actualizar estado local
      setAlerts(alerts.map((a) => (a.id === selectedAlert.id ? { ...a, is_read: true } : a)));
      toast({
        title: "Notificación marcada como leída",
        description: "La notificación ha sido actualizada correctamente"
      });
      setOpenModal(false);
    } catch (error) {
      console.error("Error marking alert as read:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive"
      });
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleRedirect = () => {
    if (!selectedAlert?.id_object) return;

    setOpenModal(false);
    // Redirigir basado en el modelo de la alerta
    if (
      [
        "cron_partner_change_category_30",
        "cron_partner_change_category_21",
        "cron_partner_change_category_16"
      ].includes(selectedAlert.model || "")
    ) {
      window.location.href = `/dashboard/partners/partners/actions/edit?id=${selectedAlert.id_object}`;
    }
  };

  // Función para verificar si una fecha es más reciente que hace un mes
  const isNewerThanOneMonth = (dateString: string | null): boolean => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      const oneMonthAgo = subMonths(new Date(), 1);
      return isAfter(date, oneMonthAgo);
    } catch (e) {
      return false;
    }
  };

  // Filtrar alertas: mostrar no leídas siempre, y leídas solo si son recientes (menos de 1 mes)
  const visibleAlerts = alerts.filter((alert) => {
    // Siempre mostrar las no leídas
    if (!alert.is_read) return true;

    // Si estamos mostrando las leídas, solo mostrar las que tienen menos de 1 mes
    return showRead && isNewerThanOneMonth(alert.created_at);
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (e) {
      return "";
    }
  };

  // Verificar si el modelo de la alerta está en la lista de modelos que muestran el botón "Ver socio"
  const shouldShowPartnerButton = (alert: Alert) => {
    return [
      "cron_partner_change_category_30",
      "cron_partner_change_category_21",
      "cron_partner_change_category_16"
    ].includes(alert.model || "");
  };

  // Verificar si el modelo de la alerta está en la lista de modelos que muestran el icono de usuario
  const isPartnerAlert = (alert: Alert) => {
    return [
      "cron_partner_change_category_30",
      "cron_partner_change_category_21",
      "cron_partner_change_category_16"
    ].includes(alert.model || "");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* <Button size="sm" variant="ghost" className="relative h-9 w-9 rounded-full p-0">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground transition-all animate-in fade-in-50">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button> */}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[999] w-[380px] overflow-hidden p-0">
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-semibold">Notificaciones</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unreadCount} nueva{unreadCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRead(!showRead)}
                className="h-8 text-xs font-normal">
                {showRead ? "Ocultar leídas" : "Ver todas"}
              </Button>
            </div>
          </DropdownMenuLabel>
          <div className="h-[350px]">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center p-4">
                  <div className="text-sm text-muted-foreground">Cargando notificaciones...</div>
                </div>
              ) : visibleAlerts.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-4">
                  <div className="rounded-full bg-muted p-3">
                    <Check className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-sm font-medium">No hay notificaciones</p>
                  <p className="text-xs text-muted-foreground">
                    {showRead
                      ? "No tienes notificaciones recientes"
                      : "No tienes notificaciones sin leer"}
                  </p>
                </div>
              ) : (
                visibleAlerts.map((item) => (
                  <DropdownMenuItem
                    key={`alert-${item.id}`}
                    className={cn(
                      "group flex cursor-pointer gap-3 border-b p-4 transition-colors duration-200 last:border-0 hover:bg-muted/50",
                      !item.is_read && "bg-primary/5"
                    )}
                    onClick={() => handleAlertClick(item)}>
                    <div className="flex-none">
                      <Avatar
                        className={cn(
                          "h-10 w-10 border-2",
                          !item.is_read ? "border-primary" : "border-transparent"
                        )}>
                        <AvatarFallback
                          className={cn(!item.is_read ? "bg-primary/10 text-primary" : "bg-muted")}>
                          {isPartnerAlert(item) ? (
                            <User className="h-5 w-5" />
                          ) : (
                            item.title.charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "text-sm font-medium leading-none",
                            !item.is_read && "text-primary"
                          )}>
                          {item.title}
                        </p>
                        {!item.is_read && (
                          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedAlert && (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  {isPartnerAlert(selectedAlert) ? (
                    <User className="h-5 w-5 text-primary" />
                  ) : (
                    <Info className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-semibold leading-tight">
                    {selectedAlert.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(selectedAlert.created_at)}</span>
                    </div>
                    {selectedAlert.is_read ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                        <MailOpen className="h-3 w-3" />
                        <span>Leída</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-primary/20 bg-primary/5 text-primary">
                        <Bell className="h-3 w-3" />
                        <span>No leída</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Separator className="my-2" />

            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="p-4">
                <div className="max-h-[40vh] overflow-auto py-2">
                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {selectedAlert.content}
                  </p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-0">
              {/* Mostrar el botón "Marcar como leída" solo si la alerta no está leída */}
              {!selectedAlert.is_read && (
                <Button
                  variant="outline"
                  onClick={handleMarkAsRead}
                  disabled={isMarkingAsRead}
                  className="w-full sm:w-auto">
                  {isMarkingAsRead ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como leída
                    </>
                  )}
                </Button>
              )}

              {/* Mostrar el botón "Ver socio" solo para los modelos específicos */}
              {shouldShowPartnerButton(selectedAlert) && (
                <Button
                  variant="default"
                  onClick={handleRedirect}
                  className={cn(
                    "w-full sm:w-auto",
                    // Si no hay botón de "Marcar como leída", centrar este botón en móvil
                    selectedAlert.is_read && "sm:ml-auto"
                  )}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver socio
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Notifications;
