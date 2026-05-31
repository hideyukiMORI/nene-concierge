<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Organization;

use NeNeConcierge\Organization\Resolution\CustomDomainResolutionStrategy;
use NeNeConcierge\Organization\Resolution\EnvResolutionStrategy;
use NeNeConcierge\Organization\Resolution\PathPrefixResolutionStrategy;
use NeNeConcierge\Organization\Resolution\SubdomainResolutionStrategy;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;

final class OrgResolutionStrategyTest extends TestCase
{
    private Psr17Factory $psr17;

    protected function setUp(): void
    {
        $this->psr17 = new Psr17Factory();
    }

    private function req(string $uri): \Psr\Http\Message\ServerRequestInterface
    {
        return $this->psr17->createServerRequest('GET', $uri);
    }

    // ── SubdomainResolutionStrategy ───────────────────────────────────────────

    public function testSubdomainExtractsFirstSegment(): void
    {
        $strategy = new SubdomainResolutionStrategy('nene-concierge.com');
        $result   = $strategy->resolve($this->req('https://acme.nene-concierge.com/api/v1/scenarios'));

        self::assertSame('acme', $result);
    }

    public function testSubdomainReturnNullForBaseDomainOnly(): void
    {
        $strategy = new SubdomainResolutionStrategy('nene-concierge.com');
        $result   = $strategy->resolve($this->req('https://nene-concierge.com/api/v1/scenarios'));

        self::assertNull($result);
    }

    public function testSubdomainStripsPort(): void
    {
        $strategy = new SubdomainResolutionStrategy('nene-concierge.com');
        $result   = $strategy->resolve($this->req('https://org1.nene-concierge.com:8080/foo'));

        self::assertSame('org1', $result);
    }

    public function testSubdomainReturnNullForNonMatchingTail(): void
    {
        $strategy = new SubdomainResolutionStrategy('nene-concierge.com');
        $result   = $strategy->resolve($this->req('https://org1.other-domain.com/api'));

        self::assertNull($result);
    }

    public function testSubdomainHandlesMultiLevelSubdomain(): void
    {
        // foo.bar.nene-concierge.com → 最初のセグメント "foo" を返す
        $strategy = new SubdomainResolutionStrategy('nene-concierge.com');
        $result   = $strategy->resolve($this->req('https://foo.bar.nene-concierge.com/api'));

        self::assertSame('foo', $result);
    }

    public function testSubdomainWithThreePartBaseDomain(): void
    {
        $strategy = new SubdomainResolutionStrategy('staging.nene-concierge.com');
        self::assertSame('tenant1', $strategy->resolve($this->req('https://tenant1.staging.nene-concierge.com/')));
        self::assertNull($strategy->resolve($this->req('https://staging.nene-concierge.com/')));
    }

    // ── PathPrefixResolutionStrategy ──────────────────────────────────────────

    public function testPathPrefixExtractsFirstSegment(): void
    {
        $strategy = new PathPrefixResolutionStrategy();
        $result   = $strategy->resolve($this->req('https://host.example.com/myorg/api/v1/scenarios'));

        self::assertSame('myorg', $result);
    }

    public function testPathPrefixBypassesHealth(): void
    {
        $strategy = new PathPrefixResolutionStrategy();
        self::assertNull($strategy->resolve($this->req('https://host.example.com/health')));
    }

    public function testPathPrefixBypassesOrganizationsEndpoint(): void
    {
        $strategy = new PathPrefixResolutionStrategy();
        self::assertNull($strategy->resolve($this->req('https://host.example.com/api/v1/organizations')));
        self::assertNull($strategy->resolve($this->req('https://host.example.com/api/v1/organizations/1')));
    }

    public function testPathPrefixBypassesAuthEndpoint(): void
    {
        $strategy = new PathPrefixResolutionStrategy();
        self::assertNull($strategy->resolve($this->req('https://host.example.com/api/v1/auth/login')));
    }

    public function testPathPrefixReturnsNullForEmptyPath(): void
    {
        $strategy = new PathPrefixResolutionStrategy();
        self::assertNull($strategy->resolve($this->req('https://host.example.com/')));
    }

    public function testPathPrefixHandlesRootPathWithNoSlash(): void
    {
        // パス区切りなし → 最初のセグメントは空文字 → null
        $strategy = new PathPrefixResolutionStrategy();
        $result   = $strategy->resolve($this->req('https://host.example.com'));

        // "" は null として扱う
        self::assertNull($result);
    }

    public function testPathPrefixExtractsOnlyFirstSegment(): void
    {
        // /org-slug/deeply/nested → "org-slug"
        $strategy = new PathPrefixResolutionStrategy();
        $result   = $strategy->resolve($this->req('https://host.example.com/org-slug/deeply/nested'));

        self::assertSame('org-slug', $result);
    }

    // ── CustomDomainResolutionStrategy ────────────────────────────────────────

    public function testCustomDomainReturnsFullHost(): void
    {
        $strategy = new CustomDomainResolutionStrategy();
        $result   = $strategy->resolve($this->req('https://myclient.com/api/v1/scenarios'));

        self::assertSame('myclient.com', $result);
    }

    public function testCustomDomainStripsPort(): void
    {
        $strategy = new CustomDomainResolutionStrategy();
        $result   = $strategy->resolve($this->req('https://myclient.com:443/foo'));

        self::assertSame('myclient.com', $result);
    }

    public function testCustomDomainReturnsNullForEmptyHost(): void
    {
        $strategy = new CustomDomainResolutionStrategy();
        // PSR-7 factory が空ホストのリクエストを作れないためモックで確認
        $request  = $this->createMock(\Psr\Http\Message\ServerRequestInterface::class);
        $uri      = $this->createMock(\Psr\Http\Message\UriInterface::class);
        $uri->method('getHost')->willReturn('');
        $request->method('getUri')->willReturn($uri);

        self::assertNull($strategy->resolve($request));
    }

    // ── EnvResolutionStrategy ─────────────────────────────────────────────────

    public function testEnvStrategyReturnsSlugWhenSet(): void
    {
        $strategy = new EnvResolutionStrategy('my-org');
        $result   = $strategy->resolve($this->req('https://example.com/any/path'));

        self::assertSame('my-org', $result);
    }

    public function testEnvStrategyReturnsNullWhenNull(): void
    {
        $strategy = new EnvResolutionStrategy(null);
        self::assertNull($strategy->resolve($this->req('https://example.com/')));
    }

    public function testEnvStrategyReturnsNullForEmptyString(): void
    {
        $strategy = new EnvResolutionStrategy('');
        self::assertNull($strategy->resolve($this->req('https://example.com/')));
    }

    public function testEnvStrategyIgnoresRequestPath(): void
    {
        // ORG_SLUG が設定されていれば常に同じ slug を返す
        $strategy = new EnvResolutionStrategy('fixed-org');
        self::assertSame('fixed-org', $strategy->resolve($this->req('https://example.com/different-path')));
        self::assertSame('fixed-org', $strategy->resolve($this->req('https://other.host.com/foo')));
    }
}
