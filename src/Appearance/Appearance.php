<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

/**
 * Per-organization widget appearance settings.
 *
 * A single row per organization (UNIQUE on organization_id).
 * When no row exists the domain returns the default values defined here.
 */
final readonly class Appearance
{
    public const DEFAULT_COLOR_PRIMARY   = '#2563eb';
    public const DEFAULT_COLOR_SECONDARY = '#ffffff';

    public function __construct(
        public int                 $organizationId,
        public string              $colorPrimary   = self::DEFAULT_COLOR_PRIMARY,
        public string              $colorSecondary = self::DEFAULT_COLOR_SECONDARY,
        public AppearancePosition  $position       = AppearancePosition::BottomRight,
        public AppearanceTrigger   $trigger        = AppearanceTrigger::PageLoad,
        public ?string             $iconUrl        = null,
        public ?string             $welcomeText    = null,
        public ?int                $id             = null,
        public ?string             $createdAt      = null,
        public ?string             $updatedAt      = null,
    ) {
    }
}
