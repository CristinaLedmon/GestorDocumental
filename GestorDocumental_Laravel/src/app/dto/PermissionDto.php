<?php

namespace App\Dto;

class PermissionDto
{
    public ?string $name;

    public function __construct(array $data)
    {
        $this->name = $data['name'] ?? null;
    }
}
