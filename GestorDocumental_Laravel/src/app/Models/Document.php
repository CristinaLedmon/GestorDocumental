<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'file_path',
        'folder_id',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function folder()
    {
        return $this->belongsTo(Folder::class);
    }

    /**
     * URL de descarga (si usas storage público)
     */
    public function getUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    /**
     * Nombre del archivo sin extensión
     */
    public function getBaseNameAttribute()
    {
        return pathinfo($this->name, PATHINFO_FILENAME);
    }
}
