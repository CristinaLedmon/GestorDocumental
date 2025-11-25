<?php

return [

    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [

        // Disco local para uso general de Laravel (logs, colas, etc.)
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app'),
            'serve' => true,
            'throw' => false,
        ],

        // 🔹 Nuevo disco exclusivo para tus documentos (gestor documental)
        'documents' => [
            'driver' => 'local',
            'root' => storage_path('app/documents'),
            'serve' => false, // no accesible por URL directa
            'throw' => false,
        ],

        // Disco público (por si luego subes imágenes o recursos visibles en la web)
        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL') . '/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        // Configuración de Amazon S3 (opcional)
        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
        ],

    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
