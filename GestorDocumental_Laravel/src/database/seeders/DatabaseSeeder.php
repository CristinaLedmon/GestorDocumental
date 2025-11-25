<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        try {
            // Primero, ejecutamos el seeder que crea los roles y permisos
            $this->call(RolesAndPermissionsSeeder::class);

            // Luego, ejecutamos el seeder que crea el admin y asigna el rol
            $this->call(UserSeeder::class);
        } catch (\Exception $exception) {
            return; // En caso de que algo falle saltamos el seed para no romper el docker.
        }
    }
}
