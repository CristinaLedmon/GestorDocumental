"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import fetchModel from "@/lib/fetch-utils"

type TownsData = Record<string, Record<string, string>>

interface LocationSelectorProps {
  onProvinceChange?: (province: string) => void
  onTownChange?: (townId: string, townName: string) => void
  initialProvince?: string
  initialTownId?: string
}

export default function LocationSelector({ onProvinceChange, onTownChange, initialProvince, initialTownId }: LocationSelectorProps) {
  const [dataTowns, setDataTowns] = useState<TownsData>({})
  const [provinceSearch, setProvinceSearch] = useState("")
  const [townSearch, setTownSearch] = useState("")
  const [provinceSelected, setProvinceSelected] = useState<string>(initialProvince || "")
  const [townSelected, setTownSelected] = useState<string>(initialTownId || "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTownsData = async () => {
      try {
        setLoading(true)
        const response = await fetchModel<{ data: TownsData }>("towns/grouped-province-towns", {
          method: "GET",
        })
        setDataTowns(response.data)

        // Establecer la provincia y la ciudad inicial si se han pasado props
        if (initialTownId) {
          for (const [province, towns] of Object.entries(response.data)) {
            if (towns[initialTownId]) {
              setProvinceSelected(province)
              setTownSelected(initialTownId)
              if (onProvinceChange) onProvinceChange(province)
              if (onTownChange) onTownChange(initialTownId, towns[initialTownId])
              break
            }
          }
        }
      } catch (error) {
        toast({
          title: "Error Poblaciones",
          description: "Se ha producido un error al cargar el selector de poblaciones.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTownsData()
  }, [initialTownId, initialProvince])

  const filteredProvinces = Object.keys(dataTowns).filter((province) =>
    province.toLowerCase().includes(provinceSearch.toLowerCase()),
  )

  const selectedProvinceData = provinceSelected ? dataTowns[provinceSelected] || {} : {}

  const filteredTowns = Object.entries(selectedProvinceData)
    .filter(([_, name]) => name.toLowerCase().includes(townSearch.toLowerCase()))
    .map(([id, name]) => ({ value: id, label: name }))

  const selectedTownName = townSelected ? filteredTowns.find((town) => town.value === townSelected)?.label || "" : ""

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Selector de Provincia */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="province">Provincia</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="province"
              variant="outline"
              role="combobox"
              className={cn("w-full justify-between", !provinceSelected && "text-muted-foreground")}
              disabled={loading}
            >
              {provinceSelected || "Selecciona una provincia"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput
                placeholder="Buscar provincia..."
                onValueChange={setProvinceSearch}
                value={provinceSearch}
              />
              <CommandList>
                <CommandEmpty>No se han encontrado resultados.</CommandEmpty>
                <CommandGroup>
                  {filteredProvinces.map((province) => (
                    <CommandItem
                      key={province}
                      value={province}
                      onSelect={() => {
                        setProvinceSelected(province)
                        setTownSelected("")
                        setProvinceSearch("")
                        setTownSearch("")
                        if (onProvinceChange) onProvinceChange(province)
                      }}
                    >
                      {province}
                      <Check className={cn("ml-auto", provinceSelected === province ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <input type="hidden" name="province" value={provinceSelected} />
      </div>

      {/* Selector de Población */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="id_town">Población</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="id_town"
              variant="outline"
              role="combobox"
              className={cn("w-full justify-between", !townSelected && "text-muted-foreground")}
              disabled={!provinceSelected || loading}
            >
              {selectedTownName || "Selecciona una población"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput placeholder="Buscar población..." onValueChange={setTownSearch} value={townSearch} />
              <CommandList>
                <CommandEmpty>No se han encontrado resultados.</CommandEmpty>
                <CommandGroup>
                  {filteredTowns.map((town) => (
                    <CommandItem
                      key={town.value}
                      value={town.label}
                      onSelect={() => {
                        setTownSelected(town.value)
                        setTownSearch("")
                        if (onTownChange) onTownChange(town.value, town.label)
                      }}
                    >
                      {town.label}
                      <Check className={cn("ml-auto", townSelected === town.value ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <input type="hidden" name="id_town" value={townSelected} />
      </div>
    </div>
  )
}
