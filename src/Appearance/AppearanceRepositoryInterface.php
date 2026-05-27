<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

interface AppearanceRepositoryInterface
{
    /**
     * Returns the stored appearance for the organization, or null if none exists.
     */
    public function findByOrganization(int $organizationId): ?Appearance;

    /**
     * Insert or update the appearance row for the organization.
     */
    public function upsert(Appearance $appearance): void;
}
