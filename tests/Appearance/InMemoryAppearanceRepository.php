<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Appearance;

use NeNeConcierge\Appearance\Appearance;
use NeNeConcierge\Appearance\AppearanceRepositoryInterface;

final class InMemoryAppearanceRepository implements AppearanceRepositoryInterface
{
    /** @var array<int, Appearance> key = organizationId */
    private array $store = [];

    public function findByOrganization(int $organizationId): ?Appearance
    {
        return $this->store[$organizationId] ?? null;
    }

    public function upsert(Appearance $appearance): void
    {
        $this->store[$appearance->organizationId] = $appearance;
    }
}
