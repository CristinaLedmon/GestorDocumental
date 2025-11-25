"use client"

import { useState, useEffect } from "react"
import { ChartTooltip } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import fetchModel from "@/lib/fetch-utils"
import React from "react"

interface GraphicGenericProps {
  endpoint: string
  endpointParams?: string | [string, any][]
  chartType: 1 | 2 | 3 // 1: Area Chart - Interactive, 2: Bar Chart - Interactive, 3: Line Chart - Interactive
  valueX: string // e.g., "date" or "data.weather.date"
  valueY: string // e.g., "temperature" or "data.weather.salinity"
  title?: string
  description?: string
  className?: string
  removeOutliers?: boolean
  removeOutliersValue?: number // Multiplier for IQR (default: 3.5)
  removeOutliersSee?: boolean // Show/hide outliers removed badge (default: true)
  removeNegatives?: boolean // Remove negative values (default: true)
  removeNegativesSee?: boolean // Show/hide negatives removed badge (default: true)
}

interface SeriesData {
  seriesKey: string
  seriesLabel: string
  data: any[]
  color: string
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

const parseEndpointParams = (params: string | [string, any][]): [string, any][] => {
  if (!params) return []

  if (typeof params === "string") {
    try {
      // Parse string format: "[column, salinity],[year, 2016],[depth_ini, 0]"
      const cleanString = params.replace(/\s/g, "") // Remove spaces
      const pairs = cleanString.split("],[")

      return pairs.map((pair) => {
        const cleanPair = pair.replace(/^\[|\]$/g, "") // Remove brackets
        const [key, value] = cleanPair.split(",")

        // Try to parse value as number, otherwise keep as string
        const parsedValue = isNaN(Number(value)) ? value : Number(value)
        return [key, parsedValue]
      })
    } catch (error) {
      console.error("[GraphicGeneric] Error parsing endpointParams string:", error)
      return []
    }
  }

  // Handle array format with multiple values per parameter
  return params.map((param) => {
    if (Array.isArray(param) && param.length > 2) {
      // Multiple values: ["depth_ini", 0, 4, 8] -> ["depth_ini", [0, 4, 8]]
      const [key, ...values] = param
      return [key, values]
    } else if (Array.isArray(param) && param.length === 2) {
      // Single value: ["column", "oxygen"] -> ["column", "oxygen"]
      return param
    } else {
      // Fallback for malformed params
      console.warn("[GraphicGeneric] Malformed parameter:", param)
      return param
    }
  })
}

const buildQueryParams = (params: [string, any][]): string => {
  if (!params || params.length === 0) return ""

  const queryString = params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")

  return `?${queryString}`
}

const formatDateToMonth = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString // Return original if not a valid date

    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    return months[date.getMonth()]
  } catch {
    return dateString // Return original if parsing fails
  }
}

const formatDateForTooltip = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString // Return original if not a valid date

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  } catch {
    return dateString // Return original if parsing fails
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isDateData = typeof label === "string" && /^\d{4}-\d{2}-\d{2}/.test(label)
    const formattedLabel = isDateData ? formatDateForTooltip(label) : label

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Fecha</span>
            <span className="font-bold text-muted-foreground">{formattedLabel}</span>
          </div>
          {payload.map((entry: any) => {
            const seriesData = entry.payload?.seriesData || {}
            const seriesLabel = seriesData[entry.dataKey]?.label || entry.dataKey

            return (
              <div key={entry.dataKey} className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">{seriesLabel}</span>
                <span className="font-bold" style={{ color: entry.color }}>
                  {entry.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}

const removeOutliersFromData = (data: any[], multiplier = 3.5): { cleanData: any[]; removedCount: number } => {
  if (data.length < 4) return { cleanData: data, removedCount: 0 } // Need at least 4 points for IQR

  // Extract Y values for statistical analysis
  const yValues = data.map((item) => item.y).filter((val) => typeof val === "number" && !isNaN(val))

  if (yValues.length === 0) return { cleanData: data, removedCount: 0 }

  // Sort values to calculate quartiles
  const sortedValues = [...yValues].sort((a, b) => a - b)
  const n = sortedValues.length

  // Calculate Q1, Q3, and IQR
  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const q1 = sortedValues[q1Index]
  const q3 = sortedValues[q3Index]
  const iqr = q3 - q1

  const lowerBound = q1 - multiplier * iqr
  const upperBound = q3 + multiplier * iqr

  console.log(
    `[v0] Outlier detection: Q1=${q1.toFixed(2)}, Q3=${q3.toFixed(2)}, IQR=${iqr.toFixed(2)}, multiplier=${multiplier}`,
  )
  console.log(`[v0] Outlier bounds: ${lowerBound.toFixed(2)} to ${upperBound.toFixed(2)}`)

  // Filter out outliers
  const cleanData = data.filter((item) => {
    const yVal = item.y
    if (typeof yVal !== "number" || isNaN(yVal)) return false

    const isOutlier = yVal < lowerBound || yVal > upperBound
    if (isOutlier) {
      console.log(`[v0] Removing outlier: ${yVal} (outside bounds ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`)
    }
    return !isOutlier
  })

  const removedCount = data.length - cleanData.length
  console.log(`[v0] Outlier detection complete: removed ${removedCount} outliers from ${data.length} points`)

  return { cleanData, removedCount }
}

const removeNegativeValues = (data: any[]): { cleanData: any[]; removedCount: number } => {
  console.log(`[v0] Starting negative value removal from ${data.length} points`)

  const cleanData = data.filter((item) => {
    const yVal = item.y
    if (typeof yVal !== "number" || isNaN(yVal)) {
      console.log(`[v0] Removing invalid value: ${yVal} (not a number)`)
      return false
    }

    const isNegative = yVal < 0
    if (isNegative) {
      console.log(`[v0] Removing negative value: ${yVal} at x=${item.x}`)
    }
    return !isNegative
  })

  const removedCount = data.length - cleanData.length
  console.log(
    `[v0] Negative value removal complete: removed ${removedCount} negative values from ${data.length} points`,
  )
  console.log(`[v0] Remaining data points: ${cleanData.length}`)

  return { cleanData, removedCount }
}

const averageDataByDate = (data: any[]): { cleanData: any[]; duplicatesProcessed: number } => {
  if (data.length === 0) return { cleanData: data, duplicatesProcessed: 0 }

  console.log(`[v0] Starting date averaging from ${data.length} points`)

  // Group data by exact date/x value
  const dateGroups = new Map<string, any[]>()

  data.forEach((item) => {
    const dateKey = String(item.x) // Convert to string to handle both dates and other x values

    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, [])
    }
    dateGroups.get(dateKey)!.push(item)
  })

  console.log(`[v0] Found ${dateGroups.size} unique dates from ${data.length} total points`)

  // Calculate averages for each date group
  const averagedData: any[] = []
  let duplicatesProcessed = 0

  dateGroups.forEach((group, dateKey) => {
    if (group.length === 1) {
      // Single value, use as is
      averagedData.push(group[0])
    } else {
      // Multiple values, calculate average excluding negatives and outliers
      duplicatesProcessed += group.length - 1 // Count how many duplicates we're processing

      const nonNegativeValues = group
        .map((item) => item.y)
        .filter((val) => typeof val === "number" && !isNaN(val) && val >= 0)

      if (nonNegativeValues.length === 0) {
        console.log(`[v0] No valid non-negative Y values for date ${dateKey}, skipping`)
        return
      }

      let validYValues = nonNegativeValues
      if (nonNegativeValues.length >= 4) {
        // Only apply outlier detection if we have enough data points
        const sortedValues = [...nonNegativeValues].sort((a, b) => a - b)
        const n = sortedValues.length

        // Calculate Q1, Q3, and IQR
        const q1Index = Math.floor(n * 0.25)
        const q3Index = Math.floor(n * 0.75)
        const q1 = sortedValues[q1Index]
        const q3 = sortedValues[q3Index]
        const iqr = q3 - q1

        // Use a more conservative multiplier for date averaging (1.5 instead of 3.5)
        const multiplier = 1.5
        const lowerBound = q1 - multiplier * iqr
        const upperBound = q3 + multiplier * iqr

        // Filter out outliers
        const beforeOutlierFilter = nonNegativeValues.length
        validYValues = nonNegativeValues.filter((val) => val >= lowerBound && val <= upperBound)

        if (validYValues.length < beforeOutlierFilter) {
          console.log(
            `[v0] Date ${dateKey}: Removed ${beforeOutlierFilter - validYValues.length} outliers from ${beforeOutlierFilter} values (bounds: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
          )
        }
      }

      if (validYValues.length === 0) {
        console.log(`[v0] No valid Y values after filtering for date ${dateKey}, skipping`)
        return
      }

      const averageY = Number.parseFloat(
        (validYValues.reduce((sum, val) => sum + val, 0) / validYValues.length).toFixed(2),
      )

      console.log(
        `[v0] Date ${dateKey}: ${group.length} total values → ${nonNegativeValues.length} non-negative → ${validYValues.length} after outlier filter → average: ${averageY.toFixed(2)}`,
      )

      // Create averaged data point using the first item as template
      const averagedItem = {
        ...group[0], // Use first item as template
        y: averageY,
        originalItem: {
          ...group[0].originalItem,
          // Update the Y value in originalItem for tooltip display
          [Object.keys(group[0].originalItem).find((key) => group[0].originalItem[key] === group[0].y) || "value"]:
            averageY,
        },
        averaged: true, // Mark as averaged for debugging
        originalCount: group.length, // Store how many values were averaged
        validCount: validYValues.length, // Store how many values were actually used in average
      }

      averagedData.push(averagedItem)
    }
  })

  // Sort by x value (important for time series data)
  averagedData.sort((a, b) => {
    // Handle date sorting
    if (typeof a.x === "string" && typeof b.x === "string" && /^\d{4}-\d{2}-\d{2}/.test(a.x)) {
      return new Date(a.x).getTime() - new Date(b.x).getTime()
    }
    // Handle numeric sorting
    if (typeof a.x === "number" && typeof b.x === "number") {
      return a.x - b.x
    }
    // Fallback to string comparison
    return String(a.x).localeCompare(String(b.x))
  })

  console.log(
    `[v0] Date averaging complete: ${data.length} → ${averagedData.length} points, processed ${duplicatesProcessed} duplicates`,
  )

  return { cleanData: averagedData, duplicatesProcessed }
}

const normalizeDataByMonth = (data: any[]): any[] => {
  console.log(
    "%c ÉXITO: entra en el normalize data",
    "color: white; background-color: green; padding: 2px 6px; border-radius: 3px;",
  )

  if (data.length === 0) return data

  // Filtrar datos válidos
  const validData = data.filter((item, index) => {
    console.log(`Revisando item[${index}]:`, item)

    if (!item) {
      console.log("Rechazado: item no existe (null/undefined)")
      return false
    }

    if (typeof item !== "object") {
      console.log("Rechazado: item no es un objeto")
      return false
    }

    if (item.x === undefined) {
      console.log("Rechazado: item.x está undefined")
      return false
    }

    if (item.y === undefined) {
      console.log("Rechazado: item.y está undefined")
      return false
    }

    console.log("Aceptado:", item)
    return true
  })

  if (validData.length === 0) {
    console.warn("[v0] No valid data items found for normalization")
    return []
  }

  // Comprobar si son fechas
  const isDateData = typeof validData[0].x === "string" && /^\d{4}-\d{2}-\d{2}/.test(validData[0].x)

  if (!isDateData) return validData // Si no son fechas → devolver tal cual

  // Agrupar por mes
  const monthGroups = new Map()
  validData.forEach((item) => {
    if (!item || !item.x) {
      console.warn("[v0] Skipping invalid item:", item)
      return
    }

    try {
      const date = new Date(item.x)
      if (isNaN(date.getTime())) {
        console.warn("[v0] Invalid date found:", item.x)
        return
      }

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, [])
      }
      monthGroups.get(monthKey)!.push(item)
    } catch (error) {
      console.warn("[v0] Error processing item:", item, error)
    }
  })

  // Determinar puntos objetivo por mes
  const monthSizes = Array.from(monthGroups.values()).map((group) => group.length)
  monthSizes.sort((a, b) => a - b)
  const targetPointsPerMonth = monthSizes[Math.floor(monthSizes.length / 2)] || 10

  console.log(`[v0] Normalizing data: ${monthGroups.size} months, target ${targetPointsPerMonth} points per month`)

  // Normalizar
  const normalizedData: any[] = []

  monthGroups.forEach((monthData, monthKey) => {
    const sortedMonthData = monthData.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime())

    if (sortedMonthData.length === targetPointsPerMonth) {
      normalizedData.push(...sortedMonthData)
    } else if (sortedMonthData.length > targetPointsPerMonth) {
      const step = sortedMonthData.length / targetPointsPerMonth
      for (let i = 0; i < targetPointsPerMonth; i++) {
        const index = Math.floor(i * step)
        normalizedData.push(sortedMonthData[index])
      }
    } else {
      // Interpolación
      const interpolatedData = [...sortedMonthData]
      let safetyCounter = 0

      while (interpolatedData.length < targetPointsPerMonth && safetyCounter < 1000) {
        safetyCounter++

        let maxGapIndex = 0
        let maxGapSize = 0

        for (let i = 0; i < interpolatedData.length - 1; i++) {
          const date1 = new Date(interpolatedData[i].x).getTime()
          const date2 = new Date(interpolatedData[i + 1].x).getTime()
          const gap = date2 - date1

          if (gap > maxGapSize) {
            maxGapSize = gap
            maxGapIndex = i
          }
        }

        if (maxGapSize === 0) {
          console.warn("[v0] No se encontraron huecos para interpolar, rompiendo bucle.")
          break
        }

        const point1 = interpolatedData[maxGapIndex]
        const point2 = interpolatedData[maxGapIndex + 1]

        const date1 = new Date(point1.x).getTime()
        const date2 = new Date(point2.x).getTime()
        let midDate = new Date((date1 + date2) / 2)

        // Asegurar que no se repita la misma fecha
        if (midDate.getTime() === date1 || midDate.getTime() === date2) {
          midDate = new Date(midDate.getTime() + 1)
        }

        const interpolatedY = (point1.y + point2.y) / 2

        const newPoint = {
          index: point1.index + 0.5,
          x: midDate.toISOString().split("T")[0],
          y: interpolatedY,
          originalItem: {
            date: midDate.toISOString().split("T")[0],
            value: interpolatedY,
          },
          interpolated: true,
        }

        interpolatedData.splice(maxGapIndex + 1, 0, newPoint)
      }

      if (safetyCounter >= 1000) {
        console.warn("[v0] Safety break: posible bucle infinito en interpolación.")
      }

      normalizedData.push(...interpolatedData)
    }
  })

  // Ordenar por fecha
  normalizedData.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime())

  console.log(
    `[v0] Normalized data: ${normalizedData.length} total points, ${
      normalizedData.filter((d) => d.interpolated).length
    } interpolated`,
  )

  return normalizedData
}

const calculateYAxisDomain = (data: any[]): [number, number] => {
  if (data.length === 0) return [0, 100]

  const yValues = data.map((item) => item.y).filter((val) => typeof val === "number" && !isNaN(val))

  if (yValues.length === 0) return [0, 100]

  const minValue = Math.min(...yValues)
  const maxValue = Math.max(...yValues)
  const range = maxValue - minValue

  // Add 10% padding on each side, with minimum padding of 2 units
  const padding = Math.max(range * 0.1, 2)

  const domainMin = Math.max(0, minValue - padding)
  const domainMax = maxValue + padding

  console.log(
    `[v0] Y-axis domain: data range ${minValue.toFixed(2)} to ${maxValue.toFixed(2)}, display range ${domainMin.toFixed(2)} to ${domainMax.toFixed(2)}`,
  )

  return [domainMin, domainMax]
}

const generateParameterCombinations = (params: [string, any][]): [string, any][][] => {
  // Find parameters with multiple values (arrays)
  const multiValueParams: { [key: string]: any[] } = {}
  const singleValueParams: [string, any][] = []

  params.forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 1) {
      multiValueParams[key] = value
    } else {
      // Handle single values or single-element arrays
      const finalValue = Array.isArray(value) ? value[0] : value
      singleValueParams.push([key, finalValue])
    }
  })

  // If no multi-value parameters, return single combination
  if (Object.keys(multiValueParams).length === 0) {
    return [singleValueParams]
  }

  // Check for parallel parameters (depth_ini/depth_end, date-ini/date-end)
  const parallelGroups: { [key: string]: string[] } = {
    depth: ["depth_ini", "depth_end"],
    date: ["date-ini", "date-end"],
  }

  const combinations: [string, any][][] = []

  // Handle parallel parameters first
  const handledParams = new Set<string>()

  for (const [groupName, groupKeys] of Object.entries(parallelGroups)) {
    const groupParams = groupKeys.filter((key) => multiValueParams[key])

    if (groupParams.length > 0) {
      // Get the first parameter to determine array length
      const firstParam = groupParams[0]
      const arrayLength = multiValueParams[firstParam].length

      // Create combinations for each index in the parallel arrays
      for (let i = 0; i < arrayLength; i++) {
        const combo: [string, any][] = [...singleValueParams]

        // Add parallel parameters at the same index
        groupParams.forEach((paramKey) => {
          if (multiValueParams[paramKey] && i < multiValueParams[paramKey].length) {
            combo.push([paramKey, multiValueParams[paramKey][i]])
            handledParams.add(paramKey)
          }
        })

        // Add any remaining non-parallel multi-value parameters (first value only for now)
        Object.keys(multiValueParams).forEach((key) => {
          if (!handledParams.has(key)) {
            combo.push([key, multiValueParams[key][0]])
          }
        })

        combinations.push(combo)
      }
    }
  }

  // If we handled parallel parameters, return those combinations
  if (combinations.length > 0) {
    console.log(`[v0] Generated ${combinations.length} parallel parameter combinations`)
    return combinations
  }

  // Fallback to original cross-product logic for non-parallel parameters
  const multiKeys = Object.keys(multiValueParams)

  const generateCombos = (keyIndex: number, currentCombo: [string, any][]) => {
    if (keyIndex >= multiKeys.length) {
      combinations.push([...singleValueParams, ...currentCombo])
      return
    }

    const key = multiKeys[keyIndex]
    const values = multiValueParams[key]

    values.forEach((value) => {
      generateCombos(keyIndex + 1, [...currentCombo, [key, value]])
    })
  }

  generateCombos(0, [])
  return combinations
}

const createSeriesLabel = (params: [string, any][]): string => {
  const depthIni = params.find(([key]) => key === "depth_ini")?.[1]
  const depthEnd = params.find(([key]) => key === "depth_end")?.[1]

  if (depthIni !== undefined && depthEnd !== undefined) {
    return `Profundidad ${depthIni}-${depthEnd}m`
  }

  // Fallback to original logic for other parameter combinations
  const relevantParams = params.filter(([key]) => !["column", "year"].includes(key))
  if (relevantParams.length === 0) return "Serie Principal"

  return relevantParams.map(([key, value]) => `${key}: ${value}`).join(", ")
}

const SERIES_COLORS = [
  "hsla(197, 61%, 78%, 1.00)", // Blue
  "hsla(202, 88%, 53%, 1.00)", // Green
  "hsla(212, 77%, 26%, 1.00)", // Red
  //   "hsl(262, 83%, 58%)", // Purple
  //   "hsl(38, 92%, 50%)", // Orange
  //   "hsl(199, 89%, 48%)", // Cyan
  //   "hsl(48, 96%, 53%)", // Yellow
  //   "hsl(328, 86%, 57%)", // Pink
  //   "hsl(24, 70%, 50%)", // Brown
  //   "hsl(173, 58%, 39%)", // Teal
]

export default function GraphicGeneric({
  endpoint,
  endpointParams = [],
  chartType,
  valueX,
  valueY,
  title = "Gráfica",
  description = "Datos visualizados",
  className,
  removeOutliers = false,
  removeOutliersValue = 3.5,
  removeOutliersSee = true,
  removeNegatives = true,
  removeNegativesSee = true,
}: GraphicGenericProps) {
  const [seriesData, setSeriesData] = useState<SeriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [outliersRemoved, setOutliersRemoved] = useState(0)
  const [negativesRemoved, setNegativesRemoved] = useState(0)
  const [duplicatesProcessed, setDuplicatesProcessed] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setOutliersRemoved(0)
        setNegativesRemoved(0)
        setDuplicatesProcessed(0)

        console.log(`[v0] Original endpoint:`, endpoint)
        console.log(`[v0] Original endpointParams:`, endpointParams)

        const parsedParams = parseEndpointParams(endpointParams)
        console.log(`[v0] Parsed params:`, parsedParams)

        const paramCombinations = generateParameterCombinations(parsedParams)
        console.log(`[v0] Generated ${paramCombinations.length} parameter combinations:`, paramCombinations)

        const hasDateRanges = paramCombinations.some((combo) =>
          combo.some(([key]) => key === "date-ini" || key === "date-end"),
        )

        const processedCombinations = paramCombinations.map((combo) => {
          if (hasDateRanges) {
            return combo.filter(([key]) => key !== "year")
          }
          return combo
        })

        const allSeriesData: SeriesData[] = []
        let totalOutliers = 0
        let totalNegatives = 0
        let totalDuplicates = 0

        for (let i = 0; i < processedCombinations.length; i++) {
          const combo = processedCombinations[i]
          const queryParams = buildQueryParams(combo)
          const fullEndpoint = `${endpoint}${queryParams}`
          const seriesLabel = createSeriesLabel(combo)
          const seriesColor = SERIES_COLORS[i % SERIES_COLORS.length]

          console.log(`[v0] Fetching series ${i + 1}/${processedCombinations.length}: ${seriesLabel}`)
          console.log(`[v0] Endpoint: ${fullEndpoint}`)

          try {
            const response = await fetchModel(fullEndpoint)
            if (!response || typeof response !== "object") {
              console.error(`[v0] Invalid response format for series ${i + 1}:`, response)
              continue
            }

            const rawData = response.data || []

            if (!Array.isArray(rawData)) {
              console.error(`[v0] Expected array but got:`, typeof rawData, rawData)
              continue
            }

            let transformedData = rawData
              .map((item: any, index: number) => {
                if (!item || typeof item !== "object") {
                  console.warn(`[v0] Skipping invalid item at index ${index}:`, item)
                  return null
                }

                const xValue = valueX.includes(".") ? getNestedValue(item, valueX) : item[valueX]
                const yValue = valueY.includes(".") ? getNestedValue(item, valueY) : item[valueY]

                return {
                  index,
                  x: xValue,
                  y: yValue,
                  originalItem: item,
                  seriesKey: `series_${i}`,
                }
              })
              .filter((item) => item !== null && item.x !== undefined && item.y !== undefined)

            if (transformedData.length > 0) {
              const { cleanData, duplicatesProcessed: dupCount } = averageDataByDate(transformedData)
              transformedData = cleanData
              totalDuplicates += dupCount

              if (removeNegatives) {
                const { cleanData, removedCount } = removeNegativeValues(transformedData)
                transformedData = cleanData
                totalNegatives += removedCount
              }

              if (removeOutliers) {
                const { cleanData, removedCount } = removeOutliersFromData(transformedData, removeOutliersValue)
                transformedData = cleanData
                totalOutliers += removedCount
              }

              console.warn("DATOS FINALES TRANSFORMADOS:\n" + JSON.stringify(transformedData, null, 2))

              const normalizedData = normalizeDataByMonth(transformedData)

              console.warn("DATOS FINALES NORMALIZADOS:\n" + JSON.stringify(normalizedData, null, 2))

              allSeriesData.push({
                seriesKey: `series_${i}`,
                seriesLabel,
                data: normalizedData,
                color: seriesColor,
              })
            } else {
              console.warn(`[v0] No valid data found for series ${i + 1}`)
            }
          } catch (seriesError) {
            console.error(`[v0] Error fetching series ${i + 1}:`, seriesError)
          }
        }

        setOutliersRemoved(totalOutliers)
        setNegativesRemoved(totalNegatives)
        setDuplicatesProcessed(totalDuplicates)
        setSeriesData(allSeriesData)

        console.log(`[v0] Successfully loaded ${allSeriesData.length} series`)
      } catch (error) {
        console.error("[v0] Error in fetchData:", error)
        setError(error instanceof Error ? error.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [endpoint, endpointParams, valueX, valueY, removeOutliers, removeOutliersValue, removeNegatives])

  const chartConfig = seriesData.reduce((config, series) => {
    config[series.seriesKey] = {
      label: series.seriesLabel,
      color: series.color,
    }
    return config
  }, {} as any)

  const combinedData = React.useMemo(() => {
    if (seriesData.length === 0) return []

    const allXValues = new Set<string>()
    seriesData.forEach((series) => {
      series.data.forEach((point) => {
        allXValues.add(String(point.x))
      })
    })

    const combined = Array.from(allXValues).map((xValue) => {
      const dataPoint: any = {
        x: xValue,
        seriesData: chartConfig,
      }

      seriesData.forEach((series) => {
        const point = series.data.find((p) => String(p.x) === xValue)
        dataPoint[series.seriesKey] = point ? point.y : null
      })

      return dataPoint
    })

    return combined.sort((a, b) => {
      if (typeof a.x === "string" && /^\d{4}-\d{2}-\d{2}/.test(a.x)) {
        return new Date(a.x).getTime() - new Date(b.x).getTime()
      }
      return String(a.x).localeCompare(String(b.x))
    })
  }, [seriesData, chartConfig])

  const renderChart = () => {
    if (seriesData.length === 0) return null

    const commonProps = {
      data: combinedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    }

    const getUniqueTicks = () => {
      if (combinedData.length === 0) return []
      const isDateData = typeof combinedData[0].x === "string" && /^\d{4}-\d{2}-\d{2}/.test(combinedData[0].x)

      if (!isDateData) return combinedData.map((item) => item.x)

      const monthsMap = new Map()
      combinedData.forEach((item) => {
        const monthName = formatDateToMonth(item.x)
        if (!monthsMap.has(monthName)) {
          monthsMap.set(monthName, item.x)
        }
      })

      return Array.from(monthsMap.values())
    }

    const uniqueTicks = getUniqueTicks()

    const allYValues: number[] = []
    seriesData.forEach((series) => {
      series.data.forEach((point) => {
        if (typeof point.y === "number" && !isNaN(point.y)) {
          allYValues.push(point.y)
        }
      })
    })

    const yAxisDomain =
      allYValues.length > 0
        ? (() => {
            const minValue = Math.min(...allYValues)
            const maxValue = Math.max(...allYValues)
            const range = maxValue - minValue
            const padding = Math.max(range * 0.1, 2)
            return [Math.max(0, minValue - padding), maxValue + padding]
          })()
        : [0, 100]

    switch (chartType) {
      case 1: // Area Chart - Multiple series
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <defs>
                {seriesData.map((series, index) => (
                  <linearGradient key={series.seriesKey} id={`fill${series.seriesKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={series.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={series.color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 12 }}
                ticks={uniqueTicks}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                    return formatDateToMonth(value)
                  }
                  return String(value).slice(0, 10)
                }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" domain={yAxisDomain} />
              <Brush height={10} stroke="#0F3A6C" />
              <ChartTooltip content={<CustomTooltip />} cursor={false} />
              {seriesData.map((series) => (
                <Area
                  key={series.seriesKey}
                  type="natural"
                  dataKey={series.seriesKey}
                  stroke={series.color}
                  fill={`url(#fill${series.seriesKey})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true} // Changed from false to true to connect lines even when data is missing
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case 2: // Bar Chart - Multiple series
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 12 }}
                ticks={uniqueTicks}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                    return formatDateToMonth(value)
                  }
                  return String(value).slice(0, 10)
                }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" domain={yAxisDomain} />
              <ChartTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
              {seriesData.map((series) => (
                <Bar
                  key={series.seriesKey}
                  dataKey={series.seriesKey}
                  fill={series.color}
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 3: // Line Chart - Multiple series
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 12 }}
                ticks={uniqueTicks}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                    return formatDateToMonth(value)
                  }
                  return String(value).slice(0, 10)
                }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" domain={yAxisDomain} />
              <ChartTooltip content={<CustomTooltip />} cursor={false} />
              {seriesData.map((series) => (
                <Line
                  key={series.seriesKey}
                  type="natural"
                  dataKey={series.seriesKey}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: series.color }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: series.color }}
                  className="drop-shadow-sm"
                  connectNulls={true} // Changed from false to true to connect lines even when data is missing
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center text-muted-foreground">Tipo de gráfica no válido</div>
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Cargando datos...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (seriesData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">No hay datos disponibles</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
            aria-label={isCollapsed ? "Expandir gráfica" : "Colapsar gráfica"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2 mt-2">
              {duplicatesProcessed > 0 && (
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80">
                  {duplicatesProcessed} valores duplicados promediados
                </div>
              )}
              {removeNegatives && removeNegativesSee && negativesRemoved > 0 && (
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-red-100 text-red-800 hover:bg-red-100/80">
                  {negativesRemoved} valores negativos eliminados
                </div>
              )}
              {removeOutliers && removeOutliersSee && outliersRemoved > 0 && (
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-orange-100 text-orange-800 hover:bg-orange-100/80">
                  {outliersRemoved} valores atípicos eliminados
                </div>
              )}
            </div>
            {seriesData.length > 1 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {seriesData.map((series) => (
                  <div key={series.seriesKey} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: series.color }} />
                    <span className="text-sm text-muted-foreground">{series.seriesLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <div className="h-[400px]">{renderChart()}</div>
        </CardContent>
      )}
    </Card>
  )
}
