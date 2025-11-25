"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Trash2Icon } from "lucide-react"
import fetchModel from "@/lib/fetch-utils"
import { DeletePdfS3 } from "@/lib/delete-pdf-s3"

interface DeleteItemProps {
  itemId: string
  itemName: string
  apiEndpoint: string
  entityLabel?: string
  deleteFiles?: boolean
  model?: string
  fileType?: string[] // Ahora es un array de tipos
  disabled?: boolean // Nueva propiedad
  onItemDeleted: () => void
}

export function DeleteItem({
  itemId,
  itemName,
  apiEndpoint,
  entityLabel = "registro",
  onItemDeleted,
  deleteFiles,
  model,
  fileType,
  disabled = false, // Valor por defecto
}: DeleteItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      // Eliminar el registro de la base de datos
      await fetchModel(`${apiEndpoint}/${itemId}`, {
        method: "DELETE",
      })

      toast({
        title: `${entityLabel.charAt(0).toUpperCase()}${entityLabel.slice(1)} eliminado`,
        description: `El/la ${entityLabel} ${itemName} ha sido eliminado exitosamente.`,
      })
      onItemDeleted()
      setIsOpen(false)
    } catch (error: any) {
      console.error(`Error eliminando ${entityLabel}:`, error)
      toast({
        title: "Error",
        description: error.message || `Hubo un problema al eliminar el ${entityLabel}.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }

    if (deleteFiles === true && Array.isArray(fileType) && fileType.length > 0) {
      console.log("Borrado de archivos")

      try {
        // Iterar sobre los tipos de archivos y eliminarlos
        for (const type of fileType) {
          // Verificamos que el tipo sea válido
          if (!type) {
            console.error(`Tipo de archivo inválido: ${type}`)
            continue
          }

          // Llamar a la función DeletePdfS3 con el tipo como un array
          const success = await DeletePdfS3({
            //@ts-ignore
            id: itemId,
            model: model ?? "",
            type: [type], // Pasamos el tipo como un array
          })

          if (!success) {
            console.error(`Error al eliminar archivo tipo ${type}`)
          }
        }
      } catch (error) {
        console.error("Error al borrar archivos de S3:", error)
        toast({
          title: "Error al borrar archivos",
          description: "Hubo un problema al eliminar los archivos de S3.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        disabled={disabled} // Aplicar la propiedad disabled
        aria-label={`Eliminar ${entityLabel} ${itemName}`}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Está seguro de que desea eliminar este/a {entityLabel}?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente {itemName} de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
