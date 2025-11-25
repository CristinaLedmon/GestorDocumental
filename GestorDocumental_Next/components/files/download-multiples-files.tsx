"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Download, Loader, FileDown } from "lucide-react"
import fetchModel from "./fetch-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ReactNode } from "react"

interface ReportGeneratorButtonProps {
  model: string
  id: number
  type?: string
  fileTypes?: string[]
  label?: string
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  fileName?: string | string[]

  // Nuevos props
  icon?: ReactNode
  color?: string // por ejemplo: "text-red-500", "bg-green-100"
  loadingText?: string
  tooltip?: string
}

export function ReportGeneratorButton2({
  model,
  id,
  type = "type1",
  fileTypes,
  label = "Descargar",
  variant = "outline",
  size = "sm",
  className = "",
  fileName = "reporte.pdf",
  icon,
  color,
  loadingText,
  tooltip,
}: ReportGeneratorButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentFileType, setCurrentFileType] = useState<string | null>(null)

  const resolveFileName = (selectedType: string) => {
    let baseName = "reporte"
    if (Array.isArray(fileName)) {
      const index = fileTypes?.findIndex((t) => t === selectedType) ?? -1
      baseName = fileName[index] ?? "reporte"
    } else {
      baseName = fileName
    }

    return baseName
      .replace(/{id}/g, id.toString())
      .replace(/{model}/g, model)
      .replace(/{type}/g, selectedType) + ".pdf"
  }

  const handleGenerateReport = useCallback(
    async (selectedType: string) => {
      setIsLoading(true)
      setCurrentFileType(selectedType)
      setIsDialogOpen(false)

      try {
        toast({
          title: "Generando informe",
          description: "Preparando el informe, por favor espere...",
        })

        const blob = await fetchModel<Blob>(`reports/generate/${model}/${id}/${selectedType}`, {
          method: "GET",
          headers: {
            Accept: "application/octet-stream, application/pdf",
          },
        })

        if (!(blob instanceof Blob)) {
          throw new Error("La respuesta no es un archivo válido")
        }

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = resolveFileName(selectedType)
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => window.URL.revokeObjectURL(url), 100)

        toast({
          title: "Informe generado",
          description: "El informe se ha descargado correctamente.",
        })
      } catch (error: any) {
        console.error("Error al generar el informe:", error)
        toast({
          title: "Error al generar informe",
          description: error.message || "Hubo un problema al generar el informe.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setCurrentFileType(null)
      }
    },
    [model, id, fileName, fileTypes],
  )

  const handleButtonClick = useCallback(() => {
    if (fileTypes && fileTypes.length > 0) {
      setIsDialogOpen(true)
    } else {
      handleGenerateReport(type)
    }
  }, [fileTypes, type, handleGenerateReport])

  const getDisplayName = (fileType: string) => {
    if (fileType.match(/^type\d+$/)) {
      const number = fileType.replace("type", "")
      return `Tipo ${number}`
    }
    return fileType.charAt(0).toUpperCase() + fileType.slice(1)
  }

  return (
    <>
<Button
  type="button"
  variant={variant}
  size={size}
  onClick={handleButtonClick}
  disabled={isLoading}
  className={`${className} ${color ?? ""}`}
  title={tooltip}
>
  {isLoading ? (
    <>
      <Loader className="h-4 w-4 mr-2 animate-spin" />
      {loadingText ?? ""}
    </>
  ) : (
    <>
      {icon ?? <Download className="h-4 w-4 mr-2" />}
      {label}
    </>
  )}
</Button>

      {fileTypes && fileTypes.length > 0 && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Seleccionar formato</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {fileTypes.map((fileType) => (
                <Button
                  type="button"
                  key={fileType}
                  onClick={() => handleGenerateReport(fileType)}
                  className="w-full justify-start"
                  variant={currentFileType === fileType ? "default" : "outline"}
                  disabled={isLoading}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {getDisplayName(fileType)}
                </Button>
              ))}
            </div>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
