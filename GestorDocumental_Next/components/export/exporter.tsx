"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Table, GripVertical, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SortingState, VisibilityState, ColumnDef } from "@tanstack/react-table"

interface PreviewTableProps {
  columns: any[]
  filteredData: any[]
  pdfTitle: string
  pdfSubtitle: string
  headerColor: string
  includeDate: boolean
  includePageNumbers: boolean
  orientation: "portrait" | "landscape"
  flattenObject: (obj: any, prefix?: string) => Record<string, any>
}

const PreviewTable = ({
  columns,
  filteredData,
  pdfTitle,
  pdfSubtitle,
  headerColor,
  includeDate,
  includePageNumbers,
  orientation,
  flattenObject,
}: PreviewTableProps) => {
  const selectedColumns = columns.filter((col) => col.selected).sort((a, b) => a.order - b.order)
  const previewData = filteredData.slice(0, 5) // Show only first 5 rows for preview

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 41, g: 128, b: 185 }
  }

  const rgb = hexToRgb(headerColor)
  const headerStyle = {
    backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    color: rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 186 ? "#000000" : "#ffffff",
  }

  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="font-semibold">{pdfTitle}</h3>
        {pdfSubtitle && <p className="text-sm text-muted-foreground">{pdfSubtitle}</p>}
        {includeDate && <p className="text-xs text-muted-foreground">Fecha: {new Date().toLocaleDateString()}</p>}
        <p className="text-xs text-muted-foreground">
          Orientación: {orientation === "portrait" ? "Vertical" : "Horizontal"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse border">
          <thead>
            <tr style={headerStyle}>
              {selectedColumns.map((col) => (
                <th key={col.key} className="border p-2 text-left font-medium">
                  {col.name_exporter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((item, index) => {
              const flattened = flattenObject(item)
              return (
                <tr key={index} className="border-b">
                  {selectedColumns.map((col) => (
                    <td key={col.key} className="border p-2">
                      {String(flattened[col.value_exporter] || "")}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {includePageNumbers && (
        <div className="text-xs text-muted-foreground text-center border-t pt-2">Página 1 de X</div>
      )}

      {filteredData.length > 5 && (
        <p className="text-xs text-muted-foreground">Mostrando 5 de {filteredData.length} filas en la vista previa</p>
      )}
    </div>
  )
}

interface DataExporterProps<TData = any> {
  filteredData: TData[]
  tableColumns: ColumnDef<TData>[]
  filename?: string
  title?: string
  className?: string
  searchTerm?: string
  sorting?: SortingState
  tableColumnVisibility?: VisibilityState
}

interface Column {
  key: string
  name_exporter: string
  value_exporter: string
  selected: boolean
  order: number
}

interface PDFCustomization {
  title: string
  subtitle: string
  headerColor: string
  fontSize: number
  orientation: "portrait" | "landscape"
  includeDate: boolean
  includePageNumbers: boolean
  pageSize: string
  primaryColor: string
  fontFamily: string
}

export function Exporter<TData = any>({
  filteredData,
  tableColumns,
  filename = "export",
  title = "Exportar Datos",
  className,
  searchTerm,
  sorting,
  tableColumnVisibility,
}: DataExporterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [csvDelimiter, setCsvDelimiter] = useState(",")

  console.warn("columns ini:\n" + JSON.stringify(columns, null, 2))

  const [pdfCustomization, setPdfCustomization] = useState<PDFCustomization>({
    title: "Reporte de Datos",
    subtitle: "",
    headerColor: "#2980b9",
    fontSize: 8,
    orientation: "portrait",
    includeDate: true,
    includePageNumbers: true,
    pageSize: "A4",
    primaryColor: "#000000",
    fontFamily: "Arial",
  })

  const columnsExtractedRef = useRef(false)
  const lastDataLengthRef = useRef(0)

  const flattenObject = useCallback((obj: any, prefix = ""): Record<string, any> => {
    console.log("[v0] flattenObject called")
    const flattened: Record<string, any> = {}

    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        flattened[prefix + key] = ""
      } else if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}.`))
      } else {
        flattened[prefix + key] = obj[key]
      }
    }

    return flattened
  }, [])

  useEffect(() => {
    if (!isOpen || !columns.length || initialized) return

    console.warn("tableColumnVisibility=" + JSON.stringify(tableColumnVisibility))
    console.warn("COLUMNS:\n" + JSON.stringify(columns, null, 2))
    var newColumns = []
    for (var i = 0; i < columns.length; i++) {
      var col = { ...columns[i] } // copiamos para no mutar
      if (tableColumnVisibility[col.value_exporter] === true) {
        console.log(
          "%c ÉXITO: operación completada",
          "color: white; background-color: green; padding: 2px 6px; border-radius: 3px;",
        )
        col.selected = true
      } else {
        console.log(
          "%c ERROR: operación fallida",
          "color: white; background-color: red; padding: 2px 6px; border-radius: 3px;",
        )
        col.selected = false
      }

      newColumns.push(col)
    }
    console.log("NUEVAS COLS=" + JSON.stringify(newColumns))
    setColumns(newColumns)
    setInitialized(true) // 🚀 marcamos que ya está inicializado
  }, [isOpen, columns])

  useEffect(() => {
    if (!isOpen) {
      setInitialized(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (tableColumns && tableColumns.length > 0) {
      tableColumns.forEach((col: any, index: number) => {})
    }

    if (!isOpen) {
      console.log("[v0] Modal not open, skipping")
      return
    }

    if (!filteredData || filteredData.length === 0) {
      console.log("[v0] No filtered data, skipping")
      return
    }

    if (columnsExtractedRef.current && lastDataLengthRef.current === filteredData.length) {
      console.log("[v0] Columns already extracted for this data, skipping")
      return
    }

    console.log("[v0] Starting column extraction...")
    setLoading(true)
    columnsExtractedRef.current = true
    lastDataLengthRef.current = filteredData.length

    try {
      const simpleColumns: Column[] = []

      if (tableColumns && tableColumns.length > 0) {
        console.log("[v0] Extracting from tableColumns:", tableColumns.length, "columns")
        tableColumns.forEach((col: any, index: number) => {
          if (col.id === "actions" || col.accessorKey === "actions") {
            return
          }

          const columnKey = col.value_exporter || col.accessorKey || col.id
          let columnLabel = columnKey

          console.warn("DATOS:\n" + JSON.stringify(columnKey, null, 2))

          console.log(`[v0] Processing column ${columnKey}:`, {
            name_exporter: col.name_exporter,
            value_exporter: col.value_exporter,
            hasOwnProperty: col.hasOwnProperty("name_exporter"),
            typeof: typeof col.name_exporter,
            keys: Object.keys(col),
          })

          if (col.name_exporter && typeof col.name_exporter === "string" && col.name_exporter.trim() !== "") {
            columnLabel = col.name_exporter
            console.log(`[v0] ✅ Using name_exporter for ${columnKey}: "${columnLabel}"`)
          } else {
            console.log(`[v0] ❌ No valid name_exporter for ${columnKey}, using fallback`)
            columnLabel = columnKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          }

          console.log(`[v0] Final column: ${columnKey} -> "${columnLabel}"`)

          if (columnKey) {
            simpleColumns.push({
              key: columnKey,
              name_exporter: columnLabel,
              value_exporter: col.value_exporter || col.accessorKey || col.id,
              selected: true,
              order: index,
            })
          }
        })
      }

      if (simpleColumns.length === 0 && filteredData.length > 0) {
        console.log("[v0] No table columns found, extracting from data")
        const firstItem = filteredData[0]
        const flattened = flattenObject(firstItem)
        Object.keys(flattened).forEach((key, index) => {
          simpleColumns.push({
            key,
            name_exporter: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            selected: true,
            order: index,
            value_exporter: key,
          })
        })
      }

      console.log("[v0] Final extracted columns:", simpleColumns)
      setColumns(simpleColumns)
    } catch (error) {
      console.error("[v0] Error extracting columns:", error)
    } finally {
      setLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      console.log("[v0] Modal closed, resetting extraction flag")
      columnsExtractedRef.current = false
      lastDataLengthRef.current = 0
      setColumns([])
    }
  }, [isOpen])

  const toggleColumn = useCallback((key: string) => {
    setColumns((prev) => prev.map((col) => (col.key === key ? { ...col, selected: !col.selected } : col)))
  }, [])

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumns((prev) => {
      const newColumns = [...prev]
      const [movedColumn] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, movedColumn)
      return newColumns.map((col, index) => ({ ...col, order: index }))
    })
  }, [])

  const sortedData = useMemo(() => {
    if (!filteredData || !sorting || sorting.length === 0) {
      return filteredData || []
    }

    const sortedArray = [...filteredData]

    sorting.forEach((sort) => {
      const { id, desc } = sort

      sortedArray.sort((a, b) => {
        const column = tableColumns?.find((col: any) => col.accessorKey === id || col.id === id)

        let aValue: any
        let bValue: any

        if (column) {
          if ((column as any).accessorFn) {
            aValue = (column as any).accessorFn(a)
            bValue = (column as any).accessorFn(b)
          } else if ((column as any).accessorKey) {
            const keys = (column as any).accessorKey.split(".")
            aValue = keys.reduce((obj: any, key: string) => obj?.[key], a)
            bValue = keys.reduce((obj: any, key: string) => obj?.[key], b)
          } else {
            aValue = (a as any)[id]
            bValue = (b as any)[id]
          }
        } else {
          aValue = (a as any)[id]
          bValue = (b as any)[id]
        }

        if (aValue == null && bValue == null) return 0
        if (aValue == null) return desc ? 1 : -1
        if (bValue == null) return desc ? -1 : 1

        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue, "es-ES", { numeric: true })
          return desc ? -comparison : comparison
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return desc ? bValue - aValue : aValue - bValue
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return desc ? bValue.getTime() - aValue.getTime() : aValue.getTime() - bValue.getTime()
        }

        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        const comparison = aStr.localeCompare(bStr, "es-ES", { numeric: true })
        return desc ? -comparison : comparison
      })
    })

    return sortedArray
  }, [filteredData, sorting, tableColumns])

  const exportToCSV = () => {
    if (!sortedData || sortedData.length === 0) {
      alert("No hay datos para exportar")
      return
    }

    const selectedColumns = columns.filter((col) => col.selected).sort((a, b) => a.order - b.order)
    const headers = selectedColumns.map((col) => col.name_exporter)

    const csvData = sortedData.map((item) => {
      return selectedColumns.map((col) => {
        let value: any

        if (col.value_exporter.includes(".")) {
          const keys = col.value_exporter.split(".")
          value = keys.reduce((obj: any, key: string) => {
            return obj && obj[key] !== undefined ? obj[key] : null
          }, item)
        } else {
          value = (item as any)[col.value_exporter]
        }

        if (value === null || value === undefined) {
          return ""
        }

        const stringValue = String(value)
        const needsQuoting =
          stringValue.includes(csvDelimiter) || stringValue.includes('"') || stringValue.includes("\n")
        return needsQuoting ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
      })
    })

    const csvContent = [headers, ...csvData].map((row) => row.join(csvDelimiter)).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.csv`
    link.click()
    setIsOpen(false)
  }

  const loadPDFMake = async () => {
    if (!(window as any).pdfMake) {
      await new Promise((resolve, reject) => {
        const script1 = document.createElement("script")
        script1.src = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"
        script1.onload = () => {
          const script2 = document.createElement("script")
          script2.src = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"
          script2.onload = () => resolve(true)
          script2.onerror = reject
          document.head.appendChild(script2)
        }
        script1.onerror = reject
        document.head.appendChild(script1)
      })
    }
    return (window as any).pdfMake
  }

  const exportToPDF = async () => {
    try {
      setLoading(true)
      console.log("[v0] Starting PDF export...")

      const pdfMake = await loadPDFMake()
      if (!pdfMake) {
        throw new Error("No se pudo cargar PDFMake")
      }

      const selectedColumns = columns.filter((col) => col.selected).sort((a, b) => a.order - b.order)

      if (selectedColumns.length === 0) {
        throw new Error("No hay columnas seleccionadas")
      }

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
          ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
          : [41, 128, 185]
      }

      const headerRgb = hexToRgb(pdfCustomization.headerColor)
      const headerTextColor =
        headerRgb[0] * 0.299 + headerRgb[1] * 0.587 + headerRgb[2] * 0.114 > 186 ? "black" : "white"

      // Prepare table data
      const tableBody = [
        // Header row
        selectedColumns.map((col) => ({
          text: col.name_exporter,
          style: "tableHeader",
          fillColor: pdfCustomization.headerColor, // Using the selected header color
          color: headerTextColor, // Using proper contrast text color
        })),
        // Data rows
        ...sortedData.map((row) =>
          selectedColumns.map((col) => {
            let value: any
            if (col.value_exporter.includes(".")) {
              const keys = col.value_exporter.split(".")
              value = keys.reduce((obj: any, key: string) => {
                return obj && obj[key] !== undefined ? obj[key] : null
              }, row)
            } else {
              value = (row as any)[col.value_exporter]
            }
            return String(value || "")
          }),
        ),
      ]

      const docDefinition = {
        content: [
          // Title
          {
            text: pdfCustomization.title,
            style: "title",
            alignment: "center",
            margin: [0, 0, 0, 10],
          },
          // Subtitle
          ...(pdfCustomization.subtitle
            ? [
                {
                  text: pdfCustomization.subtitle,
                  style: "subtitle",
                  alignment: "center",
                  margin: [0, 0, 0, 10],
                },
              ]
            : []),
          // Date
          ...(pdfCustomization.includeDate
            ? [
                {
                  text: `Fecha: ${new Date().toLocaleDateString("es-ES")}`,
                  style: "date",
                  alignment: "right",
                  margin: [0, 0, 0, 20],
                },
              ]
            : []),
          // Table
          {
            table: {
              headerRows: 1,
              widths: Array(selectedColumns.length).fill("*"),
              body: tableBody,
            },
            layout: {
              fillColor: (rowIndex: number) => {
                return rowIndex === 0 ? pdfCustomization.headerColor : rowIndex % 2 === 0 ? "#f9f9f9" : null
              },
            },
          },
        ],
        styles: {
          title: {
            fontSize: 16,
            bold: true,
          },
          subtitle: {
            fontSize: 12,
            italics: true,
          },
          date: {
            fontSize: 10,
          },
          tableHeader: {
            bold: true,
            fontSize: pdfCustomization.fontSize,
            alignment: "center",
          },
        },
        defaultStyle: {
          fontSize: pdfCustomization.fontSize,
        },
        pageSize: pdfCustomization.pageSize,
        pageOrientation: "portrait", // Fixed to portrait since orientation is removed
        pageMargins: [40, 60, 40, 60],
        footer: pdfCustomization.includePageNumbers
          ? (currentPage: number, pageCount: number) => ({
              text: `Página ${currentPage} de ${pageCount}`,
              alignment: "center",
              fontSize: 8,
            })
          : undefined,
      }

      console.log("[v0] Creating PDF...")
      pdfMake.createPdf(docDefinition).download(`${filename}.pdf`)
      console.log("[v0] PDF download initiated")
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      alert("Error al generar el PDF: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const [tempColumnName, setTempColumnName] = useState<string>("")

  const startEditingColumn = (key: string, currentName: string) => {
    setEditingColumn(key)
    setTempColumnName(currentName)
  }

  const updateColumnLabel = useCallback((key: string, newLabel: string) => {
    setColumns((prev) => prev.map((col) => (col.key === key ? { ...col, name_exporter: newLabel } : col)))
    setEditingColumn(null)
    setTempColumnName("")
  }, [])

  const cancelEditing = () => {
    setEditingColumn(null)
    setTempColumnName("")
  }

  const generatePreview = () => {
    const selectedColumns = columns.filter((col) => col.selected).sort((a, b) => a.order - b.order)
    const previewData = sortedData.slice(0, 100)

    if (selectedColumns.length === 0 || previewData.length === 0) {
      return <div className="text-gray-500 text-center py-8">No hay datos para mostrar</div>
    }

    const tableClass = "w-full text-xs"

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? {
            r: Number.parseInt(result[1], 16),
            g: Number.parseInt(result[2], 16),
            b: Number.parseInt(result[3], 16),
          }
        : { r: 41, g: 128, b: 185 }
    }

    const rgb = hexToRgb(pdfCustomization.headerColor)
    const headerTextColor = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 186 ? "#000000" : "#ffffff"

    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">{pdfCustomization.title}</h3>
          {pdfCustomization.subtitle && <p className="text-gray-600">{pdfCustomization.subtitle}</p>}
          {pdfCustomization.includeDate && (
            <p className="text-sm text-gray-500">Fecha: {new Date().toLocaleDateString("es-ES")}</p>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden max-w-4xl mx-auto">
          <table className={tableClass}>
            <thead>
              <tr style={{ backgroundColor: pdfCustomization.headerColor }}>
                {selectedColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-2 py-1 text-left font-medium border-r border-white/20 last:border-r-0"
                    style={{
                      color: headerTextColor, // Using proper contrast color instead of headerColor
                      fontSize: `${pdfCustomization.fontSize}pt`,
                    }}
                  >
                    {col.name_exporter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  {selectedColumns.map((col) => {
                    let value: any
                    if (col.value_exporter.includes(".")) {
                      const keys = col.value_exporter.split(".")
                      value = keys.reduce((obj: any, key: string) => {
                        return obj && obj[key] !== undefined ? obj[key] : null
                      }, row)
                    } else {
                      value = (row as any)[col.value_exporter]
                    }
                    const displayValue = String(value || "")

                    return (
                      <td
                        key={col.key}
                        className="px-2 py-1 border-r border-gray-200 last:border-r-0 text-black"
                        style={{ fontSize: `${pdfCustomization.fontSize}pt` }}
                      >
                        {displayValue.substring(0, 30)}
                        {displayValue.length > 30 ? "..." : ""}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pdfCustomization.includePageNumbers && (
          <div className="text-center">
            <span className="text-xs text-gray-500">Página 1 de X</span>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          Vista previa - Mostrando {previewData.length} de {sortedData.length} filas
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="w-4 h-4 mr-2" />
          {title}
          {(searchTerm || (sorting && sorting.length > 0)) && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {[searchTerm ? "Búsqueda" : null, sorting && sorting.length > 0 ? "Ordenado" : null]
                .filter(Boolean)
                .join(", ")}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-none w-[80vw] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Datos
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Procesando datos...</span>
          </div>
        ) : (
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                CSV
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Exportar a CSV</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Separador de Columnas</Label>
                    <Select value={csvDelimiter} onValueChange={setCsvDelimiter}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Seleccionar separador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Coma (,)</SelectItem>
                        <SelectItem value=";">Punto y coma (;)</SelectItem>
                        <SelectItem value="\t">Tabulación</SelectItem>
                        <SelectItem value="|">Barra vertical (|)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Seleccionar Columnas ({columns.filter((c) => c.selected).length} de {columns.length})
                    </Label>
                    <ScrollArea className="h-64 mt-2 border rounded-md p-4">
                      <div className="space-y-3">
                        {columns.map((column) => (
                          <div key={column.key} className="flex items-center space-x-2 p-2 border rounded-md">
                            <Checkbox
                              id={column.key}
                              checked={column.selected}
                              onCheckedChange={() => toggleColumn(column.key)}
                            />
                            <div className="flex-1 min-w-0">
                              {editingColumn === column.key ? (
                                <Input
                                  value={tempColumnName}
                                  onChange={(e) => setTempColumnName(e.target.value)}
                                  onBlur={() => {
                                    if (tempColumnName.trim()) {
                                      updateColumnLabel(column.key, tempColumnName.trim())
                                    } else {
                                      cancelEditing()
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (tempColumnName.trim()) {
                                        updateColumnLabel(column.key, tempColumnName.trim())
                                      } else {
                                        cancelEditing()
                                      }
                                    } else if (e.key === "Escape") {
                                      cancelEditing()
                                    }
                                  }}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                              ) : (
                                <div className="space-y-1">
                                  <Label
                                    htmlFor={column.key}
                                    className="text-sm font-medium cursor-pointer"
                                    onClick={() => startEditingColumn(column.key, column.name_exporter)}
                                  >
                                    {column.name_exporter}
                                  </Label>
                                  <p className="text-xs text-muted-foreground truncate">Campo: {column.key}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">
                      {sortedData ? sortedData.length : 0} filas • {columns.filter((c) => c.selected).length} columnas
                    </Badge>
                    <Button onClick={exportToCSV} disabled={columns.filter((c) => c.selected).length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pdf" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Personalización PDF</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="pdf-title" className="text-sm font-medium">
                          Título
                        </Label>
                        <Input
                          id="pdf-title"
                          value={pdfCustomization.title}
                          onChange={(e) => setPdfCustomization((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Título del documento"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="pdf-subtitle" className="text-sm font-medium">
                          Subtítulo
                        </Label>
                        <Input
                          id="pdf-subtitle"
                          value={pdfCustomization.subtitle}
                          onChange={(e) => setPdfCustomization((prev) => ({ ...prev, subtitle: e.target.value }))}
                          placeholder="Subtítulo del documento"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Color de cabeceras</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={pdfCustomization.headerColor}
                            onChange={(e) => setPdfCustomization((prev) => ({ ...prev, headerColor: e.target.value }))}
                            className="w-8 h-8 rounded border cursor-pointer"
                          />
                          <Input
                            value={pdfCustomization.headerColor}
                            onChange={(e) => setPdfCustomization((prev) => ({ ...prev, headerColor: e.target.value }))}
                            placeholder="#000000"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Tamaño de fuente</Label>
                          <Select
                            value={pdfCustomization.fontSize.toString()}
                            onValueChange={(value) =>
                              setPdfCustomization((prev) => ({ ...prev, fontSize: Number.parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6">6pt</SelectItem>
                              <SelectItem value="7">7pt</SelectItem>
                              <SelectItem value="8">8pt</SelectItem>
                              <SelectItem value="9">9pt</SelectItem>
                              <SelectItem value="10">10pt</SelectItem>
                              <SelectItem value="11">11pt</SelectItem>
                              <SelectItem value="12">12pt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-date"
                            checked={pdfCustomization.includeDate}
                            onCheckedChange={(checked) =>
                              setPdfCustomization((prev) => ({ ...prev, includeDate: !!checked }))
                            }
                          />
                          <Label htmlFor="include-date" className="text-sm">
                            Incluir fecha
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-page-numbers"
                            checked={pdfCustomization.includePageNumbers}
                            onCheckedChange={(checked) =>
                              setPdfCustomization((prev) => ({ ...prev, includePageNumbers: !!checked }))
                            }
                          />
                          <Label htmlFor="include-page-numbers" className="text-sm">
                            Números de página
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="h-fit">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Columnas y Orden ({columns.filter((c) => c.selected).length} seleccionadas)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96 border rounded-md p-3">
                        <div className="space-y-2">
                          {columns
                            .sort((a, b) => a.order - b.order)
                            .map((column, index) => (
                              <div
                                key={column.key}
                                className="flex items-center space-x-2 p-2 border rounded-md bg-card"
                              >
                                <Checkbox checked={column.selected} onCheckedChange={() => toggleColumn(column.key)} />
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                <div className="flex-1 min-w-0">
                                  {editingColumn === column.key ? (
                                    <Input
                                      value={tempColumnName}
                                      onChange={(e) => setTempColumnName(e.target.value)}
                                      onBlur={() => {
                                        if (tempColumnName.trim()) {
                                          updateColumnLabel(column.key, tempColumnName.trim())
                                        } else {
                                          cancelEditing()
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          if (tempColumnName.trim()) {
                                            updateColumnLabel(column.key, tempColumnName.trim())
                                          } else {
                                            cancelEditing()
                                          }
                                        } else if (e.key === "Escape") {
                                          cancelEditing()
                                        }
                                      }}
                                      className="h-7 text-sm"
                                      autoFocus
                                    />
                                  ) : (
                                    <div
                                      onClick={() => startEditingColumn(column.key, column.name_exporter)}
                                      className="cursor-pointer"
                                    >
                                      <span className="text-sm font-medium">{column.name_exporter}</span>
                                      <p className="text-xs text-muted-foreground truncate">{column.key}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => index > 0 && moveColumn(index, index - 1)}
                                    disabled={index === 0}
                                    className="h-7 w-7 p-0"
                                  >
                                    ↑
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => index < columns.length - 1 && moveColumn(index, index + 1)}
                                    disabled={index === columns.length - 1}
                                    className="h-7 w-7 p-0"
                                  >
                                    ↓
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          {showPreview ? "Ocultar" : "Vista Previa"}
                        </Button>
                        <Button
                          onClick={exportToPDF}
                          disabled={columns.filter((c) => c.selected).length === 0 || loading}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {loading ? "Generando..." : "Descargar PDF"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {showPreview && (
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Vista Previa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-96">{generatePreview()}</ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
