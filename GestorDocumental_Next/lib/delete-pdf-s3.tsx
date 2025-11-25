"use client"

import { toast } from "@/components/ui/use-toast"
import fetchModel from "@/lib/fetch-utils"

interface DeletePdfOptions {
  id: number
  type: string[] // Ahora es un array de tipos
  model: string
}

interface FileInfo {
  id: number
  name: string
  path: string
  fileable_type: string
  fileable_id: number
  type: string
  disk: string
  created_at: string
  updated_at: string
  tmp_url: string
}

/**
 * Función para eliminar PDFs de S3
 * @param options Opciones para eliminar el PDF
 * @returns Promise<boolean> Indica si el proceso fue exitoso
 */
export async function DeletePdfS3({ id, type, model }: DeletePdfOptions): Promise<boolean> {
  console.log("Eliminando PDF")

  try {
    // Recorremos todos los tipos en el array 'type'
    for (const t of type) {
      const getEndpoint = `files/${model}/${id}/${t}`

      // Aquí asumimos que fetchModel ya devuelve el JSON directamente
      const files = await fetchModel<FileInfo[]>(getEndpoint)

      console.log(`Archivos encontrados para tipo ${t}:`, files)

      if (!files || files.length === 0) {
        toast({
          title: "Archivo no encontrado",
          description: `No se encontró ningún archivo de tipo ${t} para eliminar.`,
          variant: "destructive",
        })
        continue // Saltamos a la siguiente iteración
      }

      const fileId = files[0].id
      const deleteEndpoint = `files/${model}/${id}/${fileId}`

      await fetchModel(deleteEndpoint, {
        method: "DELETE",
      })

      // toast({
      //   title: "PDF Eliminado",
      //   description: `El PDF de tipo ${t} se ha eliminado correctamente.`,
      // })

      console.log(`PDF de tipo ${t} eliminado con éxito`)
    }

    return true
  } catch (error) {
    console.error("Error eliminando PDF:", error)
    // toast({
    //   title: "Error al eliminar PDF",
    //   description: "Hubo un problema al eliminar el PDF.",
    //   variant: "destructive",
    // })

    return false
  }
}
