"use client"

import { toast } from "@/components/ui/use-toast"
import fetchModel from "@/lib/fetch-utils"

interface GeneratePdfOptions {
  id: number
  type: string
  model: string
  s3: boolean
}

/**
 * Función para generar PDFs en segundo plano
 * @param options Opciones para generar el PDF
 * @returns Promise<boolean> Indica si el proceso fue exitoso
 */
export async function generatePdfS3({ id, type, model, s3 }: GeneratePdfOptions): Promise<boolean> {
  console.log("Generando PDF")
  console.log("S3=" + s3)
  try {
    const endpoint = `reports/generate/${model}/${id}/${type}${s3 ? `?s3=${s3}` : ''}`;
    await fetchModel(endpoint, {
      method: "GET",
    })

    // toast({
    //   title: "PDF Generado",
    //   description: "El PDF de la invitación se ha generado correctamente.",
    // })

    console.log("PDF generado con éxito")
    return true
  } catch (error) {
    console.error("Error generando PDF:", error)
    // toast({
    //   title: "Error en PDF",
    //   description: "Hubo un problema al generar el PDF, pero la invitación fue creada correctamente.",
    //   variant: "destructive",
    // })

    return false
  }
}




//EJEMPLO DE USO

// const success = await generatePdfS3({
//   id: batchResponse.data.id,
//   model: "batch",
//   type: "type1",
// })
