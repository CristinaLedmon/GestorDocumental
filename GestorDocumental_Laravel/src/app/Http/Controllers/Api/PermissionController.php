<?php

namespace App\Http\Controllers\Api;

use App\Dto\PermissionDto;
use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    protected $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }


    /**
     * Listado de los permisos.
     * Dependencia -> (Spatie Laravel)
     */
    public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        return PermissionResource::collection($this->permissionService->getAllPermissions());
    }

    /**
     * Creación de un nuevo permiso.
     * Dependencia -> (Spatie Laravel)
     */
    public function store(Request $request): PermissionResource
    {
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'name.unique' => 'Ya existe un permiso con este nombre.',
        ]);

        $permissionDto = new PermissionDto($validatedData);

        $permission = $this->permissionService->createPermission($permissionDto);

        return new PermissionResource($permission);
    }

    /**
     * Mostrar el permiso existente.
     * Dependencia -> (Spatie Laravel)
     */
    public function show(Permission $permission): PermissionResource
    {
        return new PermissionResource($permission);
    }

    /**
     * Actualizado de un permiso.
     * Dependencia -> (Spatie Laravel)
     */
    public function update(Request $request, Permission $permission): PermissionResource
    {
        $validatedData = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:permissions,name,' . $permission->id],
        ], [
            'name.unique' => 'Ya existe un permiso con este nombre.',
        ]);

        $permissionDto = new PermissionDto($validatedData);

        $permission = $this->permissionService->updatePermission($permission, $permissionDto);

        return new PermissionResource($permission);
    }

    /**
     * Eliminación de un permiso
     * Dependencia -> (Spatie Laravel)
     */
    public function destroy(Permission $permission)
    {
        return response()->json(['success' => $this->permissionService->destroyPermission($permission)]);
    }
}
