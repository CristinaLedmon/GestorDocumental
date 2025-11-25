"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { List } from "@/components/crud/list"
import { CreateEntityModal } from "@/components/crud/create"
import { DeleteItem } from "@/components/crud/delete"
import { GenericUpdateDialog } from "@/components/crud/update"
import { usePermissions } from "@/hooks/use-permissions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { Exporter } from "@/components/export/exporter"
import {
    Mail,
    CircleUser
} from "lucide-react"

import type { User } from "@/types/user"
import type { SortingState } from "@tanstack/react-table"
import type { MyColumnDef } from "@/types/mycolumndef"
import { format } from "date-fns"
import { Importer } from "@/components/import/importer"




export default function UserComponent() {
    const [canCreateUser, setCanCreateUser] = useState(false)
    const [triggerRefetch, setTriggerRefetch] = useState(0)
    //   const { canWrite, hasPermission } = usePermissions({
    //     requiredReadPermission: "read_delegation",
    //     requiredWritePermission: "write_delegation",
    //   })
    const [columnVisibility, setColumnVisibility] = useState({
        email: true,
        name: true,
    })
    const [showAlert, setShowAlert] = useState(true)
    const [tableState, setTableState] = useState({
        searchTerm: "",
        sorting: [] as SortingState,
        columnVisibility: columnVisibility,
        filteredData: [] as User[],
        columns: [] as MyColumnDef<User>[],
    })


    const handleUserCreated = () => {
        setTriggerRefetch((prev) => prev + 1)
    }

    const handleUserUpdate = () => {
        setTriggerRefetch((prev) => prev + 1)
    }

    const fetchUserData = () => {
        setTriggerRefetch((prev) => prev + 1)
    }


    const handleColumnVisibilityChange = (newVisibility) => {
        console.log("Nueva visibilidad de columnas:", newVisibility)
        setColumnVisibility(newVisibility) // o cualquier estado en el padre
    }


    const updateFields = [
        { key: "email", label: "Email", type: "text", },
        { key: "name", label: "Nombre completo", type: "text", },
    ]

    //START: DEFINIR COLUMNAS
    const columns: MyColumnDef<User>[] = [
        {
            accessorKey: "name",
            name_exporter: "Nombre",
            value_exporter: "name",

            header: ({ column }) => (
                <div className="">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        <CircleUser className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Nombre <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const value = row.getValue("name")
                if (!value) return <span className="text-muted-foreground block">-</span>

                const nameValue = String(value)
                return (
                    <div className="">
                        {nameValue}
                    </div>
                )
            },
        },
              {
            accessorKey: "email",
            name_exporter: "Email",
            value_exporter: "email",

            header: ({ column }) => (
                <div className="">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        <Mail className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                        Email <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const value = row.getValue("email")
                if (!value) return <span className="text-muted-foreground  block">-</span>

                const emailValue = String(value)
                return (
                    <div className="">
                        {emailValue}
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex items-center space-x-2">
                        <GenericUpdateDialog
                            //   disabled={!canWrite}
                            title="Actualizar Usuario"
                            data={{ ...user, id: user.id ?? 0 }}
                            onUpdate={handleUserUpdate}
                            fields={updateFields}
                            endpoint="users"
                            onSuccess={fetchUserData}
                            entityLabel="Usuario"
                            method="PATCH"
                        />
                        <DeleteItem
                            //   disabled={true}
                            itemId={user.id!}
                            itemName={user.name ?? "Nombre desconocido"}
                            apiEndpoint="users"
                            entityLabel="Usuarios"
                            onItemDeleted={handleUserCreated}
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
                <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
                <br />
                <div className="flex flex-row gap-2">
                    {/* CREAR AVISO AQUI!!!! */}
                    <CreateEntityModal
                        //   disabled={!canWrite}
                        entityName="Usuario"
                        endpoint="users"
                        canCreate={canCreateUser}
                        onEntityCreated={handleUserCreated}
                        fields={[
                            { name: "name", label: "Nombre", type: "text", required: true },
                            { name: "email", label: "Email", type: "text", required: true },
                            { name: "password", label: "Contraseña", type: "password", required: true },
                        ]}
                    />
                    <Exporter
                        filteredData={tableState.filteredData} //ESTO PASA LOS DATOS (CREO) //esto puede ser problematico con muchos datos??? //ESTO VA SER UN CRISTO
                        //LAS PROPS DE ABJO YA FUNCIONAN TODAS OK
                        searchTerm={tableState.searchTerm} //ESTO AHARA QUE EL COMPONENTE FILTRE POR LA BUSQUEDA DE LA TABLA
                        sorting={tableState.sorting} //ESTO AHARA QUE EL COMPONENTE FILTRE POR LA ORDENACION DE LA TABLA
                        tableColumns={tableState.columns} //ESTO AHARA QUE EL COMPONENTE CAMBIE LOS HEADERS DE LA TABLA
                        tableColumnVisibility={columnVisibilityDepured} //ESTO AHARA QUE EL COMPONENTE PILLE LOS CAMPOS CHECKEADOS EN FUNCION DEL BOTON DE COLUMNAS QUE TENEMOS
                    />
                </div>
            </div>

            {/* {showAlert && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <div>
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Las Delegaciones no podrán ser eliminadas ni editados una vez creadas. Por favor, verifique la
                información antes de guardar.
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAlert(false)}
            className="h-6 w-6 rounded-full"
            aria-label="Cerrar alerta"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )} */}

            <List
                endpoint="users"
                columns={columns}
                triggerRefetch={triggerRefetch}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                onTableStateChange={setTableState}
            />
        </div>
    )
}
