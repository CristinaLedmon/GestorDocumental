<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Función para inicio sesión.
     */
    public function store(LoginRequest $request)
    {
        Log::info('[v0] Login attempt started', [
            'email' => $request->email,
            'ip' => $request->ip()
        ]);
        
        try {
            // Buscar el usuario por email
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                Log::warning('[v0] User not found', ['email' => $request->email]);
                throw ValidationException::withMessages([
                    'email' => ['Las credenciales proporcionadas son incorrectas.'],
                ]);
            }
            
            // Verificar la contraseña
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('[v0] Invalid password', ['email' => $request->email]);
                throw ValidationException::withMessages([
                    'email' => ['Las credenciales proporcionadas son incorrectas.'],
                ]);
            }
            
            Log::info('[v0] Authentication successful', ['user_id' => $user->id]);
        } catch (ValidationException $e) {
            Log::error('[v0] Authentication failed', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('[v0] Unexpected error during authentication', [
                'error' => $e->getMessage(),
                'type' => get_class($e)
            ]);
            throw ValidationException::withMessages([
                'email' => ['Error al procesar la autenticación.'],
            ]);
        }
        
        // Eliminar tokens antiguos
        $oldTokensCount = $user->tokens()->count();
        $user->tokens()->delete();
        Log::info('[v0] Old tokens deleted', ['count' => $oldTokensCount]);
        
        // Crear token de Sanctum
        try {
            $token = $user->createToken('api-token')->plainTextToken;
            Log::info('[v0] New token created successfully');
        } catch (\Exception $e) {
            Log::error('[v0] Failed to create token', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
        
        // Obtener permisos
        try {
            $permissions = $user->getPermissionsViaRoles();
            $permissions_arr = [];
            if ($permissions) {
                foreach ($permissions as $permission) {
                    $permissions_arr[] = $permission->name;
                }
            }
            Log::info('[v0] Permissions loaded', ['count' => count($permissions_arr)]);
        } catch (\Exception $e) {
            Log::error('[v0] Failed to load permissions', [
                'error' => $e->getMessage()
            ]);
            $permissions_arr = [];
        }
        
        $user_info = [
            "id" => $user->id,
            "name" => $user->name,
            "email" => $user->email,
            "role" => $user->getRoleNames()->first(),
            "permissions" => $permissions_arr
        ];
        
        Log::info('[v0] Login completed successfully', ['user_id' => $user->id]);
        
        return response()->json([
            'user' => $user_info,
            'token' => $token,
            'message' => 'Usuario autorizado.',
        ], 200);
    }

    /**
     * Función para logout.
     */
    public function destroy(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No hay usuario autenticado.'
            ], 401);
        }
        
        $currentToken = $request->bearerToken();
        $tokenHash = hash('sha256', $currentToken);
        
        // Contar tokens antes de eliminar
        $tokensCount = $user->tokens()->count();
        
        // Log para debugging
        Log::info('Logout attempt', [
            'user_id' => $user->id,
            'tokens_before' => $tokensCount,
            'current_token_hash' => substr($tokenHash, 0, 10) . '...'
        ]);
        
        // Eliminar TODOS los tokens del usuario
        $deletedCount = $user->tokens()->delete();
        
        // Verificar que se eliminaron
        $tokensAfter = $user->tokens()->count();
        
        Log::info('Logout completed', [
            'user_id' => $user->id,
            'tokens_deleted' => $deletedCount,
            'tokens_after' => $tokensAfter
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.',
            'tokens_revoked' => $deletedCount,
            'tokens_remaining' => $tokensAfter,
            'user_id' => $user->id,
            'action_required' => 'El token ha sido revocado en el servidor. Si intentas usar este token nuevamente, recibirás un error 401.'
        ], 200)->header('Clear-Site-Data', '"cache", "cookies", "storage"');
    }
    
    /**
     * Verificar si el usuario está autenticado (para debugging).
     */
    public function check(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'authenticated' => false,
                'message' => 'No autenticado - El token no es válido o fue revocado'
            ], 401);
        }
        
        $currentToken = $request->bearerToken();
        $tokenHash = hash('sha256', $currentToken);
        $tokenModel = PersonalAccessToken::findToken($currentToken);
        
        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'tokens_count' => $user->tokens()->count(),
            'current_token_exists' => $tokenModel !== null,
            'current_token_id' => $tokenModel ? $tokenModel->id : null,
            'message' => 'Usuario autenticado correctamente'
        ], 200);
    }
    
    /**
     * Listar todos los tokens activos del usuario (para debugging).
     */
    public function tokens(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No hay usuario autenticado.'
            ], 401);
        }
        
        $tokens = $user->tokens()->get()->map(function ($token) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'created_at' => $token->created_at,
                'last_used_at' => $token->last_used_at,
                'token_preview' => substr($token->token, 0, 10) . '...'
            ];
        });
        
        return response()->json([
            'success' => true,
            'tokens_count' => $tokens->count(),
            'tokens' => $tokens
        ], 200);
    }
}
