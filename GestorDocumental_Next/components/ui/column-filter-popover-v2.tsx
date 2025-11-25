"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, Search, CheckSquare, Calendar, CalendarDays } from "lucide-react"
import type { ColumnFilterConfig, ColumnFilter } from "@/types/column-filter"

interface ColumnFilterPopoverProps {
  columnId: string
  filterConfig: ColumnFilterConfig
  currentFilter?: ColumnFilter
  onFilterChange: (filter: ColumnFilter | null) => void
  data?: any[]
}

export function ColumnFilterPopover({
  columnId,
  filterConfig,
  currentFilter,
  onFilterChange,
  data = [],
}: ColumnFilterPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState(
    currentFilter?.type === "search" ? (currentFilter.value as string) : "",
  )
  const [checkedValues, setCheckedValues] = React.useState<string[]>(
    currentFilter?.type === "check" ? (currentFilter.value as string[]) : [],
  )

  const [dateFrom, setDateFrom] = React.useState(
    currentFilter?.type === "dateRange" ? (currentFilter.value as { from: string; to: string }).from : "",
  )
  const [dateTo, setDateTo] = React.useState(
    currentFilter?.type === "dateRange" ? (currentFilter.value as { from: string; to: string }).to : "",
  )

  const [numberMin, setNumberMin] = React.useState(
    currentFilter?.type === "numberRange" ? (currentFilter.value as { min: number; max: number }).min : "",
  )
  const [numberMax, setNumberMax] = React.useState(
    currentFilter?.type === "numberRange" ? (currentFilter.value as { min: number; max: number }).max : "",
  )

  const uniqueValues = React.useMemo(() => {
    if (!filterConfig.checkColumn || !data.length) return []

    const values = new Set<string>()
    data.forEach((item) => {
      const value = item[columnId]
      if (value != null) {
        if (typeof value === "boolean") {
          values.add(value ? "Sí" : "No")
        } else {
          values.add(String(value))
        }
      }
    })

    return Array.from(values)
      .sort()
      .map((value) => ({
        value,
        label: value,
      }))
  }, [data, columnId, filterConfig.checkColumn])

  const handleFilterChange = React.useCallback(
    (filter: ColumnFilter | null) => {
      onFilterChange(filter)
    },
    [onFilterChange],
  )

  const currentFilterRef = React.useRef(currentFilter)
  React.useEffect(() => {
    currentFilterRef.current = currentFilter
  }, [currentFilter])

  React.useEffect(() => {
    if (searchValue.trim()) {
      const newFilter: ColumnFilter = {
        columnId,
        type: "search",
        value: searchValue.trim(),
      }
      // Solo actualizar si el filtro realmente cambió
      if (
        !currentFilterRef.current ||
        currentFilterRef.current.type !== "search" ||
        currentFilterRef.current.value !== searchValue.trim()
      ) {
        handleFilterChange(newFilter)
      }
    } else if (currentFilterRef.current?.type === "search") {
      handleFilterChange(null)
    }
  }, [searchValue, columnId, handleFilterChange])

  React.useEffect(() => {
    if (checkedValues.length > 0) {
      const newFilter: ColumnFilter = {
        columnId,
        type: "check",
        value: checkedValues,
      }
      // Solo actualizar si el filtro realmente cambió
      if (
        !currentFilterRef.current ||
        currentFilterRef.current.type !== "check" ||
        JSON.stringify(currentFilterRef.current.value) !== JSON.stringify(checkedValues)
      ) {
        handleFilterChange(newFilter)
      }
    } else if (currentFilterRef.current?.type === "check") {
      handleFilterChange(null)
    }
  }, [checkedValues, columnId, handleFilterChange])

  React.useEffect(() => {
    if (dateFrom || dateTo) {
      const newFilter: ColumnFilter = {
        columnId,
        type: "dateRange",
        value: { from: dateFrom, to: dateTo },
      }
      // Solo actualizar si el filtro realmente cambió
      if (
        !currentFilterRef.current ||
        currentFilterRef.current.type !== "dateRange" ||
        JSON.stringify(currentFilterRef.current.value) !== JSON.stringify({ from: dateFrom, to: dateTo })
      ) {
        handleFilterChange(newFilter)
      }
    } else if (currentFilterRef.current?.type === "dateRange") {
      handleFilterChange(null)
    }
  }, [dateFrom, dateTo, columnId, handleFilterChange])

  React.useEffect(() => {
    const min = numberMin !== "" ? Number(numberMin) : undefined
    const max = numberMax !== "" ? Number(numberMax) : undefined

    if (min !== undefined || max !== undefined) {
      const newFilter: ColumnFilter = {
        columnId,
        type: "numberRange",
        value: {
          min: min ?? Number.NEGATIVE_INFINITY,
          max: max ?? Number.POSITIVE_INFINITY,
        },
      }
      // Solo actualizar si el filtro realmente cambió
      if (
        !currentFilterRef.current ||
        currentFilterRef.current.type !== "numberRange" ||
        JSON.stringify(currentFilterRef.current.value) !== JSON.stringify(newFilter.value)
      ) {
        handleFilterChange(newFilter)
      }
    } else if (currentFilterRef.current?.type === "numberRange") {
      handleFilterChange(null)
    }
  }, [numberMin, numberMax, columnId, handleFilterChange])

  const handleClear = () => {
    setSearchValue("")
    setCheckedValues([])
    setDateFrom("")
    setDateTo("")
    setNumberMin("")
    setNumberMax("")
    onFilterChange(null)
    setIsOpen(false)
  }

  const hasActiveFilter = currentFilter != null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${hasActiveFilter ? "text-blue-600 bg-blue-50" : "text-muted-foreground"}`}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="font-medium text-sm">Filtrar columna</div>

          {filterConfig.searchColumn && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">Buscar por texto</span>
              </div>
              <Input
                placeholder="Escribir para buscar..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          )}

          {filterConfig.checkColumn && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Seleccionar valores</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {uniqueValues.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${columnId}-${option.value}`}
                      checked={checkedValues.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCheckedValues((prev) => [...prev, option.value])
                        } else {
                          setCheckedValues((prev) => prev.filter((v) => v !== option.value))
                        }
                      }}
                    />
                    <label htmlFor={`${columnId}-${option.value}`} className="text-sm cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filterConfig.dateColumn && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm font-medium">Rango de fechas</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Desde</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hasta</label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {filterConfig.numberColumn && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Rango numérico</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Mínimo</label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={numberMin}
                    onChange={(e) => setNumberMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Máximo</label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={numberMax}
                    onChange={(e) => setNumberMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {hasActiveFilter && (
            <Button onClick={handleClear} variant="outline" size="sm" className="w-full bg-transparent">
              Limpiar filtro
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
