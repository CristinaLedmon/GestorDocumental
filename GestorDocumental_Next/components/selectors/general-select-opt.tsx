"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import fetchModel from "@/lib/fetch-utils"

interface GenericSelectProps<T> {
  endpoint: string
  per_page?: number
  labelKey: (keyof T)[] | keyof T
  valueKey: keyof T
  onChange?: (selectedData: { id: string; extraData?: Record<string, any> }) => void
  name?: string
  value?: string
  placeholder?: string
  extraDataKeys?: (keyof T)[]
  defaultValue?: string | number
  readonly?: boolean
  required?: boolean
  lazyLoad?: boolean // Nueva prop para controlar si se cargan los datos automáticamente o solo al interactuar
}

export function GenericSelectOpt<T extends Record<string, any>>({
  endpoint,
  per_page = 20,
  labelKey,
  valueKey,
  onChange,
  name = "selected_value",
  placeholder = "Seleccionar opción",
  extraDataKeys = [],
  defaultValue = "",
  readonly = false,
  required = false,
  lazyLoad = false, // Por defecto, carga los datos al montar el componente
}: GenericSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | number>(defaultValue)
  const [selectedItem, setSelectedItem] = React.useState<T | null>(null)
  const [items, setItems] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [defaultLoaded, setDefaultLoaded] = React.useState(false)
  const [dataLoaded, setDataLoaded] = React.useState(false) // Nuevo estado para controlar si ya se han cargado datos
  const listRef = React.useRef<HTMLDivElement>(null)
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)

  // Función para obtener datos de la API
  const fetchData = React.useCallback(async <R,>(url: string): Promise<R> => {
    return fetchModel<R>(url)
  }, [])

  const fetchSelectedItem = React.useCallback(
    async (selectedId: string) => {
      if (!selectedId) return

      setLoading(true)
      try {
        const cleanedEndpoint = endpoint.replace(/\/filter$/, "")
        const response = await fetchData<{ data: T }>(`${cleanedEndpoint}/${selectedId}`)
        const item = response.data

        setSelectedItem(item)
        setValue(item[valueKey]?.toString() || "")
        setDefaultLoaded(true)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el elemento seleccionado",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [endpoint, valueKey, fetchData],
  )

  const fetchItems = React.useCallback(
    async (reset = false, query = searchQuery) => {
      if (lazyLoad && !open && !defaultValue && dataLoaded) return

      setLoading(true)
      try {
        // Eliminamos el parámetro de paginación y aumentamos el per_page para cargar todos los elementos
        const params = new URLSearchParams({
          per_page: "1000", // Un número grande para asegurar que se carguen todos los elementos
          ...(query && { q: query }),
        })

        const response = await fetchData<{ data: T[]; total: number }>(`${endpoint}?${params.toString()}`)
        setItems(response.data)
        setHasMore(false) // Ya no hay más elementos para cargar
        setDataLoaded(true)

        if (!defaultLoaded && defaultValue) {
          const defaultItem = response.data.find((item) => item[valueKey].toString() === defaultValue)
          if (defaultItem) {
            setSelectedItem(defaultItem)
            setValue(defaultValue)
          }
          setDefaultLoaded(true)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al cargar los datos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [endpoint, searchQuery, defaultValue, valueKey, defaultLoaded, lazyLoad, open, dataLoaded, fetchData],
  )

  React.useEffect(() => {
    if (defaultValue && !defaultLoaded) {
      fetchSelectedItem(String(defaultValue))
    }

    // Solo carga los datos iniciales si no está en modo lazyLoad o si tiene un defaultValue
    if (!lazyLoad || defaultValue) {
      fetchItems(true)
    }
  }, [defaultValue, fetchSelectedItem, fetchItems, defaultLoaded, lazyLoad])

  // Efecto para cargar datos cuando se abre el popover en modo lazyLoad
  React.useEffect(() => {
    if (lazyLoad && open && !dataLoaded) {
      fetchItems(true)
    }
  }, [lazyLoad, open, dataLoaded, fetchItems])

  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchQuery(value)
      if (searchTimeout.current) clearTimeout(searchTimeout.current)

      searchTimeout.current = setTimeout(() => {
        fetchItems(true, value)
      }, 300)
    },
    [fetchItems],
  )

  React.useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [])

  const handleScroll = () => {
    const list = listRef.current
    if (list && list.scrollTop + list.clientHeight >= list.scrollHeight - 20 && !loading && hasMore) {
      setPage((prev) => prev + 1)
      fetchItems()
    }
  }

  const getItemLabel = (item: T) => {
    if (Array.isArray(labelKey)) {
      const year = item[labelKey[0]] // Suponiendo que el primer valor es 'year'
      const name = item[labelKey[1]] // Y el segundo es 'name'
      return `[Año: 20${year}] ${name}` //PELIGRO
    }
    return item[labelKey]?.toString() || ""
  }

  return (
    <div className="relative">
      {readonly ? (
        <div className="w-full p-2 border rounded-md bg-muted/20">
          {selectedItem ? (
            <span className="flex-1 text-left">{getItemLabel(selectedItem)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <input type="hidden" name={name} value={value} />
        </div>
      ) : (
        <>
          <Popover
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen)
              // Si se abre el popover y está en modo lazyLoad y aún no se han cargado datos, cargarlos
              if (isOpen && lazyLoad && !dataLoaded) {
                fetchItems(true)
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn("w-full justify-between", required && !value ? "border-red-500" : "")}
                disabled={loading}
                type="button"
              >
                {selectedItem ? (
                  <span className="flex-1 text-left">{getItemLabel(selectedItem)}</span>
                ) : loading ? (
                  "Cargando..."
                ) : (
                  <span className="flex-1 text-left text-muted-foreground">
                    {placeholder}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" align="start">
              <Command>
                <CommandInput placeholder="Buscar..." value={searchQuery} onValueChange={handleSearch} />
                <CommandList ref={listRef} className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>{loading ? "Cargando..." : "No se encontraron resultados."}</CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => {
                      const itemValue = item[valueKey].toString()
                      const isSelected = value === itemValue
                      const extraData = extraDataKeys.reduce(
                        (acc, key) => {
                          acc[key as string] = item[key]
                          return acc
                        },
                        {} as Record<string, any>,
                      )

                      return (
                        <CommandItem
                          key={itemValue}
                          value={getItemLabel(item)}
                          onSelect={() => {
                            if (isSelected) {
                              setValue("")
                              setSelectedItem(null)
                              setDefaultLoaded(true)
                              onChange?.({ id: "", extraData: {} })
                            } else {
                              setValue(itemValue)
                              setSelectedItem(item)
                              setSearchQuery("")
                              setOpen(false)
                              onChange?.({ id: itemValue, extraData })
                            }
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                          {getItemLabel(item)}
                        </CommandItem>
                      )
                    })}
                    {loading && <div className="py-2 px-4 text-sm text-muted-foreground">Cargando...</div>}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <select
            name={name}
            required={required}
            value={value}
            onChange={() => {}} // Controlled component needs onChange
            className="sr-only" // Visually hidden but still participates in form validation
            aria-hidden="true"
            tabIndex={-1}
          >
            <option value="">{placeholder}</option>
            {selectedItem && <option value={value}>{getItemLabel(selectedItem)}</option>}
          </select>
        </>
      )}
    </div>
  )
}

// // Ejemplo de uso con lazy loading
// <GenericSelect
//   endpoint="/api/users"
//   labelKey="name"
//   valueKey="id"
//   lazyLoad={true}
//   required={true}
//   placeholder="Seleccionar usuario"
// />
