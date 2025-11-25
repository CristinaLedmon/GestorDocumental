"use client"

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import fetchModel from "@/lib/fetch-utils"
import { toast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/dashboard/data-table"
import DataTableSkeleton from "@/components/dashboard/skeletons/DataTableSkeleton"


// 👉 Función para formatear la fecha a 30/12/2025
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

interface ListProps<TData> {
  endpoint: string
  columns: ColumnDef<TData>[]
  triggerRefetch?: number
  onTableStateChange?: any
  columnVisibility?: any
  // onTableStateChange?: (state: {
  //   searchTerm: string
  //   sorting: SortingState
  //   columnVisibility: VisibilityState
  //   filteredData: TData[]
  //   columns: ColumnDef<TData>[]
  //   columnFilters: ColumnFilter[]
  // }) => void
  onColumnVisibilityChange?: (newVisibility: VisibilityState) => void
}

export function List<TData>({
  endpoint,
  columns,
  triggerRefetch,
  columnVisibility,
  onTableStateChange,
  onColumnVisibilityChange, // 👈 aseguramos que está destructurado
}: ListProps<TData>) {
  const [data, setData] = useState<TData[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentColumnVisibility, setCurrentColumnVisibility] = useState<VisibilityState>(columnVisibility || {})
  const [filteredData, setFilteredData] = useState<TData[]>([])
  const [columnFilters, setColumnFilters] = useState<any[]>([])

  // 🚀 Subimos cambios de visibilidad de columnas al padre
  useEffect(() => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(currentColumnVisibility)
    }
  }, [currentColumnVisibility, onColumnVisibilityChange])

  // Obtiene los datos de la tabla
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await fetchModel<{ data: TData[] }>(endpoint)
      setData(data)
    } catch {
      toast({
        title: "Error al cargar datos",
        description: "Hubo un problema al obtener los datos.",
      })
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchData()
  }, [fetchData, triggerRefetch])

  const processedColumns = useMemo(() => {
    return columns.map((col) => {
      const accessorKey = (col as any).accessorKey as string
      return {
        ...col,
        cell: col.cell
          ? col.cell
          : ({ row }) => {
              const getNestedValue = (obj: any, path: string) => path.split(".").reduce((acc, key) => acc?.[key], obj)

              let value = getNestedValue(row.original, accessorKey)

              if ((col as any).formatDate && value) value = formatDate(value)

              if (typeof value === "boolean") return value ? "Sí" : "No"
              return (col as any).afterValue !== undefined ? value + (col as any).afterValue : value
            },
      }
    })
  }, [columns])

  const table = useReactTable({
    data,
    columns: processedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize: 10 }, columnVisibility: currentColumnVisibility },
  })

  const previousStateRef = useRef<string>("")

  const handleFilteredDataChange = useCallback((filtered: TData[]) => {
    setFilteredData(filtered)
  }, [])

  // console.log("sorting del list=" + JSON.stringify(sorting))

  // 🚀 Subimos cambios de toda la tabla al padre
  useEffect(() => {
    if (!onTableStateChange) return

    // Creamos una representación estable del estado
    const currentState = JSON.stringify({
      searchTerm,
      sorting,
      filteredDataLength: filteredData.length,
      processedColumnsLength: processedColumns.length,
      columnVisibility: currentColumnVisibility,
      columnFilters,
    })

    // Solo llamamos si el contenido cambió realmente
    if (currentState !== previousStateRef.current) {
      previousStateRef.current = currentState

      onTableStateChange({
        searchTerm,
        sorting,
        columnVisibility: currentColumnVisibility,
        filteredData,
        columns: processedColumns,
        columnFilters,
      })
    }
  }, [searchTerm, sorting, currentColumnVisibility, filteredData, processedColumns, onTableStateChange, columnFilters])

  return (
    <div>
      {loading ? (
        <DataTableSkeleton />
      ) : (
        <DataTable
          columns={processedColumns}
          data={data}
          initialColumnVisibility={currentColumnVisibility}
          onSearchChange={setSearchTerm}
          onSortingChange={setSorting}
          onColumnVisibilityChange={setCurrentColumnVisibility}
          currentSearch={searchTerm}
          currentSorting={sorting}
          onFilteredDataChange={handleFilteredDataChange}
          onColumnFiltersChange={setColumnFilters}
          currentColumnFilters={columnFilters}
        />
      )}
    </div>
  )
}
