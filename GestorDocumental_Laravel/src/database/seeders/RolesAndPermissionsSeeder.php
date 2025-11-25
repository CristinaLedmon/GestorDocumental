<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Crear roles
        $adminRole = Role::create(['name' => 'admin']);
        $guestRole = Role::create(['name' => 'guest']);

        // Crear permisos para las secciones
        $permissions = [
            'read_home',
            'write_home',
            'read_users',
            'write_users',
            'read_roles',
            'write_roles',
            'read_permissions',
            'write_permissions',
        ];

        // Crear y asignar permisos
        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Asignar permisos a los roles
        // Rol admin tendrá todos los permisos
        $adminRole->givePermissionTo([
            'read_home', 'write_home',
            'read_users', 'write_users',
            'read_roles', 'write_roles',
            'read_permissions', 'write_permissions'
        ]);

        // Rol guest tendrá permisos limitados (solo lectura en algunas secciones)
        $guestRole->givePermissionTo([
            'read_home', 'read_users'
        ]);
    }
}
