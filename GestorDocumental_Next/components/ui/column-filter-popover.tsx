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

  const getValueFromItem = React.useCallback(
    (item: any) => {
      if (filterConfig.value_check) {
        // Handle nested property access like "polygon.name"
        return filterConfig.value_check.split(".").reduce((obj, key) => obj?.[key], item)
      }
      return item[columnId]
    },
    [filterConfig.value_check, columnId],
  )

  const getDisplayValue = React.useCallback(
    (rawValue: any) => {
      if (!filterConfig.values_changes) return rawValue

      const mapping = filterConfig.values_changes.find((change) => change.value === rawValue)
      return mapping ? mapping.change : rawValue
    },
    [filterConfig.values_changes],
  )

  const getRawValue = React.useCallback(
    (displayValue: string) => {
      if (!filterConfig.values_changes) return displayValue

      const mapping = filterConfig.values_changes.find((change) => change.change === displayValue)
      return mapping ? mapping.value : displayValue
    },
    [filterConfig.values_changes],
  )

  const uniqueValues = React.useMemo(() => {
    if (!filterConfig.checkColumn || !data.length) return []

    const values = new Set<string>()
    data.forEach((item) => {
      const value = getValueFromItem(item)

      if (value != null) {
        const displayValue = getDisplayValue(value)
        if (typeof displayValue === "boolean") {
          values.add(displayValue ? "Sí" : "No")
        } else {
          values.add(String(displayValue))
        }
      }
    })

    return Array.from(values)
      .sort()
      .map((value) => ({
        value,
        label: value,
      }))
  }, [data, getValueFromItem, filterConfig.checkColumn, getDisplayValue])

  const currentFilterState = React.useMemo(() => {
    const hasSearch = searchValue.trim()
    const hasCheck = checkedValues.length > 0
    const hasDateRange = dateFrom || dateTo
    const hasNumberRange = numberMin !== "" || numberMax !== ""

    if (!hasSearch && !hasCheck && !hasDateRange && !hasNumberRange) {
      return null
    }

    const baseFilter = {
      columnId,
      value_check: filterConfig.value_check,
    }

    // Si solo hay un tipo de filtro activo, usar el formato simple
    if ([hasSearch, hasCheck, hasDateRange, hasNumberRange].filter(Boolean).length === 1) {
      if (hasSearch) {
        return {
          ...baseFilter,
          type: "search" as const,
          value: searchValue.trim(),
        }
      }
      if (hasCheck) {
        return {
          ...baseFilter,
          type: "check" as const,
          value: checkedValues.map(getRawValue),
        }
      }
      if (hasDateRange) {
        return {
          ...baseFilter,
          type: "dateRange" as const,
          value: { from: dateFrom, to: dateTo },
        }
      }
      if (hasNumberRange) {
        const min = numberMin !== "" ? Number(numberMin) : undefined
        const max = numberMax !== "" ? Number(numberMax) : undefined
        return {
          ...baseFilter,
          type: "numberRange" as const,
          value: {
            min: min ?? Number.NEGATIVE_INFINITY,
            max: max ?? Number.POSITIVE_INFINITY,
          },
        }
      }
    }

    // Si hay múltiples filtros, usar formato combinado
    const combinedValue: any = {}
    if (hasSearch) combinedValue.search = searchValue.trim()
    if (hasCheck) combinedValue.check = checkedValues.map(getRawValue)
    if (hasDateRange) combinedValue.dateRange = { from: dateFrom, to: dateTo }
    if (hasNumberRange) {
      const min = numberMin !== "" ? Number(numberMin) : undefined
      const max = numberMax !== "" ? Number(numberMax) : undefined
      combinedValue.numberRange = {
        min: min ?? Number.NEGATIVE_INFINITY,
        max: max ?? Number.POSITIVE_INFINITY,
      }
    }

    return {
      ...baseFilter,
      type: "combined" as const,
      value: combinedValue,
    }
  }, [
    searchValue,
    checkedValues,
    dateFrom,
    dateTo,
    numberMin,
    numberMax,
    columnId,
    filterConfig.value_check,
    getRawValue,
  ])

  const previousFilterRef = React.useRef<string>("")
  React.useEffect(() => {
    const currentFilterString = JSON.stringify(currentFilterState)
    if (currentFilterString !== previousFilterRef.current) {
      previousFilterRef.current = currentFilterString
      onFilterChange(currentFilterState)
    }
  }, [currentFilterState, onFilterChange])

  const handleClear = () => {
    setSearchValue("")
    setCheckedValues([])
    setDateFrom("")
    setDateTo("")
    setNumberMin("")
    setNumberMax("")
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
