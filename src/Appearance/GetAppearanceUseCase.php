<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

/**
 * Returns the organization's widget appearance settings.
 *
 * If no row exists yet, a default Appearance value object is returned
 * (without persisting it). The caller receives consistent data regardless
 * of whether the operator has ever saved custom settings.
 */
final readonly class GetAppearanceUseCase
{
    public function __construct(
        private AppearanceRepositoryInterface $appearances,
    ) {
    }

    public function execute(int $organizationId): Appearance
    {
        return $this->appearances->findByOrganization($organizationId)
            ?? new Appearance(organizationId: $organizationId);
    }
}
