<?php

namespace App\Dto;

class UserDto
{
    public ?string $name;
    public ?string $email;
    public ?string $password;
    public ?string $role;

    public function __construct(array $data)
    {
        $this->name = $data['name'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->password = $data['password'] ?? null;
        $this->role = $data['role'] ?? null;
    }
}
