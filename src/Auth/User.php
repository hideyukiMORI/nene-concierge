<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class User
{
    public function __construct(
        public int $id,
        public string $email,
        public string $passwordHash,
        public string $role,
        public string $status = 'active',
        public ?int $createdAt = null,
        public ?int $updatedAt = null,
    ) {
    }
}
