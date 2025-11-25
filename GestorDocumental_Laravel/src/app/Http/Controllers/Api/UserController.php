<?php

namespace App\Http\Controllers\Api;

use App\Dto\UserDto;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{

    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Listado de los usuarios.
     */
    public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $users = $this->userService->getAllUsers();

        return UserResource::collection($users);
    }

    /**
     * Guardado de nuevo usuario.
     */
    public function store(Request $request): UserResource
    {
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'string']
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'name.string' => 'El nombre debe ser una cadena de caracteres.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico debe ser válido.',
            'email.unique' => 'El correo electrónico ya esta en uso.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $userDto = new UserDto($validatedData);

        $user = $this->userService->createUser($userDto);

        return new UserResource($user);
    }

    /**
     * Mostrado de el usuario existente.
     */
    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    /**
     * Actualización de un usuario.
     */
    public function update(Request $request, User $user): UserResource
    {
        $validatedData = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['sometimes', 'confirmed', Password::defaults(),],
            'role' => ["sometimes", "string"]
        ], [
            'name.string' => 'El nombre debe ser una cadena de caracteres.',
            'role.string' => 'El rol debe ser una cadena de caracteres.',
            'email.email' => 'El correo electrónico debe ser válido.',
            'email.unique' => 'El correo electrónico ya esta en uso.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $userDto = new UserDto($validatedData);

        $updatedUser = $this->userService->updateUser($user, $userDto);

        return new UserResource($updatedUser);
    }

    /**
     * Eliminación de un usuario.
     */
    public function destroy(User $user)
    {
        return response()->json(['success' => $this->userService->destroyUser($user)]);
    }
}
