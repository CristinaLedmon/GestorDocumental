<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;

class AuthenticatedSessionController extends Controller
{
    /**
     * Función para inicio sesión.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();

        $request->session()->regenerate();

        if (Auth::check()) {
            $user = Auth::user();
            $permissions = $user->getPermissionsViaRoles();
            $permissions_arr = [];
            if ($permissions) {
                foreach ($permissions as $permission) {
                    $permissions_arr[] = $permission->name;
                }
            }
            $user_info = [
                "id" => Auth::id(),
                "name" => $user->name,
                "email" => $user->email,
                "role" => $user->getRoleNames()->first(),
                "permissions" => $permissions_arr
            ];
            return response()->json([
                'user' => $user_info,
                'message' => 'Usuario autorizado.',
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
            'message' => 'Usuario no autorizado.',
        ], 401);
    }

    /**
     * Función para logout.
     */
    public function destroy(Request $request)
    {
        // Invalidar la sesión actual
        $request->session()->invalidate();

        // Regenerar el token CSRF
        $request->session()->regenerateToken();

        // Logout del usuario
        Auth::logout();

        // Eliminar las cookies de sesión.
        $cookiesToForget = ['laravel_session', 'XSRF-TOKEN', 'user_info'];
        $response = response()->json(['success' => true]);

        foreach ($cookiesToForget as $cookieName) {
            $response->withCookie(Cookie::forget($cookieName));
        }

        // Forzar la expiración de la sesión
        $response->header('Clear-Site-Data', '"cookies"');

        return $response;
    }
}
