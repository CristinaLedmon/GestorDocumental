<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Asegurarse de que el rol admin exista.
        $roleAdmin = Role::firstOrCreate(['name' => 'admin']);

        // Creamos al admin. (pass=>password)
        $user = User::factory()->create([
            'name' => 'Ledmon Marketing',
            'email' => 'webs@ledmon.com',
        ]);

        // Asigna el rol de Admin.
        $user->assignRole($roleAdmin);
    }
}
