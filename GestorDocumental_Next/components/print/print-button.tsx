"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
    //@ts-ignore
import fetchModel from "@/app/dashboard/(auth)/(appPartners)/partners/activities-control/fetch-utils" //estp deberia unificarlo en una sola ruta

interface PrintButtonProps {
  id: string | number
  model: string
  identifier?: string
  endpoint?: string
  type?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
  className?: string
}

export function PrintButton({
  id,
  model,
  identifier,
  endpoint,
  type = "type1",
  variant = "ghost",
  size = "icon",
  disabled = false,
  className = "",
}: PrintButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePrint = async () => {
    if (!id) {
      toast({
        title: "Error",
        description: "No se puede imprimir: ID no disponible",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Mostrar toast de carga
      toast({
        title: "Imprimiendo documento",
        description: `Preparando ${identifier || `${model} ${id}`} para imprimir...`,
      })

      // Construir la URL del endpoint (fetchModel maneja la URL base)
      const printEndpoint = endpoint || `reports/generate/${model}/${id}/${type}`

      console.log("=== DEBUG IMPRESIÓN ===")
      console.log("ID:", id)
      console.log("Model:", model)
      console.log("Type:", type)
      console.log("Endpoint:", printEndpoint)
      console.log("======================")

      // Usar fetchModel para manejar autenticación con Laravel
      const blob = await fetchModel<Blob>(printEndpoint, {
        method: "GET",
        headers: {
          Accept: "application/octet-stream, application/pdf",
        },
      })

      // Verificar que la respuesta es un Blob
      if (!(blob instanceof Blob)) {
        throw new Error("La respuesta no es un archivo válido")
      }

      // Crear una URL temporal para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un iframe para imprimir el PDF
      const printFrame = document.createElement("iframe")

      // Establecer un ID único para el iframe
      const frameId = `print-frame-${Date.now()}`
      printFrame.id = frameId

      // Hacerlo invisible pero mantenerlo en el documento
      printFrame.style.position = "fixed"
      printFrame.style.right = "0"
      printFrame.style.bottom = "0"
      printFrame.style.width = "0"
      printFrame.style.height = "0"
      printFrame.style.border = "0"

      // Añadir al documento
      document.body.appendChild(printFrame)

      // Establecer la fuente
      printFrame.src = url

      // Esperar a que el iframe se cargue antes de imprimir
      printFrame.onload = () => {
        try {
          // Enfocar la ventana del iframe
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus()

            // Imprimir el documento
            printFrame.contentWindow.print()

            // Mostrar notificación de éxito
            toast({
              title: "Documento enviado a imprimir",
              description: `${identifier || `${model} ${id}`} se ha enviado a la impresora.`,
            })

            // Escuchar el evento afterprint para limpiar
            if (printFrame.contentWindow.matchMedia) {
              const mediaQueryList = printFrame.contentWindow.matchMedia("print")
              mediaQueryList.addEventListener(
                "change",
                (mql) => {
                  if (!mql.matches) {
                    // Diálogo de impresión cerrado/completado
                    console.log("Diálogo de impresión cerrado, limpiando...")

                    // Limpiar después de un retraso más largo
                    setTimeout(() => {
                      if (document.getElementById(frameId)) {
                        document.body.removeChild(printFrame)
                      }
                      window.URL.revokeObjectURL(url)
                    }, 2000)
                  }
                },
                { once: true },
              )
            } else {
              // Fallback para navegadores que no soportan la consulta de medios de impresión
              setTimeout(() => {
                if (document.getElementById(frameId)) {
                  document.body.removeChild(printFrame)
                }
                window.URL.revokeObjectURL(url)
              }, 60000) // Timeout de 1 minuto como fallback
            }
          }
        } catch (error) {
          console.error("Error al imprimir:", error)
          toast({
            title: "Error al imprimir",
            description: "No se pudo imprimir el documento. Intente descargar e imprimir manualmente.",
            variant: "destructive",
          })

          // Limpiar en caso de error
          setTimeout(() => {
            if (document.getElementById(frameId)) {
              document.body.removeChild(printFrame)
            }
            window.URL.revokeObjectURL(url)
          }, 1000)
        }
      }

      printFrame.onerror = () => {
        toast({
          title: "Error al cargar",
          description: "No se pudo cargar el documento para imprimir.",
          variant: "destructive",
        })

        // Limpiar en caso de error
        setTimeout(() => {
          if (document.getElementById(frameId)) {
            document.body.removeChild(printFrame)
          }
          window.URL.revokeObjectURL(url)
        }, 1000)
      }
    } catch (error) {
      console.error("Error printing document:", error)
      toast({
        title: "Error al imprimir",
        description: error instanceof Error ? error.message : "Hubo un problema al imprimir el documento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      disabled={disabled || isLoading}
      className={className}
      title="Imprimir"
    >
      <Printer className="h-4 w-4" />
      {isLoading && <span className="ml-2">Imprimiendo...</span>}
    </Button>
  )
}
