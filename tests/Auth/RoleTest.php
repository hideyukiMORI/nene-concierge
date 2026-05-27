<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use NeNeConcierge\Auth\Capability;
use NeNeConcierge\Auth\Role;
use PHPUnit\Framework\TestCase;

final class RoleTest extends TestCase
{
    public function testSuperadminHasAllCapabilities(): void
    {
        foreach (Capability::cases() as $capability) {
            self::assertTrue(Role::Superadmin->hasCapability($capability));
        }
    }

    public function testOwnerHasAllCapabilitiesExceptManageOrganizations(): void
    {
        foreach (Capability::cases() as $capability) {
            if ($capability === Capability::ManageOrganizations) {
                self::assertFalse(Role::Owner->hasCapability($capability));
            } else {
                self::assertTrue(Role::Owner->hasCapability($capability));
            }
        }
    }

    public function testEditorCanManageAndViewScenarios(): void
    {
        self::assertTrue(Role::Editor->hasCapability(Capability::ManageScenarios));
        self::assertTrue(Role::Editor->hasCapability(Capability::ViewScenarios));
    }

    public function testEditorCannotManageOrganizationsOrUsers(): void
    {
        self::assertFalse(Role::Editor->hasCapability(Capability::ManageOrganizations));
        self::assertFalse(Role::Editor->hasCapability(Capability::ManageUsers));
    }

    public function testViewerCanOnlyViewScenarios(): void
    {
        self::assertTrue(Role::Viewer->hasCapability(Capability::ViewScenarios));
        self::assertFalse(Role::Viewer->hasCapability(Capability::ManageScenarios));
        self::assertFalse(Role::Viewer->hasCapability(Capability::ManageUsers));
        self::assertFalse(Role::Viewer->hasCapability(Capability::ManageOrganizations));
    }
}
