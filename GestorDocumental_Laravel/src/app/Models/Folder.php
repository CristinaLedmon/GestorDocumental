<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Folder extends Model
{
    use HasFactory;

    /**
     * Campos asignables en masa (fillable)
     */
    protected $fillable = [
        'name',
        'parent_id',
        'user_id',
    ];

    /**
     * Relaciones
     */

    // Carpeta padre
    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    // Subcarpetas hijas
    public function children()
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    // Usuario propietario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Documentos dentro de la carpeta
    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Accesor: obtener ruta completa
     */
    public function getFullPathAttribute()
    {
        $path = [$this->name];
        $parent = $this->parent;

        // Evitar errores si parent es null o inesperado
        while ($parent instanceof Folder) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }

        return implode('/', $path);
    }

    protected static function booted()
    {
        static::deleting(function ($folder) {
            // Eliminar documentos de la carpeta
            foreach ($folder->documents as $document) {
                $document->delete();
            }

            // Eliminar subcarpetas recursivamente
            foreach ($folder->children as $child) {
                $child->delete();
            }
        });
    }


}
