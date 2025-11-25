<?php

namespace App\Services;

use App\Dto\UserDto;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function getAllUsers(): Collection
    {
        return User::all();
    }

    public function createUser(UserDto $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => Hash::make($data->password)
        ]);

        $user->assignRole($request->role ?? 'guest');

        event(new Registered($user));

        return $user;
    }

    public function updateUser(User $user, UserDto $data): User
    {
        $user->update([
            'name' => $data->name ?? $user->name,
            'email' => $data->email ?? $user->email,
            'password' => $data->password ? Hash::make($data->password) : $user->password,
        ]);

        if ($data->role) {
            $user->syncRoles($data->role);
        }

        return $user;
    }

    public function destroyUser(User $user): bool
    {
        return $user->delete() ?? false;
    }
}
