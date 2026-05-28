<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class ListUsersItem
{
    public function __construct(
        public int $id,
        public string $email,
        public string $role,
        public string $status,
        public ?int $createdAt,
        public ?int $updatedAt,
    ) {
    }
}
