<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

final readonly class ActionCredential
{
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        public int    $organizationId,
        public string $name,
        public string $adapter,
        public array  $config,
        public ?int   $id        = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
