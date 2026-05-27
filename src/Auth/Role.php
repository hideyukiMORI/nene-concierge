<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

enum Role: string
{
    case Superadmin = 'superadmin';
    case Owner      = 'owner';
    case Editor     = 'editor';
    case Viewer     = 'viewer';

    public function hasCapability(Capability $capability): bool
    {
        return match ($this) {
            self::Superadmin => true,
            self::Owner => $capability !== Capability::ManageOrganizations,
            self::Editor => match ($capability) {
                Capability::ManageScenarios,
                Capability::ViewScenarios => true,
                Capability::ManageOrganizations,
                Capability::ManageUsers => false,
            },
            self::Viewer => $capability === Capability::ViewScenarios,
        };
    }
}
