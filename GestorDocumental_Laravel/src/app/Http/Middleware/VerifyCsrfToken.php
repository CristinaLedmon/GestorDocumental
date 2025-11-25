<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * Solo rutas que realmente no necesitan CSRF, como APIs públicas.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/examples/*',  // Tus rutas públicas de ejemplo
        'api/public/*',    // Puedes agregar otras rutas públicas
    ];
}
