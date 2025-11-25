"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { List } from "@/components/crud/list"
import { CreateEntityModal } from "@/components/crud/create"
import { DeleteItem } from "@/components/crud/delete"
import { GenericUpdateDialog } from "@/components/crud/update"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Map, User, Grid3X3, MapPin } from "lucide-react"



import { Exporter } from "@/components/export/exporter"
import type { SortingState } from "@tanstack/react-table"
import type { MyColumnDef } from "@/types/mycolumndef"
// import type { ColumnFilter } from "@/types/column-filter"
import type { Example } from "@/types/example"

export default function ExampleComponent() {
  const [canCreateExample, setCanCreateExample] = useState(false)
  const [triggerRefetch, setTriggerRefetch] = useState(0)
  //   const { canWrite, hasPermission } = usePermissions({
  //     requiredReadPermission: "read_polygon",
  //     requiredWritePermission: "write_polygon",
  //   })
  const [showAlert, setShowAlert] = useState(true)
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    description: true,
    active: true,
  })
  const handleExampleCreated = () => {
    setTriggerRefetch((prev) => prev + 1)
  }

  const handleExampleUpdate = () => {
    setTriggerRefetch((prev) => prev + 1)
  }

  const fetchExampleData = () => {
    setTriggerRefetch((prev) => prev + 1)
  }

  const handleColumnVisibilityChange = (newVisibility) => {
    console.log("Nueva visibilidad de columnas:", newVisibility)
    setColumnVisibility(newVisibility) // o cualquier estado en el padre
  }


  const [tableState, setTableState] = useState({
    searchTerm: "",
    sorting: [] as SortingState,
    columnVisibility: columnVisibility,
    filteredData: [] as Example[],
    columns: [] as MyColumnDef<Example>[],
  })

  const updateFields = [
    { key: "name", label: "Nombre", type: "text", required: true },
    { key: "description", label: "Descripcion", type: "string", required: true },
    { key: "active", label: "Activo", type: "boolean", labelKey: "name", valueKey: "id" },
  ]

  //START: DEFINIR COLUMNAS
  const columns: MyColumnDef<Example>[] = [
    {
      accessorKey: "name",
      name_exporter: "Nombre",
      value_exporter: "name",
      filterConfig: {
        searchColumn: true,
        checkColumn: true,
      },

      header: ({ column }) => (
        <div className="text-left">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="justify-end"
          >
            <User className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            Nombre <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => <div className="text-left font-medium text-foreground">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      name_exporter: "Descripción",
      value_exporter: "description",
      filterConfig: {
        searchColumn: true,
        checkColumn: true,
      },

      header: ({ column }) => (
        <div className="text-left">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="justify-end"
          >
            <User className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            Descripción <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => <div className="text-left font-medium text-foreground">{row.getValue("description")}</div>,
    },
    
{
  accessorKey: "active",
  name_exporter: "Activo",
  value_exporter: "active",
  filterConfig: {
    searchColumn: true,
    checkColumn: true,
  },

  header: ({ column }) => (
    <div className="text-left">
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="justify-end"
      >
        <User className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
        Activo <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </div>
  ),

  // Aquí es donde cambiamos la visualización
  cell: ({ row }) => {
    const value = row.getValue("active");
    return (
      <div className="text-left font-medium text-foreground">
        {value === 1 ? "Sí" : "No"}
      </div>
    );
  },
},

    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const example = row.original
        return (
          <div className="flex items-center space-x-2">
            <GenericUpdateDialog
              //disabled={!canWrite}
              title="Actualizar Ejemplo"
              data={{ ...example, id: example.id ?? 0 }}
              onUpdate={handleExampleUpdate}
              fields={updateFields}
              endpoint="examples"
              onSuccess={fetchExampleData}
              entityLabel="Ejemplo"
            />
            <DeleteItem
              //disabled={true}
              itemId={example.id!}
              itemName={example.name ?? "Nombre desconocido"}
              apiEndpoint=""
              entityLabel="Ejemplos"
              onItemDeleted={handleExampleCreated}
            />
          </div>
        )
      },
    },
  ]
  //END: DEFINIR COLUMNAS




  //DEPURACION DEL COLUMNVISIBILITY PARA CREAR columnVisibilityDepured
  // Crea un diccionario id -> value_exporter
  const idToExporter: Record<string, string> = {}
  columns.forEach((col) => {
    if (col.id && col.value_exporter) {
      idToExporter[col.id] = col.value_exporter
    }
  })
  const columnVisibilityDepured = Object.fromEntries(
    Object.entries(tableState.columnVisibility).map(([id, visible]) => {
      const exporterKey = idToExporter[id] || id
      return [exporterKey, visible]
    })
  )

  console.warn(
    "tableState.columnVisibilityDepured:\n" +
    JSON.stringify(columnVisibilityDepured, null, 2)
  )
  //DEPURACION DEL COLUMNVISIBILITY PARA CREAR columnVisibilityDepured





  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ejemplo</h1>
        <div className="flex gap-4">
          <Exporter
            filteredData={tableState.filteredData} //ESTO PASA LOS DATOS (CREO) //esto puede ser problematico con muchos datos??? //ESTO VA SER UN CRISTO
            //LAS PROPS DE ABJO YA FUNCIONAN TODAS OK
            searchTerm={tableState.searchTerm} //ESTO AHARA QUE EL COMPONENTE FILTRE POR LA BUSQUEDA DE LA TABLA
            sorting={tableState.sorting} //ESTO AHARA QUE EL COMPONENTE FILTRE POR LA ORDENACION DE LA TABLA
            tableColumns={tableState.columns} //ESTO AHARA QUE EL COMPONENTE CAMBIE LOS HEADERS DE LA TABLA
            tableColumnVisibility={columnVisibilityDepured} //ESTO AHARA QUE EL COMPONENTE PILLE LOS CAMPOS CHECKEADOS EN FUNCION DEL BOTON DE COLUMNAS QUE TENEMOS
          />
          
          <CreateEntityModal
            //   disabled={!canWrite}
            entityName="Ejemplo"
            endpoint="examples"
            canCreate={canCreateExample}
            onEntityCreated={handleExampleCreated}
            fields={[
              { name: "name", label: "Nombre", type: "text", required: true },
              { name: "description", label: "Descripcion", type: "text", required: true },
              { name: "active", label: "Activo", type: "boolean", required: true },
            ]}
          />
        </div>
      </div>

      <List
        endpoint="examples"
        columns={columns}
        triggerRefetch={triggerRefetch}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onTableStateChange={setTableState}
      />
    </div>
  )
}
