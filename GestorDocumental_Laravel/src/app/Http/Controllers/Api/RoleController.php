<?php

namespace App\Http\Controllers\Api;

use App\Dto\RoleDto;
use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Services\RoleService;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    protected $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    /**
     * Listado de los roles.
     * Dependencia -> (Spatie Laravel)
     */
    public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        return RoleResource::collection($this->roleService->getAllRoles());
    }

    /**
     * Creación de un nuevo rol.
     * Dependencia -> (Spatie Laravel)
     */
    public function store(Request $request): RoleResource
    {
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['array', 'exists:permissions,name']
        ], [
            'name.string' => 'El nombre debe ser una cadena de caracteres.',
            'name.unique' => 'El nombre de este rol ya esta en uso.',
            'permissions.exists' => 'Los permisos introducidos no existen en el sistema.',
        ]);

        $roleDto = new RoleDto($validatedData);

        $role = $this->roleService->createRole($roleDto);

        return new RoleResource($role);
    }

    /**
     * Mostrar el rol existente.
     * Dependencia -> (Spatie Laravel)
     */
    public function show(Role $role): RoleResource
    {
        return new RoleResource($role->load('permissions'));
    }

    /**
     * Actualizado de un rol.
     * Dependencia -> (Spatie Laravel)
     */
    public function update(Request $request, Role $role): RoleResource
    {
        $validatedData = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions' => ['array'], // Permisos opcionales
            'permissions.*' => ['exists:permissions,name'], // Verifica que existan los permisos
        ]);

        $roleDto = new RoleDto($validatedData);

        $updatedRole = $this->roleService->updateRole($role, $roleDto);

        return new RoleResource($updatedRole);
    }

    /**
     * Eliminación de un rol
     * Dependencia -> (Spatie Laravel)
     */
    public function destroy(Role $role)
    {
        return response()->json(['success' => $this->roleService->destroyRole($role)]);
    }
}
