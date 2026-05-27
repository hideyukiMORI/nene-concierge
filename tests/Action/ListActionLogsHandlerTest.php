<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Action;

use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Action\ActionLog;
use NeNeConcierge\Action\ListActionLogsHandler;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class ListActionLogsHandlerTest extends TestCase
{
    private InMemoryActionLogRepository $repo;
    private ListActionLogsHandler       $handler;
    private Psr17Factory                $psr17;

    protected function setUp(): void
    {
        $this->psr17   = new Psr17Factory();
        $this->repo    = new InMemoryActionLogRepository();
        $this->handler = new ListActionLogsHandler(
            $this->repo,
            new JsonResponseFactory($this->psr17, $this->psr17),
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeLog(
        int    $orgId,
        string $adapter,
        string $status,
        int    $scenarioId = 1,
    ): ActionLog {
        return new ActionLog(
            organizationId: $orgId,
            sessionId:      'sess-' . bin2hex(random_bytes(4)),
            scenarioId:     $scenarioId,
            nodeId:         'node-01',
            adapter:        $adapter,
            status:         $status,
            executedAt:     date('Y-m-d H:i:s'),
            errorMessage:   $status === 'failure' ? 'Something went wrong' : null,
        );
    }

    /** @param array<string, string> $query */
    private function makeRequest(int $orgId = 1, array $query = []): ServerRequestInterface
    {
        $uri = $this->psr17->createUri('/api/v1/action-logs');
        if ($query !== []) {
            $uri = $uri->withQuery(http_build_query($query));
        }

        return $this->psr17
            ->createServerRequest('GET', $uri)
            ->withAttribute('nene2.org.id', $orgId)
            ->withQueryParams($query);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function testReturnsAllLogsForOrganization(): void
    {
        $this->repo->append($this->makeLog(1, 'http', 'success'));
        $this->repo->append($this->makeLog(1, 'email', 'failure'));
        $this->repo->append($this->makeLog(2, 'slack', 'success')); // different org

        $response = $this->handler->handle($this->makeRequest(1));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(2, $body['data']);
        $this->assertSame(2, $body['meta']['total']);
    }

    public function testFiltersByAdapter(): void
    {
        $this->repo->append($this->makeLog(1, 'http', 'success'));
        $this->repo->append($this->makeLog(1, 'slack', 'success'));
        $this->repo->append($this->makeLog(1, 'email', 'failure'));

        $response = $this->handler->handle($this->makeRequest(1, ['adapter' => 'http']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(1, $body['data']);
        $this->assertSame('http', $body['data'][0]['adapter']);
        $this->assertSame(1, $body['meta']['total']);
    }

    public function testFiltersByStatus(): void
    {
        $this->repo->append($this->makeLog(1, 'http', 'success'));
        $this->repo->append($this->makeLog(1, 'slack', 'failure'));
        $this->repo->append($this->makeLog(1, 'email', 'failure'));

        $response = $this->handler->handle($this->makeRequest(1, ['status' => 'failure']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(2, $body['data']);
        $this->assertSame(2, $body['meta']['total']);
        foreach ($body['data'] as $row) {
            $this->assertSame('failure', $row['status']);
        }
    }

    public function testFiltersByScenarioId(): void
    {
        $this->repo->append($this->makeLog(1, 'http', 'success', scenarioId: 10));
        $this->repo->append($this->makeLog(1, 'slack', 'success', scenarioId: 20));

        $response = $this->handler->handle($this->makeRequest(1, ['scenario_id' => '10']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(1, $body['data']);
        $this->assertSame(10, $body['data'][0]['scenario_id']);
    }

    public function testPagination(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->repo->append($this->makeLog(1, 'http', 'success'));
        }

        $response = $this->handler->handle($this->makeRequest(1, ['limit' => '2', 'offset' => '1']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(2, $body['data']);
        $this->assertSame(5, $body['meta']['total']);
        $this->assertSame(2, $body['meta']['limit']);
        $this->assertSame(1, $body['meta']['offset']);
    }

    public function testReturnsEmptyForNoLogs(): void
    {
        $response = $this->handler->handle($this->makeRequest(99));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(0, $body['data']);
        $this->assertSame(0, $body['meta']['total']);
    }

    public function testResponseContainsExpectedFields(): void
    {
        $this->repo->append($this->makeLog(1, 'http', 'success'));

        $response = $this->handler->handle($this->makeRequest(1));
        $body     = json_decode((string) $response->getBody(), true);

        $row = $body['data'][0];
        $this->assertArrayHasKey('id', $row);
        $this->assertArrayHasKey('session_id', $row);
        $this->assertArrayHasKey('scenario_id', $row);
        $this->assertArrayHasKey('node_id', $row);
        $this->assertArrayHasKey('adapter', $row);
        $this->assertArrayHasKey('status', $row);
        $this->assertArrayHasKey('error_message', $row);
        $this->assertArrayHasKey('executed_at', $row);
    }
}
