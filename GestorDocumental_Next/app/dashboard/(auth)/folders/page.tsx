"use client"
import type React from "react"
import { useEffect, useState } from "react"
import fetchModel from "@/lib/fetch-utils"
import useAuth from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {  Folder,  File,  ImageIcon,  ArrowLeft,  ChevronRight,  ChevronDown,  Plus,  Upload,  Trash2,  Info,  Copy,  Download,  Grid3x3,  List,  Clock,  ArrowUpDown,} from "lucide-react"

// ========================INTERFACES==============================
interface FolderType {
  id: number
  name: string
  parent_id: number | null
  created_at: string
  updated_at: string
  full_path?: string
}

interface DocumentType {
  id: number
  name: string
  file_path: string
  folder_id: number | null
  created_at: string
}

type ViewMode = "grid" | "list"
type SortBy = "name" | "fecha" | "tamaño" | "tipo"

// =====================PÁGINA PRINCIPAL =================================
export default function DocumentsPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const [folders, setFolders] = useState<FolderType[]>([])
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [allFolders, setAllFolders] = useState<FolderType[]>([])
  const [allDocuments, setAllDocuments] = useState<DocumentType[]>([])
  const [mostUsedFolders, setMostUsedFolders] = useState<FolderType[]>([])
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null)

  const [loading, setLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<number[]>([])
  const [selectedFolders, setSelectedFolders] = useState<number[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([])

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // MODALES
  const [infoModalFolder, setInfoModalFolder] = useState<FolderType | null>(null)
  const [infoModalDocument, setInfoModalDocument] = useState<DocumentType | null>(null)

  // DRAG & DROP
  const [draggingFolder, setDraggingFolder] = useState<FolderType | null>(null)
  const [draggingDocument, setDraggingDocument] = useState<DocumentType | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<number | null>(null)

  // Buscador
  const [searchTerm, setSearchTerm] = useState("")

  // Editar nombres
  const [editFolderName, setEditFolderName] = useState("")
  const [editDocumentName, setEditDocumentName] = useState("")

  useEffect(() => {
    if (infoModalFolder) {
      setEditFolderName(infoModalFolder.name)
    }
  }, [infoModalFolder])

  useEffect(() => {
    if (infoModalDocument) {
      setEditDocumentName(infoModalDocument.name)
    }
  }, [infoModalDocument])

  // ====================== LOAD DATA ================================
  const loadAllData = async () => {
    try {
      const resFolders = await fetchModel("folders/all", { credentials: "include" })
      const payloadFolders = Array.isArray(resFolders.data) ? resFolders.data[0] : resFolders
      setAllFolders(payloadFolders.folders ?? [])

      const resDocs = await fetchModel("documents", { credentials: "include" })
      const payloadDocs = Array.isArray(resDocs.data) ? resDocs.data[0] : resDocs
      setAllDocuments(payloadDocs.documents ?? [])

      const resMostUsed = await fetchModel("folders/most-used", {
        credentials: "include",
      })
      const payloadMostUsed = Array.isArray(resMostUsed.data) ? resMostUsed.data[0] : resMostUsed
      setMostUsedFolders(payloadMostUsed.folders ?? [])
    } catch (err) {
      console.error("Error cargando todos los datos:", err)
    }
  }

  const loadContent = async (folderId: number | null = null) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        folder_id: String(folderId ?? ""),
        sort: sortBy,
        order: sortOrder,
      })
      const res = await fetchModel(`folders?${params}`, { credentials: "include" })
      const payload = Array.isArray(res.data) ? res.data[0] : res

      setFolders(payload.folders ?? [])
      setDocuments(payload.documents ?? [])
    } catch (err) {
      console.error("Error cargando contenido:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) return

    const load = async () => {
      await loadAllData()
      await loadContent()
    }
    load()
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    loadContent(currentFolder?.id ?? null)
  }, [sortBy, sortOrder])

  // ================== CREAR CARPETA ====================================
  const createFolder = async () => {
    if (!newFolderName.trim()) return

    await fetchModel("folders", {
      method: "POST",
      body: { name: newFolderName, parent_id: currentFolder?.id ?? null },
      credentials: "include",
    })

    setNewFolderName("")
    await loadAllData()
    await loadContent(currentFolder?.id ?? null)
  }

  // =================== NAVEGACIÓN ===================================
  const openFolder = (folder: FolderType) => {
    setCurrentFolder(folder)
    loadContent(folder.id)
  }

  const goBack = () => {
    if (!currentFolder?.parent_id) {
      setCurrentFolder(null)
      loadContent(null)
      return
    }

    const parent = allFolders.find((f) => f.id === currentFolder.parent_id) ?? null
    setCurrentFolder(parent)
    loadContent(parent?.id ?? null)
  }

  // =================== SUBIDA ARCHIVOS ===================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const folderId = currentFolder?.id ?? null

    await Promise.all(
      Array.from(files).map(async (file) => {
        const form = new FormData()
        form.append("file", file)
        if (folderId) form.append("folder_id", String(folderId))

        await fetchModel("documents", {
          method: "POST",
          body: form,
          credentials: "include",
        })
      }),
    )

    await loadAllData()
    await loadContent(folderId)
  }

  // ======================= SELECCIÓN ===============================
  const toggleSelectFolder = (id: number) => {
    setSelectedFolders((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectDocument = (id: number) => {
    setSelectedDocuments((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // ====================== BORRAR ================================
  const deleteSelectedItems = async () => {
    await Promise.all([
      ...selectedFolders.map(async (id) => {
        await fetchModel(`folders/${id}`, { method: "DELETE", credentials: "include" })
      }),
      ...selectedDocuments.map(async (id) => {
        await fetchModel(`documents/${id}`, {
          method: "DELETE",
          credentials: "include",
        })
      }),
    ])

    setSelectedFolders([])
    setSelectedDocuments([])
    await loadAllData()
    await loadContent(currentFolder?.id ?? null)
  }

  // ================== BREADCRUMBS ====================================
   const getBreadcrumbs = () => {
    const trail: FolderType[] = []
    let folder = currentFolder

    while (folder) {
      trail.unshift(folder)
      folder = folder.parent_id ? allFolders.find(f => f.id === folder.parent_id) ?? null : null
    }

    return trail
  }

  // ===================== DRAG & DROP: MOVER EN VISTA PRINCIPAL =================================
  const handleDropOnFolder = async (e: React.DragEvent, targetFolder: FolderType) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolder(null)

    if (draggingFolder) {
      await moveFolder(draggingFolder.id, targetFolder.id)
      setDraggingFolder(null)
    } else if (draggingDocument) {
      await moveDocument(draggingDocument.id, targetFolder.id)
      setDraggingDocument(null)
    }
  }

  // ===================== DRAG & DROP: MOVER A CARPETAS EN SIDEBAR =================================
  const handleDropOnSidebarFolder = async (e: React.DragEvent, targetFolder: FolderType) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolder(null)

    if (draggingFolder) {
      await moveFolder(draggingFolder.id, targetFolder.id)
      setDraggingFolder(null)
    } else if (draggingDocument) {
      await moveDocument(draggingDocument.id, targetFolder.id)
      setDraggingDocument(null)
    }
  }

  // ===================== DRAG & DROP: MOVER CARPETAS =================================
  const moveFolder = async (folderId: number, newParentId: number | null) => {
    await fetchModel(`folders/${folderId}/move`, {
      method: "PATCH",
      body: { parent_id: newParentId },
      credentials: "include",
    })

    await loadAllData()
    await loadContent(currentFolder?.id ?? null)
  }

  // ===================== DRAG & DROP: MOVER DOCUMENTOS =================================
  const moveDocument = async (documentId: number, newFolderId: number | null) => {
    await fetchModel(`documents/${documentId}/move`, {
      method: "PATCH",
      body: { folder_id: newFolderId },
      credentials: "include",
    })

    await loadAllData()
    await loadContent(currentFolder?.id ?? null)
  }

  // =================== FUNCION PARA FILTRAR RECURSIVAMENTE ===================================
  const folderMatchesSearch = (folderId: number | null, term: string): boolean => {
    const subfolders = allFolders.filter((f) => f.parent_id === folderId)
    const docs = allDocuments.filter((d) => d.folder_id === folderId)

    const folder = folderId !== null ? allFolders.find((f) => f.id === folderId) : null

    if (folder && folder.name.toLowerCase().includes(term)) return true
    if (docs.some((d) => d.name.toLowerCase().includes(term))) return true

    return subfolders.some((sub) => folderMatchesSearch(sub.id, term))
  }

  // =================== SIDEBAR TREE ===================================
  const renderFolderTree = (parentId: number | null = null, level = 0) => {
    const term = searchTerm.toLowerCase()

    const subfolders = allFolders.filter((f) => f.parent_id === parentId)
    const docs = allDocuments.filter((d) => d.folder_id === parentId)

    return (
      <div>
        {subfolders
          .filter((folder) => term === "" || folderMatchesSearch(folder.id, term))
          .map((folder) => {
            const shouldExpandBySearch = term !== "" && folderMatchesSearch(folder.id, term)
            const isExpanded = expandedFolders.includes(folder.id) || shouldExpandBySearch
            const isActive = currentFolder?.id === folder.id
            const isBeingDraggedOver = dragOverFolder === folder.id

            return (
              <div key={folder.id}>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer?.setData("text/plain", folder.id.toString())
                    setDraggingFolder(folder)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOverFolder(folder.id)
                  }}
                  onDragLeave={() => setDragOverFolder(null)}
                  onDrop={(e) => handleDropOnSidebarFolder(e, folder)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                    ${isActive ? "bg-yellow-500 text-white font-semibold shadow-sm" : "hover:bg-gray-100 text-gray-700"}
                    ${isBeingDraggedOver ? "bg-blue-100 border-2 border-blue-500" : ""}
                  `}
                  style={{ marginLeft: level * 16 }}
                  onDoubleClick={() => openFolder(folder)}
                >
                  {isExpanded ? (
                    <ChevronDown
                      size={16}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedFolders(expandedFolders.filter((id) => id !== folder.id))
                      }}
                    />
                  ) : (
                    <ChevronRight
                      size={16}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedFolders([...expandedFolders, folder.id])
                      }}
                    />
                  )}
                  <Folder className={`w-4 h-4 ${isActive ? "text-black" : "text-yellow-500"}`} />
                  <span className="truncate">{folder.name}</span>
                </div>

                {isExpanded && (
                  <div>
                    {renderFolderTree(folder.id, level + 1)}

                    {allDocuments
                      .filter((d) => d.folder_id === folder.id)
                      .filter((d) => term === "" || d.name.toLowerCase().includes(term))
                      .map((doc) => {
                        const Icon = /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.name) ? ImageIcon : File
                        return (
                          <div
                            key={doc.id}
                            draggable
                            onDragStart={() => setDraggingDocument(doc)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                            style={{ marginLeft: (level + 1) * 24 }}
                            onClick={() => setInfoModalDocument(doc)}
                          >
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="truncate w-40 text-gray-700">{doc.name}</span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}

        {/* DOCUMENTOS de raíz */}
        {parentId === null &&
          docs
            .filter((d) => term === "" || d.name.toLowerCase().includes(term))
            .map((doc) => {
              const Icon = /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.name) ? ImageIcon : File
              return (
                <div
                  key={doc.id}
                  draggable
                  onDragStart={() => setDraggingDocument(doc)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  style={{ marginLeft: 16 }}
                  onClick={() => setInfoModalDocument(doc)}
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="truncate w-40 text-gray-700">{doc.name}</span>
                </div>
              )
            })}
      </div>
    )
  }

  const renderMostUsedFolders = () => {
    if (mostUsedFolders.length === 0) return null

    return (
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={16} /> Más usadas
        </h3>
        <div className="space-y-1">
          {mostUsedFolders.map((folder) => {
            const isActive = currentFolder?.id === folder.id
            return (
              <div
                key={folder.id}
                draggable
                onDragStart={() => setDraggingFolder(folder)}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => handleDropOnSidebarFolder(e, folder)}
                onClick={() => openFolder(folder)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm
                  ${isActive ? "bg-yellow-500 text-white font-semibold" : "hover:bg-gray-100 text-gray-700"}
                `}
              >
                <Folder size={16} className={isActive ? "text-black" : "text-yellow-500"} />
                <span className="truncate">{folder.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // =================== DESCARGAR ===================================
  const downloadDocument = async (doc: DocumentType) => {
    try {
      const token = localStorage.getItem("auth_token")
      const backend = process.env.NEXT_PUBLIC_LARAVEL_URL
      if (!token || !backend) throw new Error("No hay token o backend")

      const res = await fetch(`${backend}/api/documents/${doc.id}/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      if (!res.ok) throw new Error("No se pudo descargar el archivo")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = doc.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error descargando documento:", error)
      alert("No se pudo descargar el archivo. ¿Estás loggeado?")
    }
  }

  const downloadFolder = async (folder: FolderType) => {
    try {
      const token = localStorage.getItem("auth_token")
      const backend = process.env.NEXT_PUBLIC_LARAVEL_URL
      if (!token || !backend) throw new Error("No hay token o backend")

      const res = await fetch(`${backend}/api/folders/${folder.id}/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      if (!res.ok) throw new Error("No se pudo descargar la carpeta")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `${folder.name}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error descargando carpeta:", error)
      alert("No se pudo descargar la carpeta. ¿Estás loggeado?")
    }
  }

  // =================== COPIAR ===================================
  const copySelectedItems = async () => {
    try {
      await Promise.all(
        selectedFolders.map(async (folderId) => {
          await fetchModel(`folders/${folderId}/copy`, {
            method: "POST",
            body: { parent_id: currentFolder?.id ?? null },
            credentials: "include",
          })
        }),
      )

      await Promise.all(
        selectedDocuments.map(async (docId) => {
          await fetchModel(`documents/${docId}/copy`, {
            method: "POST",
            body: { folder_id: currentFolder?.id ?? null },
            credentials: "include",
          })
        }),
      )

      setSelectedFolders([])
      setSelectedDocuments([])

      await loadAllData()
      await loadContent(currentFolder?.id ?? null)
    } catch (err) {
      console.error("Error copiando elementos:", err)
      alert("No se pudo copiar uno o más elementos.")
    }
  }

  // =================== EDITAR NOMBRE CARPETA ===================================
  const updateFolderName = async () => {
    if (!infoModalFolder) return
    if (!editFolderName.trim()) return alert("El nombre no puede estar vacío")

    try {
      await fetchModel(`folders/${infoModalFolder.id}`, {
        method: "PUT",
        body: { name: editFolderName },
        credentials: "include",
      })

      await loadAllData()
      await loadContent(currentFolder?.id ?? null)

      setInfoModalFolder(null)
    } catch (err) {
      console.error("Error renombrando carpeta:", err)
      alert("No se pudo renombrar la carpeta")
    }
  }

  // =================== EDITAR NOMBRE DOCUMENTO ===================================
  const updateDocumentName = async () => {
    if (!infoModalDocument) return
    if (!editDocumentName.trim()) return alert("El nombre no puede estar vacío")

    try {
      await fetchModel(`documents/${infoModalDocument.id}/rename`, {
        method: "PUT",
        body: { new_name: editDocumentName },
        credentials: "include",
      })

      await loadAllData()
      await loadContent(currentFolder?.id ?? null)

      setInfoModalDocument(null)
    } catch (err) {
      console.error("Error renombrando documento:", err)
      alert("No se pudo renombrar el documento")
    }
  }

  // ======================= RENDER GENERAL ===============================
  if (isLoading) return <p className="p-4">Cargando usuario...</p>
  if (!isAuthenticated) return <p className="p-4 text-red-500">Usuario no autenticado</p>

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="sidebar-scroll w-72 bg-white border-r shadow-sm p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Explorador</h2>

        {/* Buscador */}
        <Input
          placeholder="Buscar carpetas o documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        {renderFolderTree()}

        {renderMostUsedFolders()}
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* TOPBAR */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {currentFolder && (
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Atrás
              </Button>
            )}
            <h1 className="text-3xl font-semibold text-gray-800">
              {currentFolder ? currentFolder.name : "Mis Carpetas"}
            </h1>
          </div>
          {/* BREADCRUMBS */}
          <div className="flex items-center gap-1 text-gray-500 mb-4">
            <span
              className="cursor-pointer hover:text-gray-700"
              onClick={() => {
                setCurrentFolder(null)
                loadContent(null)
              }}
            >
              Inicio
            </span>

            {currentFolder && getBreadcrumbs().map((folder) => (
              <>
                <ChevronRight size={14} />
                <span
                  className="cursor-pointer hover:text-gray-700"
                  onDoubleClick={() => openFolder(folder)}
                >
                  {folder.name}
                </span>
              </>
            ))}
          </div>


          {/* BOTONES DERECHA */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nueva carpeta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-48"
            />
            <Button onClick={createFolder}>
              <Plus />
            </Button>

            <input type="file" id="uploadFiles" className="hidden" multiple onChange={handleFileUpload} />
            <Button onClick={() => document.getElementById("uploadFiles")?.click()}>
              <Upload />
            </Button>

            {(selectedFolders.length > 0 || selectedDocuments.length > 0) && (
              <Button variant="destructive" onClick={deleteSelectedItems}>
                <Trash2 className="w-4 h-4 mr-1" /> Borrar
              </Button>
            )}

            {(selectedFolders.length > 0 || selectedDocuments.length > 0) && (
              <Button onClick={copySelectedItems}>
                <Copy className="w-4 h-4 mr-1" /> Copiar
              </Button>
            )}
{/* 
            {(selectedFolders.length > 0 || selectedDocuments.length > 0) && (
              <Button
                onClick={() => {
                  selectedFolders.forEach((id) => {
                    const folder = folders.find((f) => f.id === id)
                    if (folder) downloadFolder(folder)
                  })
                  selectedDocuments.forEach((id) => {
                    const doc = documents.find((d) => d.id === id)
                    if (doc) downloadDocument(doc)
                  })
                }}
              >
                <Download className="w-4 h-4 mr-1" /> Descargar
              </Button>
            )} */}

            <div className="border-l pl-2 ml-2 flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 size={18} />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List size={18} />
              </Button>

              {/* Ordenamiento */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="name">Nombre</option>
                <option value="fecha">Fecha</option>
                <option value="tamaño">Tamaño</option>
                <option value="tipo">Tipo</option>
              </select>

              <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                <ArrowUpDown size={18} />
              </Button>
            </div>
          </div>
        </div>
        

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <p>Cargando...</p>
        ) : viewMode === "grid" ? (
          // GRID VIEW
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                draggable
                onDragStart={() => setDraggingFolder(folder)}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => handleDropOnFolder(e, folder)}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer relative group"
                onDoubleClick={() => openFolder(folder)}
              >
                <input
                  type="checkbox"
                  checked={selectedFolders.includes(folder.id)}
                  onChange={() => toggleSelectFolder(folder.id)}
                  className="absolute top-2 right-2 w-4 h-4"
                />
                <Folder className="w-12 h-12 text-yellow-500 mb-2" />
                <h3 className="font-semibold text-gray-800 truncate">{folder.name}</h3>
                <p className="text-sm text-gray-500">{new Date(folder.created_at).toLocaleDateString("es-ES")}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setInfoModalFolder(folder)
                  }}
                  className="absolute bottom-2 right-2 text-gray-600 hover:text-yellow-500"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            ))}

            {documents.map((doc) => (
              <div
                key={doc.id}
                draggable
                onDragStart={() => setDraggingDocument(doc)}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer relative group"
                onDoubleClick={() => downloadDocument(doc)}
              >
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={() => toggleSelectDocument(doc.id)}
                  className="absolute top-2 right-2 w-4 h-4"
                />
                <File className="w-12 h-12 text-blue-500 mb-2" />
                <h3 className="font-semibold text-gray-800 truncate">{doc.name}</h3>
                <p className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString("es-ES")}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setInfoModalDocument(doc)
                  }}
                  className="absolute bottom-2 right-2 text-gray-600 hover:text-yellow-500"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          // LIST VIEW
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        selectedFolders.length > 0 &&
                        selectedFolders.length === folders.length &&
                        selectedDocuments.length > 0 &&
                        selectedDocuments.length === documents.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFolders(folders.map((f) => f.id))
                          setSelectedDocuments(documents.map((d) => d.id))
                        } else {
                          setSelectedFolders([])
                          setSelectedDocuments([])
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {folders.map((folder) => (
                  <tr
                    key={`f-${folder.id}`}
                    draggable
                    onDragStart={() => setDraggingFolder(folder)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => handleDropOnFolder(e, folder)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedFolders.includes(folder.id)}
                        onChange={() => toggleSelectFolder(folder.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800" onDoubleClick={() => openFolder(folder)}>
                      <div className="flex items-center gap-2">
                        <Folder size={18} className="text-yellow-500" />
                        {folder.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Carpeta</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(folder.created_at).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setInfoModalFolder(folder)} className="text-gray-500 hover:text-gray-700">
                        <Info size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {documents.map((doc) => (
                  <tr
                    key={`d-${doc.id}`}
                    draggable
                    onDragStart={() => setDraggingDocument(doc)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleSelectDocument(doc.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      <div className="flex items-center gap-2">
                        <File size={18} className="text-blue-500" />
                        {doc.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{doc.name.split(".").pop()?.toUpperCase()}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(doc.created_at).toLocaleDateString("es-ES")}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setInfoModalDocument(doc)} className="text-gray-500 hover:text-gray-700">
                        <Info size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* INFO MODAL - CARPETA */}
      {infoModalFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Información de Carpeta</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nombre</label>
                <Input
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Creado</label>
                <p className="text-gray-600">{new Date(infoModalFolder.created_at).toLocaleDateString("es-ES")}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Última actualización</label>
                <p className="text-gray-600">{new Date(infoModalFolder.updated_at).toLocaleDateString("es-ES")}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={updateFolderName} className="flex-1">
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setInfoModalFolder(null)} className="flex-1">
                Cerrar
              </Button>
              <Button variant="outline" onClick={() => downloadFolder(infoModalFolder)}>
                <Download size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL - DOCUMENTO */}
      {infoModalDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Información de Documento</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nombre</label>
                <Input
                  value={editDocumentName}
                  onChange={(e) => setEditDocumentName(e.target.value)}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Creado</label>
                <p className="text-gray-600">{new Date(infoModalDocument.created_at).toLocaleDateString("es-ES")}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={updateDocumentName} className="flex-1">
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setInfoModalDocument(null)} className="flex-1">
                Cerrar
              </Button>
              <Button variant="outline" onClick={() => downloadDocument(infoModalDocument)}>
                <Download size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
