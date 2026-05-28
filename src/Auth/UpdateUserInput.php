<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class UpdateUserInput
{
    public function __construct(
        public int $id,
        public ?string $role = null,
        public ?string $status = null,
        public ?string $password = null,
    ) {
    }
}
