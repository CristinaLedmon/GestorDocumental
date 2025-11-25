"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { EditIcon } from "lucide-react"
import { GenericSelect } from "@/components/selectors/general-select"
import fetchModel from "@/lib/fetch-utils"
import { CustomDatePicker } from "../selectors/custom-date-picker"

interface SelectOption {
  value: string
  label: string
}

interface Field {
  key: string
  object?: string
  label: string
  type: string
  options?: SelectOption[] | string[]
  endpoint?: string
  labelKey?: string
  valueKey?: string
  required?: boolean
  readonly?: boolean
  hidden?: boolean
  placeholder?: string
}

interface GenericUpdateDialogProps<T> {
  title: string
  data: T
  onUpdate: (updatedData: T) => void
  fields: Field[]
  endpoint: string
  onSuccess: () => void
  entityLabel?: string
  method?: "PUT" | "PATCH"
  disabled?: boolean
}

export function GenericUpdateDialog<T extends { id: string | number }>({
  title,
  data,
  onUpdate,
  fields,
  endpoint,
  onSuccess,
  entityLabel = "registro",
  method = "PUT",
  disabled,
}: GenericUpdateDialogProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<T>(data)
  const [selectOptions, setSelectOptions] = useState<Record<string, SelectOption[]>>({})

  useEffect(() => {
    setFormData(data)
  }, [data])

  useEffect(() => {
    const fetchSelectOptions = async () => {
      const fetchedOptions: Record<string, SelectOption[]> = {}
      for (const field of fields) {
        if (field.type === "select") {
          console.log("entra aqui2")
          if (field.options && Array.isArray(field.options)) {
            fetchedOptions[field.key] = (field.options as any[]).map((option) =>
              typeof option === "string" ? { value: option, label: option } : option,
            )
          } else if (field.endpoint) {
            console.log("entra aqui3")
            try {
              const response = await fetch(field.endpoint)
              const data = await response.json()
              fetchedOptions[field.key] = data.map((item: any) => ({
                value: item.id.toString(),
                label: item.name,
              }))
            } catch (error) {
              console.error(`Error fetching options for ${field.key}:`, error)
            }
          }
        }
      }
      setSelectOptions(fetchedOptions)
    }

    if (isOpen) fetchSelectOptions()
  }, [isOpen, fields])

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const renderField = (field: Field) => {
    if (field.hidden) {
      return null // No renderizamos nada
    }
    switch (field.type) {
case "select":
  return (
    <>
      <Select
        value={(formData as any)[field.key]}
        onValueChange={(value) => handleChange(field.key, value)}
        disabled={field.readonly} // Deshabilitar si es readonly
      >
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || `Seleccionar ${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          {(selectOptions[field.key] || []).map((option: any, index: number) => {
            let label: string
            let value: string

            if (typeof option === "object" && option !== null && "label" in option && "value" in option) {
              // Caso objeto { label, value }
              label = option.label
              value = String(option.value)
            } else if (typeof option === "string" && option.includes("|")) {
              // Caso string con separador "Texto|valor"
              const [labelPart, valuePart] = option.split("|")
              label = labelPart
              value = valuePart
            } else {
              // Caso string simple
              label = String(option)
              value = String(option)
            }

            return (
              <SelectItem key={index} value={value}>
                {label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {field.required && !(formData as any)[field.key] && (
        <input
          type="text"
          tabIndex={-1}
          required
          className="sr-only"
          value={(formData as any)[field.key] || ""}
          onChange={() => {}}
          aria-hidden="true"
        />
      )}
    </>
  )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.key}
              checked={!!(formData as any)[field.key]}
              onCheckedChange={(value) => handleChange(field.key, value)}
              disabled={field.readonly} // Deshabilitar si es readonly
            />
            <Label htmlFor={field.key}>{(formData as any)[field.key] ? "Sí" : "No"}</Label>
          </div>
        )
      case "select-endpoint":
        return (
          <>
            <GenericSelect
              endpoint={field.endpoint}
              labelKey={field.labelKey}
              valueKey="id"
              name={field.key}
              placeholder={field.placeholder || `Seleccionar ${field.label}`}
              defaultValue={field.object ? formData[field.object]?.id : (formData as any)[field.key]}
              value={(formData as any)[field.key]}
              onChange={(selected) => handleChange(field.key, selected?.id || null)}
            // disabled={field.readonly}  // Deshabilitar si es readonly
            />
            {field.required && !(formData as any)[field.key] && (
              <input
                type="text"
                tabIndex={-1}
                required
                className="sr-only"
                value={(formData as any)[field.key] || ""}
                onChange={() => { }}
                aria-hidden="true"
              />
            )}
          </>
        )
      case "textarea":
        return (
          <Textarea
            id={field.key}
            name={field.key}
            required={field.required}
            value={(formData as any)[field.key] || ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder || field.label}
            disabled={field.readonly} // Deshabilitar si es readonly
          />
        )
      case "date":
        return (
          <CustomDatePicker
            date={formData[field.key] ? new Date(formData[field.key]) : undefined}
            setDate={(value) => handleChange(field.key, value)}
            disabled={field.readonly} // Deshabilitar si es readonly
          />
        )
      default:
        return (
          <Input
            id={field.key}
            name={field.key}
            type={field.type}
            required={field.required}
            value={(formData as any)[field.key] || ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder || field.label}
            disabled={field.readonly} // Deshabilitar si es readonly
          />
        )
    }
  }

  // console.log("DATOSssssssssssssss:" + JSON.stringify(formData))
  // const handleConfirm = async () => {
  //   try {
  //     const response = await fetchModel<{ data: T }>(`${endpoint}/${formData.id}`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: formData,
  //     })

  //     if (response.data) {
  //       toast({
  //         title: `${entityLabel.charAt(0).toUpperCase()}${entityLabel.slice(1)} actulizado/a`,
  //         description: "Los datos han sido actualizados exitosamente.",
  //       })
  //       onUpdate(response.data)
  //       onSuccess()
  //       setIsOpen(false)
  //     } else {
  //       throw new Error("Error al actualizar la entidad")
  //     }
  //   } catch (error: any) {
  //     console.error("Error al actualizar la entidad:", error)
  //     toast({
  //       title: "Error",
  //       description: error.message || "Hubo un problema al actualizar la entidad.",
  //       variant: "destructive",
  //     })
  //   }
  // }

  const handleConfirm = async () => {
    console.log("=== INICIO DE handleConfirm ===")
    console.log("Endpoint:", `${endpoint}/${formData.id}`)
    console.log("Method:", method)
    console.log("Headers: Content-Type: application/json")
    console.log("Body (formData):", formData)

try {
  const response = await fetchModel<{ data?: T | T[]; success?: boolean }>(`${endpoint}/${formData.id}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: formData,
  })

  console.log("Respuesta completa de fetchModel:", response)

  // Normalizamos el objeto que vamos a usar en onUpdate
  let updatedEntity: T

  if (response.data) {
    if (Array.isArray(response.data) && response.data.length > 0) {
      // ✅ Caso FastAPI con data array
      updatedEntity = response.data[0]
      console.log("✅ Datos recibidos en response.data[0]:", updatedEntity)
    } else {
      // ✅ Caso Laravel o FastAPI con objeto directo en data
      updatedEntity = response.data as T
      console.log("✅ Datos recibidos en response.data:", updatedEntity)
    }
  } else if (response.success) {
    // ✅ Caso backend devuelve { success: true } pero sin data
    console.log("⚠️ No hay 'data', pero 'success' es true. Se asume éxito.")
    updatedEntity = formData as T
  } else if ((response as any).id) {
    // ✅ Caso backend devuelve objeto plano (el actualizado)
    updatedEntity = response as T
    console.log("✅ Objeto plano recibido:", updatedEntity)
  } else {
    // ❌ Caso inesperado
    console.warn("❌ Respuesta inesperada del servidor:", response)
    throw new Error("Error al actualizar la entidad")
  }

  // Toast de éxito y callback
  toast({
    title: `${entityLabel.charAt(0).toUpperCase()}${entityLabel.slice(1)} actualizado/a`,
    description: "Los datos han sido actualizados exitosamente.",
  })

  onUpdate(updatedEntity)
  onSuccess()
  setIsOpen(false)

} catch (error: any) {
  console.error("❌ Error capturado en catch:", error)
  toast({
    title: "Error",
    description: error.message || "Hubo un problema al actualizar la entidad.",
    variant: "destructive",
  })
} finally {
  console.log("=== FIN DE handleConfirm ===")
}

  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setFormData(data)
  }

  return (
    <>
      <Button disabled={disabled} variant="ghost" size="icon" onClick={() => handleOpenChange(true)}>
        <EditIcon className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (e.currentTarget.checkValidity()) {
                handleConfirm()
              } else {
                // Trigger browser validation UI
                const formElement = e.currentTarget
                const firstInvalidField = formElement.querySelector(":invalid")
                if (firstInvalidField) {
                  ; (firstInvalidField as HTMLElement).focus()
                }
              }
            }}
          >
            <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4 pt-10">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
