<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

final readonly class Membership
{
    public function __construct(
        public int    $organizationId,
        public string $slug,
        public string $name,
        public string $role,
        public bool   $isActive,
    ) {
    }
}
