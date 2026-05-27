<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Dashboard;

use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Dashboard\DashboardHandler;
use NeNeConcierge\Dashboard\DashboardStats;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;

final class DashboardHandlerTest extends TestCase
{
    private InMemoryDashboardRepository $repo;
    private DashboardHandler            $handler;
    private Psr17Factory                $psr17;

    protected function setUp(): void
    {
        $this->psr17   = new Psr17Factory();
        $this->repo    = new InMemoryDashboardRepository();
        $this->handler = new DashboardHandler(
            $this->repo,
            new JsonResponseFactory($this->psr17, $this->psr17),
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeRequest(int $orgId = 1): \Psr\Http\Message\ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('GET', '/api/v1/dashboard')
            ->withAttribute('nene2.org.id', $orgId);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function testReturns200WithDataKey(): void
    {
        $response = $this->handler->handle($this->makeRequest());
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertArrayHasKey('data', $body);
    }

    public function testResponseContainsAllExpectedFields(): void
    {
        $response = $this->handler->handle($this->makeRequest());
        $body     = json_decode((string) $response->getBody(), true);
        $data     = $body['data'];

        $this->assertArrayHasKey('sessions_7d', $data);
        $this->assertArrayHasKey('converted_7d', $data);
        $this->assertArrayHasKey('conversion_rate_7d', $data);
        $this->assertArrayHasKey('active_sessions', $data);
        $this->assertArrayHasKey('published_scenarios', $data);
        $this->assertArrayHasKey('action_failures_24h', $data);
        $this->assertArrayHasKey('daily_sessions', $data);
    }

    public function testReturnsStatsFromRepository(): void
    {
        $this->repo->setStats(new DashboardStats(
            sessions7d:         120,
            converted7d:        30,
            conversionRate7d:   25.0,
            activeSessions:     5,
            publishedScenarios: 8,
            actionFailures24h:  3,
            dailySessions:      [
                ['date' => '2026-05-21', 'count' => 15],
                ['date' => '2026-05-22', 'count' => 20],
            ],
        ));

        $response = $this->handler->handle($this->makeRequest());
        $body     = json_decode((string) $response->getBody(), true);
        $data     = $body['data'];

        $this->assertSame(120, $data['sessions_7d']);
        $this->assertSame(30, $data['converted_7d']);
        $this->assertSame(25.0, $data['conversion_rate_7d']);
        $this->assertSame(5, $data['active_sessions']);
        $this->assertSame(8, $data['published_scenarios']);
        $this->assertSame(3, $data['action_failures_24h']);
        $this->assertCount(2, $data['daily_sessions']);
        $this->assertSame('2026-05-21', $data['daily_sessions'][0]['date']);
        $this->assertSame(15, $data['daily_sessions'][0]['count']);
    }

    public function testEmptyStatsReturnZeros(): void
    {
        $response = $this->handler->handle($this->makeRequest());
        $body     = json_decode((string) $response->getBody(), true);
        $data     = $body['data'];

        $this->assertSame(0, $data['sessions_7d']);
        $this->assertSame(0.0, $data['conversion_rate_7d']);
        $this->assertSame([], $data['daily_sessions']);
    }

    public function testContentTypeIsJson(): void
    {
        $response = $this->handler->handle($this->makeRequest());

        $this->assertStringContainsString('application/json', $response->getHeaderLine('Content-Type'));
    }
}
