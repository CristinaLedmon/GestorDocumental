"use client"

import React, { useEffect, useState } from "react"
import fetchModel from "@/lib/fetch-utils"
import useAuth from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {Folder,File,Image,ArrowLeft,ChevronRight,ChevronDown,Plus,Upload,Trash2,Info, Copy, Download} from "lucide-react"

// ========================INTERFACES==============================
interface FolderType {
  id: number
  name: string
  parent_id: number | null
  created_at: string
  full_path?: string
}

interface DocumentType {
  id: number
  name: string
  file_path: string
  folder_id: number | null
  created_at: string
}

// ====================DOCUMENT ITEM ==================================
const DocumentItem: React.FC<{
  doc: DocumentType
  toggleSelect: (id: number) => void
  selected: boolean
  setDraggingDocument: (doc: DocumentType | null) => void
}> = ({ doc, toggleSelect, selected, setDraggingDocument }) => {
  const isImage = /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.name)
  const IconComponent = isImage ? Image : File

  const openDocument = () => {
    const backend = process.env.NEXT_PUBLIC_LARAVEL_URL
    if (backend) window.open(`${backend}/storage/${doc.file_path}`, "_blank")
  }

  return (
    <div
      className="relative"
      draggable
      onDragStart={() => setDraggingDocument(doc)}
      onDragEnd={() => setDraggingDocument(null)}
    >
      <div
        className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
        onDoubleClick={openDocument}
      >
        <IconComponent className="w-10 h-10 mb-2 text-gray-500" />
        <p className="truncate text-sm font-medium text-gray-800">{doc.name}</p>

        <div className="absolute top-2 right-2 flex gap-1">
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleSelect(doc.id)}
            className="w-4 h-4 accent-yellow-500 border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
          />

        </div>
      </div>
    </div>
  )
}

// =====================PÁGINA PRINCIPAL =================================
export default function FoldersPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const [folders, setFolders] = useState<FolderType[]>([])
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [allFolders, setAllFolders] = useState<FolderType[]>([])
  const [allDocuments, setAllDocuments] = useState<DocumentType[]>([])
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null)

  const [loading, setLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<number[]>([])
  const [selectedFolders, setSelectedFolders] = useState<number[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([])

  // MODALES
  const [infoModalFolder, setInfoModalFolder] = useState<FolderType | null>(null)
  const [infoModalDocument, setInfoModalDocument] = useState<DocumentType | null>(null)

  // DRAG & DROP
  const [draggingFolder, setDraggingFolder] = useState<FolderType | null>(null)
  const [draggingDocument, setDraggingDocument] = useState<DocumentType | null>(null)

  //buscador
  const [searchTerm, setSearchTerm] = useState("")


  // ====================== LOAD DATA ================================
  const loadAllData = async () => {
    try {
      const resFolders = await fetchModel("folders/all", { credentials: "include" })
      const payloadFolders = Array.isArray(resFolders.data) ? resFolders.data[0] : resFolders
      setAllFolders(payloadFolders.folders ?? [])

      const resDocs = await fetchModel("documents", { credentials: "include" })
      const payloadDocs = Array.isArray(resDocs.data) ? resDocs.data[0] : resDocs
      setAllDocuments(payloadDocs.documents ?? [])
    } catch (err) {
      console.error("Error cargando todos los datos:", err)
    }
  }

  const loadContent = async (folderId: number | null = null) => {
    try {
      setLoading(true)
      const res = await fetchModel(`folders?folder_id=${folderId ?? ""}`, { credentials: "include" })
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

  // ================== CREAR CARPETA ====================================
  const createFolder = async () => {
    if (!newFolderName.trim()) return

    await fetchModel("folders", {
      method: "POST",
      body: { name: newFolderName, parent_id: currentFolder?.id ?? null },
      credentials: "include"
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

    const parent = allFolders.find(f => f.id === currentFolder.parent_id) ?? null
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
          credentials: "include"
        })
      })
    )

    await loadAllData()
    await loadContent(folderId)
  }

  // ======================= SELECCIÓN ===============================
  const toggleSelectFolder = (id: number) => {
    setSelectedFolders((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectDocument = (id: number) => {
    setSelectedDocuments((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // ====================== BORRAR ================================
  const deleteSelectedItems = async () => {
    await Promise.all([
      ...selectedFolders.map(async id => {
        await fetchModel(`folders/${id}`, { method: "DELETE", credentials: "include" })
      }),
      ...selectedDocuments.map(async id => {
        await fetchModel(`documents/${id}`, { method: "DELETE", credentials: "include" })
      })
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

  // ===================== DRAG & DROP: MOVER CARPETAS =================================
  const moveFolder = async (folderId: number, newParentId: number | null) => {
    await fetchModel(`folders/${folderId}/move`, {
      method: "PATCH",
      body: { parent_id: newParentId },
      credentials: "include"
    })

    await loadAllData()
    await loadContent(currentFolder?.id ?? null)
  }

  // ===================== DRAG & DROP: MOVER DOCUMENTOS =================================
  const moveDocument = async (documentId: number, newFolderId: number | null) => {
    await fetchModel(`documents/${documentId}/move`, {
      method: "PATCH",
      body: { folder_id: newFolderId },
      credentials: "include"
    })

    await loadAllData()
    await loadContent(currentFolder?.id ?? null)
  }


  // =================== FUNCION PARA FILTRAR RECURSIVAMENTE ===================================

  // Retorna true si:
  // - La carpeta coincide
  // - Algún documento dentro (cualquier nivel) coincide
  // - Alguna subcarpeta dentro coincide
  const folderMatchesSearch = (folderId: number | null, term: string): boolean => {
    const subfolders = allFolders.filter(f => f.parent_id === folderId)
    const docs = allDocuments.filter(d => d.folder_id === folderId)

  const folder = folderId !== null ? allFolders.find(f => f.id === folderId) : null

    if (folder && folder.name.toLowerCase().includes(term)) return true
    if (docs.some(d => d.name.toLowerCase().includes(term))) return true

    return subfolders.some(sub => folderMatchesSearch(sub.id, term))
  }



  // =================== SIDEBAR TREE ===================================
  const renderFolderTree = (parentId: number | null = null, level = 0) => {
        const term = searchTerm.toLowerCase()

        const subfolders = allFolders.filter(f => f.parent_id === parentId)
        const docs = allDocuments.filter(d => d.folder_id === parentId)

        return (
          <div>
            {subfolders
              .filter(folder => term === "" || folderMatchesSearch(folder.id, term))
              .map(folder => {
                const shouldExpandBySearch = term !== "" && folderMatchesSearch(folder.id, term)
                const isExpanded = expandedFolders.includes(folder.id) || shouldExpandBySearch
                const isActive = currentFolder?.id === folder.id

                return (
                  <div key={folder.id}>
                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                        ${isActive ? "bg-yellow-500 text-white-700 font-semibold shadow-sm" : "hover:bg-gray-100 text-gray-700"}`} //subraya en sidebar la carpeta actual
                      style={{ marginLeft: level * 16 }}
                      onDoubleClick={() => openFolder(folder)}
                    >
                      {isExpanded ? (
                        <ChevronDown
                          size={16}
                          onClick={e => {
                            e.stopPropagation()
                            setExpandedFolders(expandedFolders.filter(id => id !== folder.id))
                          }}
                        />
                      ) : (
                        <ChevronRight
                          size={16}
                          onClick={e => {
                            e.stopPropagation()
                            setExpandedFolders([...expandedFolders, folder.id])
                          }}
                        />
                      )}
                      <Folder className={`w-4 h-4 ${isActive ? "text-black-600" : "text-yellow-500"}`} />    {/* esto cambia de color el icono folder del sidebar */}
                      <span>{folder.name}</span>
                    </div>

                    {isExpanded && (
                      <div>
                        {renderFolderTree(folder.id, level + 1)}

                        {allDocuments
                          .filter(d => d.folder_id === folder.id)
                          .filter(d => term === "" || d.name.toLowerCase().includes(term))
                          .map(doc => {
                            const Icon = /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.name) ? Image : File
                            return (
                              <div
                                key={doc.id}
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
                .filter(d => term === "" || d.name.toLowerCase().includes(term))
                .map(doc => {
                  const Icon = /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.name) ? Image : File
                  return (
                    <div
                      key={doc.id}
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


  // =================== DESCARGA DOCUMENTOS ===================================

const downloadDocument = async (doc: DocumentType) => {
  try {
    // fetchModel con GET normal, pero pedimos raw Response
    const token = localStorage.getItem("auth_token");
    const backend = process.env.NEXT_PUBLIC_LARAVEL_URL;
    if (!token || !backend) throw new Error("No hay token o backend");

    const res = await fetch(`${backend}/api/documents/${doc.id}/download`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: "include"
    });

    if (!res.ok) throw new Error("No se pudo descargar el archivo");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error descargando documento:", error);
    alert("No se pudo descargar el archivo. ¿Estás loggeado?");
  }
};


  // =================== DESCARGA CARPETAS ===================================
  const downloadFolder = async (folder: FolderType) => {
  try {
    const token = localStorage.getItem("auth_token");
    const backend = process.env.NEXT_PUBLIC_LARAVEL_URL;
    if (!token || !backend) throw new Error("No hay token o backend");

    const res = await fetch(`${backend}/api/folders/${folder.id}/download`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: "include"
    });

    if (!res.ok) throw new Error("No se pudo descargar la carpeta");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${folder.name}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error descargando carpeta:", error);
    alert("No se pudo descargar la carpeta. ¿Estás loggeado?");
  }
};







  // =================== FUNCION DE COPIAR ===================================
  const copySelectedItems = async () => {
    try {
      // Copiar carpetas seleccionadas
      await Promise.all(
        selectedFolders.map(async (folderId) => {
          await fetchModel(`folders/${folderId}/copy`, {
            method: "POST",
            body: { parent_id: currentFolder?.id ?? null }, // copiar en la carpeta actual
            credentials: "include",
          });
        })
      );

      // Copiar documentos seleccionados
      await Promise.all(
        selectedDocuments.map(async (docId) => {
          await fetchModel(`documents/${docId}/copy`, { // debes crear la ruta copy en DocumentController
            method: "POST",
            body: { folder_id: currentFolder?.id ?? null },
            credentials: "include",
          });
        })
      );

      // Limpiar selección
      setSelectedFolders([]);
      setSelectedDocuments([]);

      // Recargar datos
      await loadAllData();
      await loadContent(currentFolder?.id ?? null);

    } catch (err) {
      console.error("Error copiando elementos:", err);
      alert("No se pudo copiar uno o más elementos.");
    }
  };


  // ======================= RENDER GENERAL ===============================
  if (isLoading) return <p className="p-4">Cargando usuario...</p>
  if (!isAuthenticated) return <p className="p-4 text-red-500">Usuario no autenticado</p>




  // ======================= RETURN ===============================


  return (
    <div className="flex h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside className="sidebar-scroll w-72 bg-white border-r shadow-sm p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Explorador</h2>

        {/* buscador */}
        <Input
          placeholder="Buscar carpetas o documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />


        {renderFolderTree()}
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

          {/* BOTONES DERECHA */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nueva carpeta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-48"
            />
            <Button onClick={createFolder}><Plus /></Button>

            <input
              type="file"
              id="uploadFiles"
              className="hidden"
              multiple
              onChange={handleFileUpload}
            />
            <Button onClick={() => document.getElementById("uploadFiles")?.click()}>
              <Upload />
            </Button>

            {(selectedFolders.length > 0 || selectedDocuments.length > 0) && (
              <Button variant="destructive" onClick={deleteSelectedItems}>
                <Trash2 className="w-4 h-4 mr-1" /> Borrar
              </Button>
          

            )}

            {/* COPIAR (barra superior) */}

            {(selectedFolders.length > 0 || selectedDocuments.length > 0) && (
              <Button
                onClick={copySelectedItems}
                className="bg-yellow-500 text-white hover:bg-yellow-600"
              >
              <Copy className="w-4 h-4 mr-1" /> Copiar
              </Button>
            )}



            {/* INFO Y DESCARGAR (barra superior) */}
            {selectedFolders.length > 0 && (() => {
              const selectedFolder = allFolders.find(f => f.id === selectedFolders[0]) ?? null;
              if (!selectedFolder) return null;

              return (
                <>
                  <Button
                    onClick={() => setInfoModalFolder(selectedFolder)}
                  >
                    <Info className="w-4 h-4 mr-1" /> Info
                  </Button>

                  <Button
                    onClick={() => {
                      downloadFolder(selectedFolder); // función que descarga la carpeta como ZIP
                      setSelectedFolders([]);         // opcional: deselecciona carpeta
                    }}
     
                    
                  >
                    <Download className="w-4 h-4 mr-1" /> Descargar
                  </Button>
                </>
              );
            })()}


            {selectedDocuments.length > 0 && (
              <>
                <Button
                  onClick={() => {
                    const selectedDoc = allDocuments.find(d => d.id === selectedDocuments[0]) ?? null;
                    if (selectedDoc) setInfoModalDocument(selectedDoc);
                  }}
                >
                  <Info className="w-4 h-4 mr-1" /> Info
                </Button>

                <Button
                  onClick={() => {
                    const selectedDoc = allDocuments.find(d => d.id === selectedDocuments[0]) ?? null;
                    if (selectedDoc) {
                      downloadDocument(selectedDoc); // llama a la descarga
                      setSelectedDocuments([]);       // deselecciona el documento
                    }
                  }}

                  >
                    <Download className="w-4 h-4 mr-1" /> Descargar
                </Button>
              </>
            )}

          </div>
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
            <React.Fragment key={folder.id}>
              <ChevronRight size={14} />
              <span
                className="cursor-pointer hover:text-gray-700"
                onDoubleClick={() => openFolder(folder)}
              >
                {folder.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* GRID */}
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-6">

            {/* ==== CARPETAS EN GRID ==== */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="relative p-4 bg-white border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all"

                draggable
                onDragStart={() => setDraggingFolder(folder)}
                onDragEnd={() => setDraggingFolder(null)}

                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  // MOVER CARPETA DENTRO DE OTRA
                  if (draggingFolder && draggingFolder.id !== folder.id) {
                    moveFolder(draggingFolder.id, folder.id)
                  }

                  // MOVER DOCUMENTO A UNA CARPETA
                  if (draggingDocument) {
                    moveDocument(draggingDocument.id, folder.id)
                  }
                }}

                onDoubleClick={() => openFolder(folder)}
              >
                <Folder className="w-12 h-12 text-yellow-500 mb-2" />
                <p className="truncate font-medium text-gray-800">{folder.name}</p>

                <div className="absolute top-2 right-2 flex gap-1">
                  <input
                    type="checkbox"
                    checked={selectedFolders.includes(folder.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelectFolder(folder.id)}
                    className="w-4 h-4 accent-yellow-500 border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"

                  />
                </div>
                     
              </div>
            ))}

            {/* ==== DOCUMENTOS EN GRID ==== */}
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                selected={selectedDocuments.includes(doc.id)}
                toggleSelect={toggleSelectDocument}
                setDraggingDocument={setDraggingDocument}
              />
            ))}
          </div>
        )}

       {/* MODAL INFO CARPETA */}
        {infoModalFolder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto break-words relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                onClick={() => {
                  setInfoModalFolder(null)
                  setSelectedFolders([]) // deselecciona carpeta
                }}                
              >
                ✖
              </button>

              <h3 className="text-xl font-semibold mb-4">Información de la carpeta</h3>

              <p><strong>Nombre:</strong> {infoModalFolder.name}</p>
              <p><strong>ID:</strong> {infoModalFolder.id}</p>
              <p><strong>Creada:</strong> {infoModalFolder.created_at}</p>
              <p><strong>Padre:</strong> {infoModalFolder.parent_id ?? "Ninguno"}</p>
            </div>
          </div>
        )}


     {/* MODAL INFO DOCUMENTO */}
      {infoModalDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto break-words relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => {
                setInfoModalDocument(null)
                setSelectedDocuments([]) // deselecciona documento
              }}
            >
              ✖
            </button>

            <h3 className="text-xl font-semibold mb-4">Información del documento</h3>

            <p><strong>Nombre:</strong> {infoModalDocument.name}</p>
            <p><strong>ID:</strong> {infoModalDocument.id}</p>
            <p><strong>Creado:</strong> {infoModalDocument.created_at}</p>
            <p><strong>Carpeta:</strong> {infoModalDocument.folder_id ?? "Ninguna"}</p>

            <p>
              <strong>Ruta:</strong>{" "}
              <a
                href={`${process.env.NEXT_PUBLIC_LARAVEL_URL}/storage/${infoModalDocument.file_path}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline break-all"
              >
                Abrir
              </a>
            </p>
          </div>
        </div>
      )}


      </main>
    </div>
  )
}
