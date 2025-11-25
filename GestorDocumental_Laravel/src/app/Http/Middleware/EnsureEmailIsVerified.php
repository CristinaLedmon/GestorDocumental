<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Si no hay usuario autenticado, dejar que auth:sanctum maneje el error
        if (!$request->user()) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'error' => 'No token provided or invalid token'
            ], 401);
        }

        // Obtener el token del header Authorization
        $bearerToken = $request->bearerToken();
        
        if (!$bearerToken) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'error' => 'No bearer token found'
            ], 401);
        }

        // Buscar el token en la base de datos
        $hashedToken = hash('sha256', $bearerToken);
        $tokenExists = PersonalAccessToken::where('token', $hashedToken)->exists();

        if (!$tokenExists) {
            return response()->json([
                'message' => 'Token has been revoked.',
                'error' => 'This token no longer exists in the database. Please login again.'
            ], 401);
        }

        return $next($request);
    }
}
