<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class CreateUserInput
{
    public function __construct(
        public string $email,
        public string $password,
        public string $role,
    ) {
    }
}
