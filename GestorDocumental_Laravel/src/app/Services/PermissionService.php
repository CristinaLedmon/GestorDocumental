<?php

namespace App\Services;

use App\Dto\PermissionDto;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Permission;

class PermissionService
{
    public function getAllPermissions(): Collection
    {
        return Permission::all();
    }

    public function createPermission(PermissionDto $data): Permission
    {
        $permission = Permission::create([
            'name' => $data->name,
            'guard_name' => 'web'
        ]);

        return $permission;
    }

    public function updatePermission(Permission $permission, PermissionDto $data): Permission
    {
        $permission->update([
            'name' => $data->name ?? $permission->name,
        ]);

        return $permission;
    }

    public function destroyPermission(Permission $permission): bool
    {
        // Desvincular roles de permiso
        $permission->syncRoles([]);

        return $permission->delete() ?? false;
    }
}
