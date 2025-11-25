import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Download, Hourglass } from "lucide-react";
import fetchModel from "@/lib/fetch-utils";

interface DownloadButtonProps {
  model: string;
  itemId: number;
  fileType: string;
}

export function DownloadButton({ model, itemId, fileType }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`Solicitando descarga desde: files/${model}/${itemId}/${fileType}`);

      const response = await fetchModel<{ id: number; name: string; tmp_url: string }[]>(`files/${model}/${itemId}/${fileType}`);

      console.log("Respuesta de la API para descarga:", response);

      //  if (!response || response.length === 0) {
      //    throw new Error("No se encontraron archivos para descargar.");
      //  }

      if (!response || response.length === 0) {
        toast({
          title: "Descarga fallida",
          description: `No se encontraron archivos para descargar.`,
        });
        return;
        // throw new Error("No se encontraron archivos para descargar.");
      }

 

      const { tmp_url, name } = response[0];
      const fileUrl = tmp_url;

      console.log("Archivo encontrado:", name, "URL:", fileUrl);

      const responseBlob = await fetch(fileUrl);
      const blob = await responseBlob.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "Descarga iniciada",
        description: `El archivo ${name} se está descargando.`,
      });
    } catch (error: any) {
      console.error("Error al descargar el archivo:", error);
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al descargar el archivo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [model, itemId, fileType]);

  return (
    <Button variant="ghost" size="icon" onClick={handleDownload} disabled={isLoading} aria-label="Descargar archivo">
      {isLoading ? <span className="animate-spin"><Hourglass className="h-4 w-4" /></span> : <Download className="h-4 w-4" />}
    </Button>
  );
}
