<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'name.string' => 'El nombre debe ser una cadena de caracteres.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico debe ser válido.',
            'email.unique' => 'El correo electrónico ya esta en uso.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $user_created = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->string('password'))
        ]);

        // Por defecto se asigna el rol sin permisos.
        $user_created->assignRole('guest');

        event(new Registered($user_created));

        Auth::login($user_created);

        if (Auth::check()) {
            $user = Auth::user();
            $user_info = [
                "id" => Auth::id(),
                "name" => $user->name,
                "email" => $user->email,
                "role" => $user->getRoleNames()->first(),
                "permissions" => $user->getPermissionNames()
            ];
            return response()->json([
                'user' => $user_info,
                'message' => 'Usuario creado correctamente.',
            ], 200)
                ->withCookie(\cookie(
                        'user_info',
                        json_encode($user_info),
                        env('SESSION_LIFETIME'),
                        env('SESSION_PATH'),
                        env('SESSION_DOMAIN'),
                        env('SESSION_SECURE_COOKIE'),
                        false)
                );
        }

        return response()->json([
            'message' => 'Usuario no creado correctamente.',
        ], 401);
    }
}
