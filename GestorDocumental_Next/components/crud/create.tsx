"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { GenericSelect } from "@/components/selectors/general-select"
import fetchModel from "@/lib/fetch-utils"
import { CustomDatePicker } from "../selectors/custom-date-picker"
import { Eye, EyeOff } from "lucide-react"

interface Field {
    name: string
    label: string
    type: "text" | "number" | "boolean" | "color" | "select" | "textarea" | "select-endpoint" | "date" | "password"
    required?: boolean
    options?: string[] | Array<{ option: string; value: any }>
    endpoint?: string
    labelKey?: string | string[]
    valueKey?: string
    placeholder?: string
}

interface CreateEntityModalProps {
    disabled?: boolean
    entityName: string
    endpoint: string
    fields: Field[]
    canCreate: boolean
    onEntityCreated: () => void
}

export function CreateEntityModal({
    entityName,
    endpoint,
    fields,
    canCreate,
    disabled,
    onEntityCreated,
}: CreateEntityModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formattedFields, setFormattedFields] = useState<Field[]>([])
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (open) {
            setFormattedFields(fields)
            const initialData: Record<string, any> = {}
            fields.forEach((field) => {
                if (field.type === "boolean") {
                    initialData[field.name] = true
                }
            })
            setFormData(initialData)
        }
    }, [open, fields])

    const handleChange = (name: string, value: any, fieldType: string) => {
        let formattedValue = value
        if (fieldType === "boolean") {
            formattedValue = Boolean(value)
        } else if (fieldType === "number") {
            formattedValue = value === "" ? "" : Number(value)
        } else if (fieldType === "select-endpoint") {
            formattedValue = value && typeof value === "object" && "id" in value ? value.id : ""
        }

        setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!(event.target as HTMLFormElement).checkValidity()) {
            const firstInvalidField = (event.target as HTMLFormElement).querySelector(":invalid")
            if (firstInvalidField) {
                ; (firstInvalidField as HTMLElement).focus()
            }
            return
        }

        setIsLoading(true)

        try {
            const response = await fetchModel<Record<string, any>>(endpoint, {
                method: "POST",
                body: formData,
            })

            // Intentamos obtener el ID de forma flexible
            let id: string | null = null

            if (response) {
                if (typeof response.id === "string" && response.id.trim() !== "") {
                    // FastAPI antiguo / Laravel directo
                    id = response.id
                } else if (response.data?.id) {
                    // Laravel con data.id
                    id = response.data.id
                } else if (Array.isArray(response.data) && response.data[0]?.id) {
                    // FastAPI nuevo con data array
                    id = response.data[0].id
                }
            }

            if (!id) {
                console.log(
                    "%c ERROR: operación fallida",
                    "color: white; background-color: red; padding: 2px 6px; border-radius: 3px;",
                )
                throw new Error(`Error al crear ${entityName}`)
            }

            // Toast de éxito
            toast({
                title: `${entityName.charAt(0).toUpperCase()}${entityName.slice(1)} creado/a`,
                description: `${entityName.charAt(0).toUpperCase()}${entityName.slice(1)} se ha creado correctamente.`,
            })

            setOpen(false)
            onEntityCreated()
        } catch (error) {
            console.error(`Error al crear ${entityName}:`, error)
            toast({
                title: "Error",
                description: "Hubo un problema al crear el elemento. Por favor, inténtalo de nuevo.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const renderField = (field: Field): ReactNode => {
        switch (field.type) {
            case "boolean":
                return (
                    <div className="col-span-3 flex items-center space-x-2">
                        <Switch
                            id={field.name}
                            checked={formData[field.name] !== undefined ? formData[field.name] : true}
                            onCheckedChange={(value) => handleChange(field.name, value, field.type)}
                        />
                        <Label htmlFor={field.name}>
                            {formData[field.name] !== undefined ? (formData[field.name] ? "Sí" : "No") : "Sí"}
                        </Label>
                    </div>
                )

            case "color":
                return (
                    <Input
                        id={field.name}
                        name={field.name}
                        type="color"
                        required={field.required}
                        className="col-span-3"
                        value={formData[field.name] || "#000000"}
                        onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                    />
                )

            //   case "select":
            //     return field.options ? (
            //       <>
            //         <Select
            //           onValueChange={(value) => handleChange(field.name, value, field.type)}
            //           value={formData[field.name] || ""}
            //         >
            //           <SelectTrigger className="col-span-3">
            //             <SelectValue placeholder={field.placeholder || `Selecciona ${field.label}`} />
            //           </SelectTrigger>
            //           <SelectContent>
            //             {field.options.map((option, index) => {
            //               // Verifica si la opción es un objeto con propiedades option y value
            //               if (typeof option === "object" && option !== null && "option" in option && "value" in option) {
            //                 return (
            //                   <SelectItem key={index} value={String(option.value)}>
            //                     {option.option}
            //                   </SelectItem>
            //                 )
            //               } else {
            //                 // Maneja el caso de opciones simples (strings)
            //                 return (
            //                   <SelectItem key={index} value={String(option)}>
            //                     {option}
            //                   </SelectItem>
            //                 )
            //               }
            //             })}
            //           </SelectContent>
            //         </Select>
            //         {field.required && !formData[field.name] && (
            //           <input
            //             type="text"
            //             tabIndex={-1}
            //             required
            //             className="sr-only"
            //             value={formData[field.name] || ""}
            //             onChange={() => {}}
            //             aria-hidden="true"
            //           />
            //         )}
            //       </>
            //     ) : null


            case "select":
                return field.options ? (
                    <>
                        <Select
                            onValueChange={(value) => handleChange(field.name, value, field.type)}
                            value={formData[field.name] || ""}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder={field.placeholder || `Selecciona ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options.map((option: any, index: number) => {
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

                        {field.required && !formData[field.name] && (
                            <input
                                type="text"
                                tabIndex={-1}
                                required
                                className="sr-only"
                                value={formData[field.name] || ""}
                                onChange={() => { }}
                                aria-hidden="true"
                            />
                        )}
                    </>
                ) : null


            case "select-endpoint":
                return (
                    <>
                        <GenericSelect
                            endpoint={field.endpoint ?? ""}
                            labelKey={field.labelKey ?? "name"}
                            valueKey={field.valueKey ?? ""}
                            required={field.required}
                            name={field.name}
                            placeholder={field.placeholder || `Seleccionar ${field.label}`}
                            onChange={(value) => handleChange(field.name, value, field.type)}
                        />
                        {field.required && !formData[field.name] && (
                            <input
                                type="text"
                                tabIndex={-1}
                                required
                                className="sr-only"
                                value={formData[field.name] || ""}
                                onChange={() => { }}
                                aria-hidden="true"
                            />
                        )}
                    </>
                )

            case "textarea":
                return (
                    <Textarea
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        className="col-span-3"
                        value={formData[field.name] || ""}
                        onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                        placeholder={field.placeholder || `Escribir ${field.label.toLowerCase()} ...`}
                    />
                )

            case "date":
                return (
                    <CustomDatePicker
                        date={formData[field.name] || undefined}
                        setDate={(value) => handleChange(field.name, value, field.type)}
                    />
                )

            case "password":
                return (
                    <div className="relative flex items-center col-span-3">
                        <Input
                            id={field.name}
                            name={field.name}
                            type={showPassword ? "text" : "password"}
                            required={field.required}
                            className="pr-10"
                            value={formData[field.name] || ""}
                            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                            placeholder={field.placeholder || "Introduce tu contraseña"}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                )

            default:
                return (
                    <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        required={field.required}
                        className="col-span-3"
                        value={formData[field.name] || ""}
                        onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                        placeholder={field.placeholder || ""}
                    />
                )
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled}>Añadir {entityName}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Añadir {entityName}</DialogTitle>
                        <DialogDescription>Completa los campos y haz clic en guardar.</DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {formattedFields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name}>
                                    {field.label} {field.required && <span className="text-destructive">*</span>}
                                </Label>
                                {renderField(field)}
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="pt-10">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
