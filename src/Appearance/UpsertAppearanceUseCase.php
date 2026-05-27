<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

/**
 * Creates or fully replaces the widget appearance settings for an organization.
 *
 * This is a full PUT — the caller provides all desired field values.
 * Unrecognised fields are ignored; missing optional fields default to the
 * constants on the Appearance value object.
 */
final readonly class UpsertAppearanceUseCase
{
    public function __construct(
        private AppearanceRepositoryInterface $appearances,
    ) {
    }

    public function execute(Appearance $appearance): void
    {
        $this->appearances->upsert($appearance);
    }
}
