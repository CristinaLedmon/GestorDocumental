"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import fetchModel from "@/lib/fetch-utils"

interface GenericSelectProps<T> {
  endpoint: string
  endpoint_principal?: string
  ids?: string[] | string
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
  lazyLoad?: boolean
}

export function GenericSelect<T extends Record<string, any>>({
  endpoint,
  endpoint_principal,
  ids,
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
  lazyLoad = false,
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
  const [dataLoaded, setDataLoaded] = React.useState(false)
  const [totalItems, setTotalItems] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const loadingRef = React.useRef(false)
  const debugMode = true

  const debugLog = (message: string, data?: any) => {
    if (debugMode) console.log(`[GenericSelect] ${message}`, data || "")
  }

  // Convierte ids a array
  const getFilterIds = React.useCallback((): string[] => {
    if (!ids) return []
    if (typeof ids === "string") {
      try {
        return JSON.parse(ids.replace(/'/g, '"'))
      } catch {
        return ids.split(",").map((i) => i.trim())
      }
    }
    return ids
  }, [ids])


//ESTA FUNCION TIENE VARIOS PARCHES
const fetchSelectedItem = React.useCallback(
  async (selectedId: string) => {
    if (!selectedId) return
    setLoading(true)
    loadingRef.current = true
    debugLog("Cargando elemento seleccionado:", selectedId)

    try {
      const rawEndpoint = endpoint_principal == undefined ? endpoint : endpoint_principal //esto es un parche para los filtros, por eso hay dos tipos de enpoints 
      const cleanEndpoint = rawEndpoint.replace(/\/filter$/, "") //esto es un parche para el enpoint de clientes
      const res = await fetchModel<{ data: T }>(`${cleanEndpoint}/${selectedId}`)

      const item = res.data
      setSelectedItem(item)
      setValue(String(item[valueKey] ?? ""))
      setDefaultLoaded(true)
      debugLog("Elemento seleccionado cargado:", item)
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "No se pudo cargar el elemento seleccionado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  },
  [endpoint_principal, endpoint, valueKey]
)





  // Carga items con paginación, búsqueda e ids
  const fetchItems = React.useCallback(
    async (reset = false, query = searchQuery) => {
      if (loadingRef.current || (!hasMore && !reset)) {
        debugLog("Skipping fetch - already loading or no more data", { loading: loadingRef.current, hasMore, reset })
        return
      }

      setLoading(true)
      loadingRef.current = true
      const currentPage = reset ? 1 : page
      debugLog("Fetching items", { reset, page: currentPage, query, per_page })

      try {
        // const params = new URLSearchParams({
        //   per_page: String(per_page),
        //   page: String(currentPage),
        //   ...(query && { q: query }),
        // })
        // const res = await fetchModel<{ data: T[]; total: number }>(`${endpoint}?${params}`)
        // let data = res.data
        // const total = res.total
        // setTotalItems(total)
        // debugLog("Received data", { count: data.length, total })

        const params = new URLSearchParams({
          per_page: String(per_page),
          page: String(currentPage),
          ...(query && { q: query }),
        })

        const separator = endpoint.includes('?') ? '&' : '?'
        const url = `${endpoint}${separator}${params.toString()}`

        const res = await fetchModel<{ data: T[]; total: number }>(url)

        let data = res.data
        const total = res.total
        setTotalItems(total)
        debugLog("Received data", { count: data.length, total })







        // filtrado por ids si aplica
        const idsArr = getFilterIds()
        if (idsArr.length) {
          data = data.filter((item) => idsArr.includes(String(item[valueKey])))
        }

        // determinamos la "base" de items según reset o no
        const baseItems = reset ? [] : items
        // creamos un set de ids ya vistos
        const seen = new Set(baseItems.map((item) => String(item[valueKey])))
        // solo los nuevos
        const newItems = data.filter((item) => !seen.has(String(item[valueKey])))
        debugLog("New items after filtering", { count: newItems.length })

        // actualizamos items
        const updatedItems = reset ? newItems : [...baseItems, ...newItems]
        setItems(updatedItems)

        // Important: Only update page if we're not resetting and we got new items
        if (!reset && newItems.length > 0) {
          setPage(currentPage + 1)
        } else if (reset) {
          setPage(2) // If we reset, the next page should be 2
        }

        // calculamos si hay más - importante: comparamos con la cantidad total del API
        const hasMoreItems = updatedItems.length < total
        setHasMore(hasMoreItems)
        debugLog("Updated state", {
          itemsCount: updatedItems.length,
          totalFromAPI: total,
          hasMore: hasMoreItems,
          nextPage: reset ? 2 : newItems.length > 0 ? currentPage + 1 : currentPage,
        })

        // para defaultValue, idem
        if (!defaultLoaded && defaultValue) {
          const found = updatedItems.find((item) => String(item[valueKey]) === String(defaultValue))
          if (found) {
            setSelectedItem(found)
            setValue(String(defaultValue))
          }
          setDefaultLoaded(true)
        }

        setDataLoaded(true)
      } catch (err: any) {
        console.error(err)
        toast({ title: "Error", description: err.message || "Error al cargar datos", variant: "destructive" })
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    },
    [endpoint, per_page, page, searchQuery, items, defaultLoaded, defaultValue, getFilterIds, valueKey, hasMore],
  )

  // Reset cuando cambian los ids
  React.useEffect(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setDataLoaded(false)
    if (!lazyLoad) fetchItems(true)
  }, [ids, lazyLoad])

  // Carga inicial y defaultValue
  React.useEffect(() => {
    if (defaultValue && !defaultLoaded) {
      fetchSelectedItem(String(defaultValue))
    }
    if (!lazyLoad || defaultValue) {
      fetchItems(true)
    }
  }, [defaultValue, defaultLoaded, lazyLoad])

  // Carga en apertura
  React.useEffect(() => {
    if (open && (!dataLoaded || (lazyLoad && items.length === 0))) {
      fetchItems(true)
    }
  }, [open])

  // Búsqueda con debounce
  const handleSearch = React.useCallback((val: string) => {
    setSearchQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      setHasMore(true)
      setItems([])
      fetchItems(true, val)
    }, 300)
  }, [])

  // Función loadMore mejorada
  const loadMore = React.useCallback(() => {
    if (loadingRef.current) {
      debugLog("Skip loadMore - already loading")
      return
    }

    if (!hasMore) {
      debugLog("Skip loadMore - no more data")
      return
    }

    debugLog("Loading more data", { currentPage: page, per_page, itemsCount: items.length, totalItems })
    fetchItems(false)
  }, [hasMore, fetchItems, page, per_page, items.length, totalItems])

  const handleScroll = React.useCallback(() => {
    const el = listRef.current
    if (!el) return

    // Calculate how close we are to the bottom (in pixels)
    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight

    // Load more when we're within 100px of the bottom
    if (scrollBottom < 100 && hasMore && !loadingRef.current) {
      debugLog("Triggering load more from scroll", { scrollBottom, hasMore, loading: loadingRef.current })
      loadMore()
    }
  }, [hasMore, loadMore])

  React.useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const getItemLabel = (item: T) => {
    if (Array.isArray(labelKey)) {
      return labelKey
        .map((k) => item[k])
        .filter(Boolean)
        .join(" ")
    }
    return String(item[labelKey] ?? "")
  }

  const clearSelection = () => {
    setValue("")
    setSelectedItem(null)
    onChange?.({ id: "", extraData: {} })
  }

  return (
    <div className="relative">
      {readonly ? (
        <div className="w-full p-2 border rounded-md bg-muted/20">
          {selectedItem ? getItemLabel(selectedItem) : <span className="text-muted-foreground">{placeholder}</span>}
          <input type="hidden" name={name} value={value} />
        </div>
      ) : (
        <>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn("w-full justify-between pr-8", required && !value && "border-red-500")}
                  disabled={loading}
                  type="button"
                >
                  {selectedItem ? (
                    <span className="flex-1 text-left truncate">{getItemLabel(selectedItem)}</span>
                  ) : loading ? (
                    "Cargando..."
                  ) : (
                    <span className="flex-1 text-left text-muted-foreground">
                      {placeholder}
                      {required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 absolute right-3 opacity-50" />
                </Button>
                {selectedItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-8 top-0 h-full px-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearSelection()
                    }}
                    type="button"
                    aria-label="Limpiar selección"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" align="start">
              <Command>
                <CommandInput placeholder="Buscar..." value={searchQuery} onValueChange={handleSearch} />
                <CommandList ref={listRef} className="max-h-[300px] overflow-auto">
                  <CommandEmpty>{loading ? "Cargando..." : "No se encontraron resultados."}</CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => {
                      const itemValue = String(item[valueKey])
                      const isSelected = value === itemValue
                      const extraData = extraDataKeys.reduce(
                        (acc, k) => {
                          acc[String(k)] = item[k]
                          return acc
                        },
                        {} as Record<string, any>,
                      )
                      return (
                        <CommandItem
                          className={cn(isSelected && "bg-primary text-primary-foreground")}
                          key={itemValue}
                          value={getItemLabel(item)}
                          onSelect={() => {
                            setValue(itemValue)
                            setSelectedItem(item)
                            setSearchQuery("")
                            setOpen(false)
                            onChange?.({ id: itemValue, extraData })
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                          {getItemLabel(item)}

                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  {loading && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Cargando...
                      </div>
                    </div>
                  )}
                  {/* Botón "Cargar más" siempre visible cuando hay más elementos */}
                  {!loading && hasMore && items.length > 0 && (
                    <div
                      className="p-3 text-center text-sm bg-muted/20 hover:bg-accent cursor-pointer flex items-center justify-center gap-2 border-t"
                      onClick={loadMore}
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span>
                        Cargar más ({items.length} de {totalItems})
                      </span>
                    </div>
                  )}

                  {/* Mensaje informativo al final de la lista */}
                  <div className="p-2 text-center text-xs text-muted-foreground border-t">
                    Para buscar más datos use el buscador
                  </div>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <select name={name} required={required} value={value} onChange={() => { }} className="sr-only" aria-hidden>
            <option value="">{placeholder}</option>
            {selectedItem && <option value={value}>{getItemLabel(selectedItem)}</option>}
          </select>
        </>
      )}
    </div>
  )
}
