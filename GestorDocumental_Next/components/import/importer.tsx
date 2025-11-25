"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import fetchModel from "@/lib/fetch-utils"

interface ImporterProps {
  endpoint: string
  modelData: string
  title?: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function Importer({ endpoint, modelData, title = "Datos", onSuccess, onError }: ImporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo CSV válido",
        variant: "destructive",
      })
      return
    }

    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadStatus("idle")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetchModel<{ data: Record<string, any> }>(endpoint, {
        method: "POST",
        body: formData,
      })

      setUploadStatus("success")

      toast({
        title: "¡Éxito!",
        description: "El archivo CSV se ha importado correctamente",
      })

      onSuccess?.(response)

      setTimeout(() => {
        setIsOpen(false)
        setUploadStatus("idle")
      }, 2000)
    } catch (error) {
      setUploadStatus("error")
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"

      toast({
        title: "Error al importar",
        description: errorMessage,
        variant: "destructive",
      })

      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDownloadModel = () => {
    const link = document.createElement("a")
    link.href = modelData
    link.download = "modelo.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Importar {title}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar {title} CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Descargar modelo de datos</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadModel}>
              Descargar
            </Button>
          </div>

          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"} ${isUploading ? "pointer-events-none opacity-50" : "hover:border-primary/50"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
              </div>
            ) : uploadStatus === "success" ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p className="text-sm font-medium text-green-600">¡Archivo importado exitosamente!</p>
              </div>
            ) : uploadStatus === "error" ? (
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-destructive">Error al importar el archivo</p>
                <Button variant="outline" size="sm" onClick={() => setUploadStatus("idle")}>
                  Intentar de nuevo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Arrastra tu archivo XLSX aquí</p>
                <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
