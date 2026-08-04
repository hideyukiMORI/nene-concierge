<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use NeNeConcierge\Auth\Capability;
use NeNeConcierge\Auth\CapabilityResolver;
use PHPUnit\Framework\Attributes\DataProvider;
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

    public function testScenarioHeadRequiresSameCapabilityAsGet(): void
    {
        // #212: HEAD は mutation 判定（isMutationMethod）からも除外されているため、read 分岐を
        // `$method === 'GET'` の単一等値で書くと null を返し、CapabilityMiddleware を素通りする。
        self::assertSame(Capability::ViewScenarios, CapabilityResolver::resolve('/api/v1/scenarios', 'HEAD'));
        self::assertSame(Capability::ViewScenarios, CapabilityResolver::resolve('/api/v1/scenarios/1', 'HEAD'));
        self::assertSame(Capability::ViewScenarios, CapabilityResolver::resolve('/api/v1/scenario-revisions', 'HEAD'));
        self::assertSame(Capability::ViewScenarios, CapabilityResolver::resolve('/api/v1/scenario-revisions/1', 'HEAD'));
    }

    /**
     * 全ルートについて GET と HEAD が同じ能力を要求することを pin する再発防止テスト（#212）。
     *
     * 単一メソッドの等値比較は複製されやすい（records #1021/#1023）ので、分岐を1つずつ
     * 見に行くのではなく**テーブル駆動で全経路を舐める**形にしてある。新しいパスを
     * CapabilityResolver に足したら、このテーブルにも足すこと。
     *
     * 陽性対照: `CapabilityResolver` の read 分岐を `$method === 'GET'` に戻すと
     * `/api/v1/scenarios` 系 4 パスがここで落ちる（PR #213 に実測を記載）。
     */
    #[DataProvider('apiPaths')]
    public function testGetAndHeadResolveToTheSameCapability(string $path): void
    {
        self::assertSame(
            CapabilityResolver::resolve($path, 'GET'),
            CapabilityResolver::resolve($path, 'HEAD'),
            sprintf('GET と HEAD で要求される能力が食い違っている（verb tampering の入口）: %s', $path),
        );
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function apiPaths(): iterable
    {
        // src/**/RouteRegistrar.php に登録されている管理 API 経路（2026-08-04 実測）。
        yield 'me'                      => ['/api/v1/me'];
        yield 'organizations'           => ['/api/v1/organizations'];
        yield 'organization by id'      => ['/api/v1/organizations/1'];
        yield 'users'                   => ['/api/v1/users'];
        yield 'user by id'              => ['/api/v1/users/1'];
        yield 'scenarios'               => ['/api/v1/scenarios'];
        yield 'scenario by id'          => ['/api/v1/scenarios/1'];
        yield 'scenario analytics'      => ['/api/v1/scenarios/1/analytics'];
        yield 'scenario import'         => ['/api/v1/scenarios/import'];
        yield 'scenario revisions'      => ['/api/v1/scenario-revisions'];
        yield 'scenario revision by id' => ['/api/v1/scenario-revisions/1'];
        yield 'sessions'                => ['/api/v1/sessions'];
        yield 'session by id'           => ['/api/v1/sessions/abc'];
        yield 'action credentials'      => ['/api/v1/action-credentials'];
        yield 'action logs'             => ['/api/v1/action-logs'];
        yield 'appearance'              => ['/api/v1/appearance'];
        yield 'dashboard'               => ['/api/v1/dashboard'];
        yield 'public appearance'       => ['/api/v1/public/appearance'];
        yield 'public sessions'         => ['/api/v1/public/sessions'];
        yield 'health'                  => ['/health'];
    }
}
