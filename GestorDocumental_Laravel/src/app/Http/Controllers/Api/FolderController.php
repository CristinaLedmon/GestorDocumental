<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Folder;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class FolderController extends Controller
{
    /**
     * Mostrar carpetas y documentos dentro de una carpeta padre
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $parentId = $request->query('folder_id'); // null = raíz

        $folders = Folder::where('user_id', $user->id)
            ->where('parent_id', $parentId)
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id', 'created_at']);

        $documents = Document::where('user_id', $user->id)
            ->where('folder_id', $parentId)
            ->orderBy('name')
            ->get(['id', 'name', 'file_path', 'folder_id', 'created_at'])
            ->map(function ($doc) {
                return array_merge($doc->toArray(), [
                    'url' => $doc->url,
                ]);
            });

        return response()->json([
            'folders' => $folders,
            'documents' => $documents,
        ]);
    }

    /**
     * Crear una nueva carpeta
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        if (!empty($validated['parent_id'])) {
            Folder::where('id', $validated['parent_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        $folder = Folder::create([
            'name' => $validated['name'],
            'parent_id' => $validated['parent_id'] ?? null,
            'user_id' => $user->id,
        ]);

        $path = $this->buildFolderPath($folder);
        Storage::disk('public')->makeDirectory("documents/{$path}");

        return response()->json($folder, 201);
    }

    /**
     * Mostrar carpeta con subcarpetas y documentos
     */
    public function show(string $id)
    {
        $user = Auth::user();

        $folder = Folder::with('children', 'documents')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $subfolders = $folder->children()->orderBy('name')->get(['id', 'name', 'parent_id', 'created_at']);
        $documents = $folder->documents()->orderBy('name')->get(['id', 'name', 'file_path', 'folder_id', 'created_at'])
            ->map(fn($doc) => array_merge($doc->toArray(), ['url' => $doc->url]));

        return response()->json([
            'folder' => $folder,
            'folders' => $subfolders,
            'documents' => $documents,
        ]);
    }

    /**
     * Renombrar o mover carpeta
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();

        $folder = Folder::with('parent')->where('id', $id)->where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        $oldPath = $this->buildFolderPath($folder);

        if (array_key_exists('parent_id', $validated)) {
            $newParentId = $validated['parent_id'];
            if ($newParentId === $folder->id) {
                return response()->json(['message' => 'No puedes mover una carpeta dentro de sí misma.'], 422);
            }

            if ($newParentId) {
                $parent = Folder::where('id', $newParentId)->where('user_id', $user->id)->firstOrFail();
                $current = $parent;
                while ($current) {
                    if ($current->id === $folder->id) {
                        return response()->json(['message' => 'Movimiento inválido: crearía un ciclo.'], 422);
                    }
                    $current = $current->parent;
                }
            }

            $folder->parent_id = $newParentId;
        }

        if (array_key_exists('name', $validated)) {
            $folder->name = $validated['name'];
        }

        $folder->save();

        // Actualizar carpeta física en storage
        $newPath = $this->buildFolderPath($folder);
        $oldStoragePath = "documents/{$oldPath}";
        $newStoragePath = "documents/{$newPath}";
        if ($oldPath !== $newPath) {
            if (Storage::disk('public')->exists($oldStoragePath)) {
                Storage::disk('public')->move($oldStoragePath, $newStoragePath);
            } else {
                Storage::disk('public')->makeDirectory($newStoragePath);
            }
        }

        return response()->json($folder);
    }

    /**
     * Eliminar carpeta
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $folder = Folder::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $path = $this->buildFolderPath($folder);

        // Borrar carpeta física con todos sus archivos
        Storage::disk('public')->deleteDirectory("documents/{$path}");

        // Borrar registro de carpeta y recursivamente subcarpetas y documentos
        $folder->delete();

        return response()->json(['message' => 'Carpeta eliminada correctamente']);
    }


    /**
     * Construye la ruta completa de la carpeta
     */
    private function buildFolderPath(Folder $folder)
    {
        $path = [$folder->name];
        $parent = $folder->parent;
        while ($parent instanceof Folder) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }
        return implode('/', $path);
    }

    /**
     * Devuelve árbol completo de carpetas y documentos
     */
    public function tree()
    {
        $user = Auth::user();

        // CORRECCIÓN: cargar relación 'parent'
        $folders = Folder::with('parent')->where('user_id', $user->id)->orderBy('name')->get();
        $documents = Document::where('user_id', $user->id)->orderBy('name')->get();

        $foldersArr = $folders->map(fn($f) => [
            'id' => $f->id,
            'name' => $f->name,
            'parent_id' => $f->parent_id,
            'created_at' => $f->created_at,
            'full_path' => $f->full_path,
        ])->toArray();

        $documentsArr = $documents->map(fn($d) => [
            'id' => $d->id,
            'name' => $d->name,
            'file_path' => $d->file_path,
            'folder_id' => $d->folder_id,
            'created_at' => $d->created_at,
            'url' => $d->url,
        ])->toArray();

        $buildTree = function ($parentId) use (&$buildTree, $foldersArr, $documentsArr) {
            $nodes = [];
            foreach ($foldersArr as $f) {
                if ($f['parent_id'] === $parentId) {
                    $children = $buildTree($f['id']);
                    $docs = array_values(array_filter($documentsArr, fn($d) => $d['folder_id'] === $f['id']));
                    $nodes[] = array_merge($f, [
                        'children' => $children,
                        'documents' => $docs,
                    ]);
                }
            }
            return $nodes;
        };

        $tree = $buildTree(null);

        return response()->json([
            'tree' => $tree,
            'folders_count' => count($foldersArr),
            'documents_count' => count($documentsArr),
        ]);
    }

    /**
     * Devuelve todas las carpetas del usuario en forma plana
     */
    public function all()
    {
        $user = Auth::user();

        $folders = Folder::with('parent')
            ->where('user_id', $user->id)
            ->orderBy('name')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'parent_id' => $f->parent_id,
                'created_at' => $f->created_at,
                'full_path' => $f->full_path,
            ]);

        return response()->json(['folders' => $folders]);
    }


    public function move(Request $request, string $id)
    {
        $user = Auth::user();

        $folder = Folder::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:folders,id'
        ]);

        $newParent = null;
        if (!empty($validated['parent_id'])) {
            $newParent = Folder::where('id', $validated['parent_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        // Construir nueva ruta en storage
        $oldPath = $folder->full_path;
        $newPath = $newParent ? "{$newParent->full_path}/{$folder->name}" : $folder->name;

        // Mover contenido en storage
        Storage::disk('public')->move("documents/$oldPath", "documents/$newPath");

        // Actualizar BD
        $folder->update([
            'parent_id' => $newParent->id ?? null
        ]);

        return response()->json(['message' => 'Carpeta movida correctamente']);
    }

    public function copy(Request $request, string $id)
    {
        $user = Auth::user();
        $folder = Folder::with('documents', 'children')->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        $newParent = null;
        if (!empty($validated['parent_id'])) {
            $newParent = Folder::where('id', $validated['parent_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        // Crear nueva carpeta en BD
        $newFolder = Folder::create([
            'name' => $folder->name . ' - copia',
            'parent_id' => $newParent->id ?? null,
            'user_id' => $user->id,
        ]);

        // Copiar documentos
        foreach ($folder->documents as $doc) {
            $newFileName = pathinfo($doc->name, PATHINFO_FILENAME) . ' - copia.' . pathinfo($doc->name, PATHINFO_EXTENSION);
            $newPath = ($newParent ? $newParent->full_path : '') . '/' . $newFolder->name . '/' . $newFileName;

            Storage::disk('public')->copy($doc->file_path, "documents/{$newPath}");

            Document::create([
                'user_id' => $user->id,
                'folder_id' => $newFolder->id,
                'name' => $newFileName,
                'file_path' => "documents/{$newPath}",
            ]);
        }

        // Recursividad para subcarpetas
        foreach ($folder->children as $child) {
            $request->merge(['parent_id' => $newFolder->id]);
            $this->copy($request, $child->id);
        }

        return response()->json([
            'message' => 'Carpeta copiada correctamente',
            'folder' => $newFolder,
        ]);
    }

   public function download(Request $request, string $id)
{
    // ------------------- AUTENTICACIÓN -------------------
    $token = $request->query('token');

    if ($token) {
        // Buscar usuario por token (asegúrate de tener api_token en users)
        $user = \App\Models\User::where('api_token', $token)->first();
        if (!$user) {
            return response()->json(['message' => 'Token inválido'], 401);
        }
        Auth::login($user);
    } else {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }
    }

    // ------------------- OBTENER CARPETA -------------------
    $folder = Folder::where('id', $id)
        ->where('user_id', $user->id)
        ->firstOrFail();

    $folderPath = $folder->full_path;
    $storagePath = Storage::disk('public')->path("documents/{$folderPath}");

    if (!file_exists($storagePath)) {
        return response()->json(['message' => 'Carpeta no encontrada'], 404);
    }

    // ------------------- CREAR ZIP -------------------
    $tempDir = storage_path('app/public/temp');
    if (!file_exists($tempDir)) {
        mkdir($tempDir, 0777, true);
    }

    $zipFileName = preg_replace('/[^\w\-\.]/', '_', $folder->name) . '.zip';
    $zipPath = $tempDir . "/{$zipFileName}";

    $zip = new \ZipArchive();
    if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
        return response()->json(['message' => 'Error creando zip'], 500);
    }

    // Iterar sobre archivos y subcarpetas recursivamente
    $files = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($storagePath, \FilesystemIterator::SKIP_DOTS)
    );

    foreach ($files as $file) {
        if (!$file->isDir()) {
            $filePath = $file->getRealPath();
            // Ruta relativa dentro del ZIP
            $relativePath = substr($filePath, strlen($storagePath) + 1);
            $zip->addFile($filePath, $relativePath);
        }
    }

    $zip->close();

    // ------------------- RETORNAR ZIP -------------------
    return response()->download($zipPath)->deleteFileAfterSend(true);
}







}


