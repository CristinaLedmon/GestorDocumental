"use client"

import { useEffect } from "react"

import { useState } from "react"

// Función para detectar el rango de color del primary y generar colores análogos
export function getAnalogousColors() {
  // Obtener el valor computado del color primary
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()

  // Convertir HSL a valores numéricos para determinar el rango de color
  const hslMatch = primaryColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)

  if (!hslMatch) {
    // Fallback si no podemos detectar el color
    return getDefaultAnalogousColors()
  }

  const hue = Number.parseInt(hslMatch[1])
  const saturation = Number.parseInt(hslMatch[2])
  const lightness = Number.parseInt(hslMatch[3])

  return generateAnalogousColorClasses(hue, saturation, lightness)
}

function generateAnalogousColorClasses(hue: number, saturation: number, lightness: number) {
  // Generar colores análogos basados en el matiz
  const colors = []

  // Color base (primary)
  colors.push({
    light: "bg-primary/10 text-primary border-primary/20",
    dark: "dark:bg-primary/10 dark:text-primary dark:border-primary/20",
  })

  // Análogo 1: -30 grados
  const analogous1Hue = (hue - 30 + 360) % 360
  colors.push({
    light: `bg-[hsl(${analogous1Hue}_${saturation}%_95%)] text-[hsl(${analogous1Hue}_${saturation}%_35%)] border-[hsl(${analogous1Hue}_${saturation}%_85%)]`,
    dark: `dark:bg-[hsl(${analogous1Hue}_${saturation}%_10%)] dark:text-[hsl(${analogous1Hue}_${saturation}%_70%)] dark:border-[hsl(${analogous1Hue}_${saturation}%_20%)]`,
  })

  // Análogo 2: +30 grados
  const analogous2Hue = (hue + 30) % 360
  colors.push({
    light: `bg-[hsl(${analogous2Hue}_${saturation}%_95%)] text-[hsl(${analogous2Hue}_${saturation}%_35%)] border-[hsl(${analogous2Hue}_${saturation}%_85%)]`,
    dark: `dark:bg-[hsl(${analogous2Hue}_${saturation}%_10%)] dark:text-[hsl(${analogous2Hue}_${saturation}%_70%)] dark:border-[hsl(${analogous2Hue}_${saturation}%_20%)]`,
  })

  // Análogo 3: -60 grados
  const analogous3Hue = (hue - 60 + 360) % 360
  colors.push({
    light: `bg-[hsl(${analogous3Hue}_${saturation}%_95%)] text-[hsl(${analogous3Hue}_${saturation}%_35%)] border-[hsl(${analogous3Hue}_${saturation}%_85%)]`,
    dark: `dark:bg-[hsl(${analogous3Hue}_${saturation}%_10%)] dark:text-[hsl(${analogous3Hue}_${saturation}%_70%)] dark:border-[hsl(${analogous3Hue}_${saturation}%_20%)]`,
  })

  // Análogo 4: +60 grados
  const analogous4Hue = (hue + 60) % 360
  colors.push({
    light: `bg-[hsl(${analogous4Hue}_${saturation}%_95%)] text-[hsl(${analogous4Hue}_${saturation}%_35%)] border-[hsl(${analogous4Hue}_${saturation}%_85%)]`,
    dark: `dark:bg-[hsl(${analogous4Hue}_${saturation}%_10%)] dark:text-[hsl(${analogous4Hue}_${saturation}%_70%)] dark:border-[hsl(${analogous4Hue}_${saturation}%_20%)]`,
  })

  return colors
}

function getDefaultAnalogousColors() {
  // Colores por defecto si no podemos detectar el primary
  return [
    {
      light: "bg-primary/10 text-primary border-primary/20",
      dark: "dark:bg-primary/10 dark:text-primary dark:border-primary/20",
    },
    {
      light: "bg-orange-50 text-orange-700 border-orange-200",
      dark: "dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    },
    {
      light: "bg-amber-50 text-amber-700 border-amber-200",
      dark: "dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    },
    {
      light: "bg-red-50 text-red-700 border-red-200",
      dark: "dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    },
    {
      light: "bg-yellow-50 text-yellow-700 border-yellow-200",
      dark: "dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800",
    },
  ]
}

export function getColorForSection(title: string) {
  const analogousColors = getAnalogousColors()

  const sectionColorMap: { [key: string]: number } = {
    General: 0,
    Administración: 1,
    Socios: 2,
    Facturación: 3,
    Tienda: 4,
    Pista: 0, // Reutilizar colores si hay más secciones
    Puerta: 1,
  }

  const colorIndex = sectionColorMap[title] || 0
  const selectedColor = analogousColors[colorIndex] || analogousColors[0]

  return `${selectedColor.light} ${selectedColor.dark}`
}

// Hook para usar en componentes React
export function useAnalogousColors() {
  const [colors, setColors] = useState<any[]>([])

  useEffect(() => {
    // Esperar a que el DOM esté listo
    const updateColors = () => {
      setColors(getAnalogousColors())
    }

    updateColors()

    // Actualizar si cambia el tema
    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    return () => observer.disconnect()
  }, [])

  return colors
}
