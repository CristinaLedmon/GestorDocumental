<?php

namespace App\Dto;

class RoleDto
{
    public ?string $name;
    public $permissions = [];

    public function __construct(array $data)
    {
        $this->name = $data['name'] ?? null;
        $this->permissions = $data['permissions'] ?? [];
    }
}
