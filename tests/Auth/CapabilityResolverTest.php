<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use NeNeConcierge\Auth\Capability;
use NeNeConcierge\Auth\CapabilityResolver;
use PHPUnit\Framework\TestCase;

final class CapabilityResolverTest extends TestCase
{
    public function testOrganizationPathRequiresManageOrganizations(): void
    {
        self::assertSame(Capability::ManageOrganizations, CapabilityResolver::resolve('/api/v1/organizations', 'GET'));
        self::assertSame(Capability::ManageOrganizations, CapabilityResolver::resolve('/api/v1/organizations', 'POST'));
        self::assertSame(Capability::ManageOrganizations, CapabilityResolver::resolve('/api/v1/organizations/1', 'DELETE'));
    }

    public function testUserPathsRequireManageUsers(): void
    {
        // Issue #116 以降: read も含めて全 method で ManageUsers 必須
        self::assertSame(Capability::ManageUsers, CapabilityResolver::resolve('/api/v1/users', 'GET'));
        self::assertSame(Capability::ManageUsers, CapabilityResolver::resolve('/api/v1/users/1', 'GET'));
        self::assertSame(Capability::ManageUsers, CapabilityResolver::resolve('/api/v1/users', 'POST'));
        self::assertSame(Capability::ManageUsers, CapabilityResolver::resolve('/api/v1/users/1', 'PATCH'));
        self::assertSame(Capability::ManageUsers, CapabilityResolver::resolve('/api/v1/users/1', 'DELETE'));
    }

    public function testScenarioMutationsRequireManageScenarios(): void
    {
        self::assertSame(Capability::ManageScenarios, CapabilityResolver::resolve('/api/v1/scenarios', 'POST'));
        self::assertSame(Capability::ManageScenarios, CapabilityResolver::resolve('/api/v1/scenarios/1', 'PATCH'));
        self::assertSame(Capability::ManageScenarios, CapabilityResolver::resolve('/api/v1/scenarios/1', 'DELETE'));
    }

    public function testScenarioGetRequiresViewScenarios(): void
    {
        self::assertSame(Capability::ViewScenarios, CapabilityResolver::resolve('/api/v1/scenarios', 'GET'));
        self::assertSame(Capability::ViewScenarios, CapabilityResolver::resolve('/api/v1/scenarios/1', 'GET'));
    }

    public function testUnknownPathReturnsNull(): void
    {
        self::assertNull(CapabilityResolver::resolve('/health', 'GET'));
        self::assertNull(CapabilityResolver::resolve('/api/v1/auth/login', 'POST'));
    }
}
