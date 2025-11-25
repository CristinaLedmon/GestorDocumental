<?php

namespace App\Services;

use App\Dto\RoleDto;
use Spatie\Permission\Models\Role;

class RoleService
{
    public function getAllRoles()
    {
        return Role::with('permissions')->get();
    }

    public function createRole(RoleDto $data): Role
    {
        $role = Role::create([
            'name' => $data->name,
            'guard_name' => 'web'
        ]);

        // Asignar permisos si se proporcionan
        if (!empty($data->permissions)) {
            $role->syncPermissions($data->permissions);
        }

        return $role;
    }

    public function updateRole(Role $role, RoleDto $data): Role
    {
        // Actualizar el rol
        if (!empty($data->name)) {
            $role->update(['name' => $data->name]);
        }

        // Actualizar permisos si se proporcionan
        if (isset($data->permissions)) {
            $role->syncPermissions($data->permissions);
        }

        return $role;
    }

    public function destroyRole(Role $role): bool
    {

        // Desvincular permisos del rol
        $role->syncPermissions([]);

        return $role->delete() ?? false;
    }
}
