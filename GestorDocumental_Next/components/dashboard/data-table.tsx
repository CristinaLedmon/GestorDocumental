"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { ColumnFilterPopover } from "@/components/ui/column-filter-popover"
import type { ColumnFilter } from "@/types/column-filter"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[] | null
  foreignData?: Record<string, any>
  initialColumnVisibility?: VisibilityState // Added initialColumnVisibility prop
  onSearchChange?: (searchTerm: string) => void
  onSortingChange?: (sorting: SortingState) => void
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  currentSearch?: string
  currentSorting?: SortingState
  onFilteredDataChange?: (filteredData: TData[]) => void
  onColumnFiltersChange?: (filters: ColumnFilter[]) => void
  currentColumnFilters?: ColumnFilter[]
}

const DataTable = <TData, TValue>({
  columns,
  data,
  foreignData,
  initialColumnVisibility,
  onSearchChange,
  onSortingChange,
  onColumnVisibilityChange,
  currentSearch,
  currentSorting,
  onFilteredDataChange,
  onColumnFiltersChange,
  currentColumnFilters = [],
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = React.useState<SortingState>(currentSorting || [])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility || {})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchTerm, setSearchTerm] = React.useState(currentSearch || "")
  const [individualColumnFilters, setIndividualColumnFilters] = React.useState<ColumnFilter[]>(currentColumnFilters)

  const router = useRouter()
  const pathname = usePathname()

  // Función auxiliar para buscar en objetos anidados
  const searchInNestedObject = React.useCallback((obj: any, term: string): boolean => {
    if (!term) return true
    const search = term.toLowerCase()

    const recursiveSearch = (value: any): boolean => {
      if (!value) return false

      if (typeof value === "object") {
        return Object.values(value).some((v) => recursiveSearch(v))
      }

      return String(value).toLowerCase().includes(search)
    }

    return recursiveSearch(obj)
  }, [])

  const filteredData = React.useMemo(() => {
    if (!data) return data

    let result = [...data]

    // Apply global search filter
    if (searchTerm) {
      result = result.filter((row: any) => {
        // Primero buscar en campos anidados
        if (searchInNestedObject(row, searchTerm)) {
          return true
        }

        // Luego buscar en campos normales
        const hasMatch = columns.some((col: any) => {
          const accessorKey = col.accessorKey as string
          if (!accessorKey) {
            // Manejar accessorFn si existe
            if (col.accessorFn) {
              const value = col.accessorFn(row)
              return String(value).toLowerCase().includes(searchTerm.toLowerCase())
            }
            return false
          }

          let value = row[accessorKey]
          if (typeof value === "boolean") {
            value = value ? "Sí" : "No"
          }

          // Manejar foreignData
          if (foreignData && foreignData[accessorKey]) {
            const foreignInfo = foreignData[accessorKey]
            const foreignItem = foreignInfo.data.find((item: any) => item.id === value)
            if (foreignItem) {
              value = foreignInfo.valuesSearch
                .split(", ")
                .map((field: string) => foreignItem[field])
                .join(" ")
            }
          }

          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })

        return hasMatch
      })
    }

    individualColumnFilters.forEach((filter) => {
      result = result.filter((row: any) => {
        // Find the column definition to get filterConfig
        const columnDef = columns.find(
          (col: any) => col.accessorKey === filter.columnId || col.id === filter.columnId,
        ) as any
        const filterConfig = columnDef?.filterConfig

        // Helper function to get the value to filter by
        const getFilterValue = (row: any) => {
          if (filterConfig?.value_check) {
            // Handle nested property access like "polygon.name"
            return filterConfig.value_check.split(".").reduce((obj: any, key: string) => obj?.[key], row)
          }
          return row[filter.columnId]
        }

        const getDisplayValue = (rawValue: any) => {
          if (!filterConfig?.values_changes) return rawValue

          const mapping = filterConfig.values_changes.find((change: any) => change.value === rawValue)
          return mapping ? mapping.change : rawValue
        }

        const value = getFilterValue(row)
        let displayValue = getDisplayValue(value)

        if (typeof displayValue === "boolean") {
          displayValue = displayValue ? "Sí" : "No"
        }

        if (filter.type === "combined") {
          const combinedValue = filter.value as {
            search?: string
            check?: string[]
            dateRange?: { from: string; to: string }
            numberRange?: { min: number; max: number }
          }

          // All conditions must pass (AND logic)
          let passes = true

          if (combinedValue.search && passes) {
            const searchValue = combinedValue.search
            passes = String(displayValue).toLowerCase().includes(searchValue.toLowerCase())
          }

          if (combinedValue.check && combinedValue.check.length > 0 && passes) {
            passes = combinedValue.check.includes(String(value))
          }

          // Check date range filter - use raw value for dates
          if (combinedValue.dateRange && passes) {
            const { from, to } = combinedValue.dateRange
            if (from || to) {
              const dateValue = new Date(value)
              if (!isNaN(dateValue.getTime())) {
                const fromDate = from ? new Date(from) : null
                const toDate = to ? new Date(to) : null

                if (fromDate && dateValue < fromDate) passes = false
                if (toDate && dateValue > toDate) passes = false
              }
            }
          }

          // Check number range filter - use raw value for numbers
          if (combinedValue.numberRange && passes) {
            const { min, max } = combinedValue.numberRange
            // Only apply filter if min or max are actually set (not infinity values)
            if (min !== Number.NEGATIVE_INFINITY || max !== Number.POSITIVE_INFINITY) {
              const numValue = Number(value)
              if (!isNaN(numValue)) {
                if (min !== Number.NEGATIVE_INFINITY && numValue < min) passes = false
                if (max !== Number.POSITIVE_INFINITY && numValue > max) passes = false
              } else {
                // If value is not a number, it doesn't pass numeric filter
                passes = false
              }
            }
          }

          return passes
        } else if (filter.type === "search") {
          const searchValue = filter.value as string
          return String(displayValue).toLowerCase().includes(searchValue.toLowerCase())
        } else if (filter.type === "check") {
          const checkValues = filter.value as string[]
          return checkValues.includes(String(value))
        } else if (filter.type === "dateRange") {
          const { from, to } = filter.value as { from: string; to: string }
          const dateValue = new Date(value)

          if (isNaN(dateValue.getTime())) return true // Skip invalid dates

          const fromDate = from ? new Date(from) : null
          const toDate = to ? new Date(to) : null

          if (fromDate && dateValue < fromDate) return false
          if (toDate && dateValue > toDate) return false

          return true
        } else if (filter.type === "numberRange") {
          const { min, max } = filter.value as { min: number; max: number }
          const numValue = Number(value)

          if (isNaN(numValue)) return true // Skip non-numeric values

          if (min !== Number.NEGATIVE_INFINITY && numValue < min) return false
          if (max !== Number.POSITIVE_INFINITY && numValue > max) return false

          return true
        }

        return true
      })
    })

    return result
  }, [data, searchTerm, columns, foreignData, searchInNestedObject, individualColumnFilters])

  const table = useReactTable({
    data: filteredData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm)
    }
  }, [searchTerm, onSearchChange])

  React.useEffect(() => {
    if (onSortingChange) {
      onSortingChange(sorting)
    }
  }, [sorting, onSortingChange])

  React.useEffect(() => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(columnVisibility)
    }
  }, [columnVisibility, onColumnVisibilityChange])

  React.useEffect(() => {
    if (onFilteredDataChange && filteredData) {
      onFilteredDataChange(filteredData)
    }
  }, [filteredData, onFilteredDataChange])

  React.useEffect(() => {
    if (onColumnFiltersChange) {
      onColumnFiltersChange(individualColumnFilters)
    }
  }, [individualColumnFilters, onColumnFiltersChange])

  //CODIGO PARA EXTRAER HEADERS
  const getHeaderText = React.useCallback((column: any) => {
    const header = column.columnDef.header
    if (typeof header === "function") {
      const tempElement = header({ column })
      if (tempElement?.props?.children) {
        return Array.isArray(tempElement.props.children)
          ? tempElement.props.children.find((child: any) => typeof child === "string")
          : tempElement.props.children
      }
    }
    return header
  }, [])
  //CODIGO PARA EXTRAER HEADERS

  // Función para determinar el estilo de la fila basado en el estado de pago
  const getRowStyle = (isPaid: boolean) => {
    if (isPaid === true) {
      return "bg-green-400/10 hover:bg-green-400/20"
    } else if (isPaid === false) {
      return "bg-red-400/10 hover:bg-red-400/20"
    }
  }

  const handleColumnFilterChange = (columnId: string, filter: ColumnFilter | null) => {
    setIndividualColumnFilters((prev) => {
      const filtered = prev.filter((f) => f.columnId !== columnId)
      return filter ? [...filtered, filter] : filtered
    })
  }

  return (
    <div>
      <div className="flex items-center py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 bg-transparent">
              Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {getHeaderText(column)}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* style={{maxWidth: '90%'}} */}
      {/* EL PROBLEMA ESTA POR AQUI, HE INTENTADO SOLUCIONARLO HACIENDO ESTO DE METERLE UN  STYLE PERO NI ASI... */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            {/* <Table className="min-w-full"> */}
            <Table className="min-w-96">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const columnDef = header.column.columnDef as any
                      const hasFilterConfig =
                        columnDef.filterConfig &&
                        (columnDef.filterConfig.searchColumn ||
                          columnDef.filterConfig.checkColumn ||
                          columnDef.filterConfig.dateColumn ||
                          columnDef.filterConfig.numberColumn)
                      const currentFilter = individualColumnFilters.find((f) => f.columnId === header.column.id)

                      return (
                        <TableHead key={header.id}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            {hasFilterConfig && (
                              <ColumnFilterPopover
                                columnId={header.column.id}
                                filterConfig={columnDef.filterConfig}
                                currentFilter={currentFilter}
                                onFilterChange={(filter) => handleColumnFilterChange(header.column.id, filter)}
                                data={data || []}
                              />
                            )}
                          </div>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const rowOriginalId = (row.original as any)?.id
                    var isPaid = (row.original as any)?.is_paid

                    //PINTAR LOS TICKETS DE VERDE/ROJO EN FUNCION DE SI ESTAN DENTRO DE UN CIERRE
                    const original = row.original as any
                    if ("cash_out" in original) {
                      // Aquí sabemos que cash_out existe (puede ser null, 0, etc)
                      if (original.cash_out) {
                        isPaid = true
                      } else {
                        isPaid = false
                      }
                    }
                    //PINTAR LOS TICKETS DE VERDE/ROJO EN FUNCION DE SI ESTAN DENTRO DE UN CIERRE
                    //PINTAR LOS TICKETS DE VERDE/ROJO EN FUNCION DE SI ESTAN DENTRO DE UN CIERRE
                    if ("cash_out_court_id" in original) {
                      // Aquí sabemos que cash_out existe (puede ser null, 0, etc)
                      if (original.cash_out_court_id) {
                        isPaid = true
                      } else {
                        isPaid = false
                      }
                    }
                    //PINTAR LOS TICKETS DE VERDE/ROJO EN FUNCION DE SI ESTAN DENTRO DE UN CIERRE

                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={getRowStyle(isPaid)}
                        onClick={() => {
                          if (!rowOriginalId) return
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isActionColumn = cell.column.id === "actions"
                          return (
                            <TableCell key={cell.id} onClick={isActionColumn ? (e) => e.stopPropagation() : undefined}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No hay resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4 px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Siguiente
            </Button>
          </div>
        </div>
      </div>
   
  )
}

export { DataTable }
export default DataTable
