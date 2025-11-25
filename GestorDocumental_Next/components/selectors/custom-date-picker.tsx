"use client"

import React from "react"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    className?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    name?: string
}

// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function CustomDatePicker({
    date,
    setDate,
    className,
    placeholder = "Seleccionar fecha",
    disabled = false,
    readonly = false,
    required = false,
    name = "date",
}: DatePickerProps) {
    const [open, setOpen] = useState(false)
    const selectRef = useRef<HTMLSelectElement>(null)

    // Configurar el mensaje de error personalizado para el select
    useEffect(() => {
        if (selectRef.current) {
            // Si hay una fecha seleccionada, limpiar el mensaje de error
            if (date) {
                selectRef.current.setCustomValidity("")
            }

            // Establecer el mensaje de error personalizado
            selectRef.current.oninvalid = (e) => {
                const target = e.target as HTMLSelectElement
                target.setCustomValidity("Rellene esta fecha")
            }

            // Limpiar el mensaje de error cuando cambia el valor
            selectRef.current.oninput = (e) => {
                const target = e.target as HTMLSelectElement
                target.setCustomValidity("")
            }
        }
    }, [date])

    // Function to handle date selection with timezone adjustment
    const handleDateSelect = (newDate: Date | undefined) => {
        if (readonly) return // Don't allow changes if readonly

        if (newDate) {
            // Create a new date with the same year, month, and day but at noon
            // to avoid timezone issues causing the date to shift
            const adjustedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 12, 0, 0)
            setDate(adjustedDate)
            setOpen(false)
        } else {
            setDate(undefined)
        }
    }

    // If component is readonly, render a non-interactive version
    if (readonly) {
        return (
            <div
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2",
                    date && "border-primary/50 bg-primary/5",
                    className,
                )}
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    {date ? (
                        <span className="font-medium">
                            {format(date, "PPP", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-between text-left font-normal transition-all",
                            !date && "text-muted-foreground",
                            date && "border-primary/50 bg-primary/5",
                            required && !date && "border-red-500",
                            className,
                        )}
                        disabled={disabled}
                    >
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            {date ? (
                                <span className="font-medium">
                                    {format(date, "PPP", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
                                </span>
                            ) : (
                                <span>
                                    {placeholder}
                                    {required && <span className="text-red-500 ml-1">*</span>}
                                </span>
                            )}
                        </div>
                        {date && (
                            <X
                                className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setDate(undefined)
                                }}
                            />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="start" sideOffset={8}>
                    <div className="p-3">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                            locale={es}
                            className="rounded-md"
                            classNames={{
                                caption_label: "hidden",
                                caption_dropdowns: "flex items-center justify-center gap-2 mb-4 pt-1 mt-2", // Increased gap
                                dropdown:
                                    "p-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium min-w-[110px] appearance-none cursor-pointer", // Improved dropdown styling
                                dropdown_month: "text-sm font-medium",
                                dropdown_year: "text-sm font-medium",
                                nav: "flex absolute top-3 w-full justify-between px-8", // Añadido padding horizontal para evitar superposición
                                nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center", // Style nav buttons
                                nav_button_previous: "absolute left-1", // Position previous button
                                nav_button_next: "absolute right-1", // Position next button
                                table: "w-full border-collapse",
                                head_row: "flex w-full mt-2",
                                head_cell: "w-9 h-9 font-normal text-[0.8rem] text-muted-foreground",
                                row: "flex w-full",
                                cell: cn(
                                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/50",
                                    "[&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
                                ),
                                day: cn(
                                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                                ),
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                day_today: "border border-primary/50 bg-primary/5",
                                day_outside:
                                    "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground opacity-50",
                                day_disabled: "text-muted-foreground opacity-50",
                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                            }}
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={2030}
                            components={{
                                // Override the default caption to remove the Month/Year labels and capitalize month names
                                Dropdown: ({ value, onChange, children, ...props }) => {
                                    // Check if this is the month dropdown by examining the children
                                    const isMonthDropdown =
                                        Array.isArray(children) &&
                                        children.length === 12 &&
                                        typeof children[0]?.props?.children === "string"

                                    // If it's the month dropdown, capitalize the first letter of each month
                                    const modifiedChildren = isMonthDropdown
                                        ? React.Children.map(children, (child) => {
                                            if (
                                                React.isValidElement(child) &&
                                                typeof (child.props as React.HTMLProps<any>).children === "string"
                                            ) {
                                                const childText = (child.props as React.HTMLProps<any>).children
                                                return React.cloneElement(child as React.ReactElement<React.HTMLProps<any>>, {
                                                    children: capitalizeFirstLetter(childText as string),
                                                })
                                            }
                                            return child
                                        })
                                        : children

                                    // Estilizar el selector con un diseño más moderno
                                    return (
                                          <div style={{marginLeft: '-4px', marginRight: '2px', }} className="relative">
                                            <select
                                                value={value}
                                                onChange={onChange}
                                                className={cn(
                                                    props.className,
                                                    "appearance-none pl-3 pr-8 py-1.5 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors",
                                                )}
                                            >
                                                {modifiedChildren}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
                                        </div>
                                    )
                                },
                                IconLeft: () => <ChevronLeft style={{ marginRight: '10px', marginTop: '12px' }} className="h-4 w-4" />,
                                IconRight: () => <ChevronRight style={{ marginLeft: '10px', marginTop: '12px' }} className="h-4 w-4" />,
                            }}
                        />
                    </div>
                    <div className="p-3 border-t flex justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setDate(undefined)
                                setOpen(false)
                            }}
                        >
                            Limpiar
                        </Button>
                        <Button size="sm" onClick={() => setOpen(false)}>
                            Aplicar
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            {/* Usamos un select con mensaje de error personalizado */}
            <select
                ref={selectRef}
                name={name}
                required={required}
                value={date ? date.toISOString() : ""}
                onChange={() => { }}
                className="sr-only"
                aria-hidden="true"
            >
                <option value="">{placeholder}</option>
                {date && (
                    <option value={date.toISOString()} selected>
                        {format(date, "PPP", { locale: es })}
                    </option>
                )}
            </select>
        </>
    )
}
