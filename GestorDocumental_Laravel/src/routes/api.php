<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Controladores existentes
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ExampleController;

// Nuevos controladores
use App\Http\Controllers\Api\FolderController;
use App\Http\Controllers\Api\DocumentController;

// 🔐 Autenticación (Laravel Breeze / Sanctum)
require __DIR__ . '/auth.php';

// ============================================
// 🔒 RUTAS PROTEGIDAS POR AUTH (Sanctum)
// ============================================
Route::middleware(['auth:sanctum'])->group(function () {

    // 👤 Usuarios
    Route::apiResource('users', UserController::class);

    // 👑 Solo admin
    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('permissions', PermissionController::class);
        Route::apiResource('roles', RoleController::class);
    });

    // ============================================
    // 📁 GESTOR DOCUMENTAL
    // ============================================

    // --- Carpetas ---
    Route::get('/folders/all', [FolderController::class, 'all']);
    Route::get('/folders/most-used', [FolderController::class, 'mostUsed']);
    Route::get('/folders', [FolderController::class, 'index']);

    Route::get('/folders/{id}', [FolderController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/folders', [FolderController::class, 'store']);
    Route::put('/folders/{id}', [FolderController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/folders/{id}', [FolderController::class, 'destroy'])->where('id', '[0-9]+');
    Route::patch('/folders/{id}/move', [FolderController::class, 'move']);
    Route::post('/folders/{id}/copy', [FolderController::class, 'copy']);
    Route::get('folders/{id}/download', [FolderController::class, 'download']);

    // --- Documentos ---
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{id}', [DocumentController::class, 'show'])->where('id', '[0-9]+');
    Route::get('/documents/{id}/download', [DocumentController::class, 'download'])->where('id', '[0-9]+');
    Route::get('/documents/{id}/preview', [DocumentController::class, 'preview'])->where('id', '[0-9]+');
    Route::patch('/documents/{id}/move', [DocumentController::class, 'move'])->where('id', '[0-9]+');
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy'])->where('id', '[0-9]+');
    Route::post('/documents/{id}/copy', [DocumentController::class, 'copy']);
    Route::put('/documents/{id}/rename', [DocumentController::class, 'rename'])->where('id', '[0-9]+');

    // Info del usuario autenticado
    Route::get('/me', function (Request $request) {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'permissions' => $user->permissions,
            ],
        ]);
    });

});

// ============================================
// 🌐 RUTAS PÚBLICAS
// ============================================
Route::middleware('api')->group(function () {
    Route::apiResource('examples', ExampleController::class);
});

// ============================================
// 🧹 LIMPIAR CACHÉ Y OPTIMIZAR
// ============================================
Route::get('/clear-cache', function () {
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    \Illuminate\Support\Facades\Artisan::call('route:cache');
    \Illuminate\Support\Facades\Artisan::call('config:cache');
    return 'Limpieza de caché + optimización correctos.';
});
