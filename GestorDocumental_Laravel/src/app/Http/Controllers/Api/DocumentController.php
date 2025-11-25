<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;
use App\Models\Folder;

class DocumentController extends Controller
{
    /**
     * Listar todos los documentos del usuario.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $documents = Document::where('user_id', $user->id)
            ->orderBy('name')
            ->get(['id','name','file_path','folder_id','created_at'])
            ->map(fn($doc) => array_merge($doc->toArray(), [
                'url' => $doc->url,
                'folder_full_path' => $doc->folder?->full_path ?? null,
            ]));

        return response()->json(['documents' => $documents]);
    }

    /**
     * Subir documento al storage público.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'file' => 'required|file|max:51200', // 50 MB
            'folder_id' => 'nullable|exists:folders,id',
        ]);

        $folder = null;
        if (!empty($validated['folder_id'])) {
            $folder = Folder::where('id', $validated['folder_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        $file = $validated['file'];
        $folderPath = rtrim($this->buildFolderPath($folder), '/'); // normaliza la carpeta

        $storePath = $folderPath ? "documents/{$folderPath}" : "documents"; // evita doble slash
        $path = $file->store($storePath, 'public');

        $document = Document::create([
            'user_id' => $user->id,
            'folder_id' => $folder->id ?? null,
            'name' => $file->getClientOriginalName(),
            'file_path' => $path,
        ]);

        return response()->json(array_merge($document->toArray(), [
            'url' => $document->url,
            'folder_full_path' => $folder?->full_path ?? null,
        ]), 201);
    }

    private function buildFolderPath(?Folder $folder)
    {
        if (!$folder) return '';
        $parts = [];
        while ($folder) {
            array_unshift($parts, $folder->name);
            $folder = $folder->parent;
        }
        return implode('/', $parts);
    }

    public function preview(string $id)
    {
        $user = Auth::user();
        $document = Document::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }

        $path = Storage::disk('public')->path($document->file_path);
        $mime = Storage::disk('public')->mimeType($document->file_path);

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.$document->name.'"'
        ]);
    }

    public function download(string $id)
    {
        $user = Auth::user();
        $document = Document::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }

        return Storage::disk('public')->download($document->file_path, $document->name);
    }

    public function move(Request $request, string $id)
    {
        $user = Auth::user();
        $document = Document::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'folder_id' => 'nullable|exists:folders,id',
        ]);

        $newFolder = null;
        if (!empty($validated['folder_id'])) {
            $newFolder = Folder::where('id', $validated['folder_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        $oldPath = $document->file_path;
        $newFolderPath = rtrim($this->buildFolderPath($newFolder), '/'); // normaliza la carpeta
        $newPath = $newFolderPath ? "documents/{$newFolderPath}/{$document->name}" : "documents/{$document->name}";


        Storage::disk('public')->move($oldPath, $newPath);

        $document->update([
            'folder_id' => $newFolder->id ?? null,
            'file_path' => $newPath,
        ]);

        return response()->json(array_merge($document->toArray(), [
            'url' => $document->url,
            'folder_full_path' => $newFolder?->full_path ?? null,
        ]));
    }

    public function destroy(string $id)
    {
        $user = Auth::user();
        $document = Document::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();
        return response()->json(['message' => 'Documento eliminado correctamente']);
    }


    public function show(string $id)
    {
        $user = Auth::user();
        $document = Document::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        return response()->json([
            'id' => $document->id,
            'name' => $document->name,
            'file_path' => $document->file_path,
            'folder_id' => $document->folder_id,
            'url' => $document->url,
            'folder_full_path' => $document->folder?->full_path ?? null,
        ]);
    }

    public function copy(Request $request, string $id)
    {
        $user = Auth::user();
        $document = Document::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $validated = $request->validate([
            'folder_id' => 'nullable|exists:folders,id',
        ]);

        $newFolder = null;
        if (!empty($validated['folder_id'])) {
            $newFolder = Folder::where('id', $validated['folder_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        // Copiar archivo físico
        $oldPath = $document->file_path;
        $newFileName = pathinfo($document->name, PATHINFO_FILENAME) . ' - copia.' . pathinfo($document->name, PATHINFO_EXTENSION);
        $newFolderPath = rtrim($this->buildFolderPath($newFolder), '/');
        $newPath = $newFolderPath ? "documents/{$newFolderPath}/{$newFileName}" : "documents/{$newFileName}";

        Storage::disk('public')->copy($oldPath, $newPath);

        // Crear nuevo registro en DB
        $newDocument = Document::create([
            'user_id' => $user->id,
            'folder_id' => $newFolder->id ?? null,
            'name' => $newFileName,
            'file_path' => $newPath,
        ]);

        return response()->json([
            'message' => 'Documento copiado correctamente',
            'document' => $newDocument,
        ]);
    }




}
