<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Session;

use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Session\ChatSession;
use NeNeConcierge\Session\ListSessionsHandler;
use NeNeConcierge\Session\SessionOutcome;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class ListSessionsHandlerTest extends TestCase
{
    private InMemoryChatSessionRepository $repo;
    private ListSessionsHandler           $handler;
    private Psr17Factory                  $psr17;

    protected function setUp(): void
    {
        $this->psr17   = new Psr17Factory();
        $this->repo    = new InMemoryChatSessionRepository();
        $this->handler = new ListSessionsHandler(
            $this->repo,
            new JsonResponseFactory($this->psr17, $this->psr17),
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeSession(
        int    $orgId,
        string $outcome       = 'completed',
        bool   $hasConversion = false,
        int    $scenarioId    = 1,
    ): ChatSession {
        return new ChatSession(
            id:             'sess-' . bin2hex(random_bytes(4)),
            organizationId: $orgId,
            scenarioId:     $scenarioId,
            currentNodeId:  null,
            outcome:        SessionOutcome::from($outcome),
            hasConversion:  $hasConversion,
            startedAt:      date('Y-m-d H:i:s'),
            variables:      [],
            endedAt:        date('Y-m-d H:i:s'),
        );
    }

    /** @param array<string, string> $query */
    private function makeRequest(int $orgId = 1, array $query = []): ServerRequestInterface
    {
        $uri = $this->psr17->createUri('/api/v1/sessions');
        if ($query !== []) {
            $uri = $uri->withQuery(http_build_query($query));
        }

        return $this->psr17
            ->createServerRequest('GET', $uri)
            ->withAttribute('nene2.org.id', $orgId)
            ->withQueryParams($query);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function testReturnsSessionsForOrganization(): void
    {
        $this->repo->save($this->makeSession(1));
        $this->repo->save($this->makeSession(1));
        $this->repo->save($this->makeSession(2)); // different org

        $response = $this->handler->handle($this->makeRequest(1));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(2, $body['data']);
        $this->assertSame(2, $body['meta']['total']);
    }

    public function testPreviewSessionsAreExcluded(): void
    {
        $this->repo->save($this->makeSession(1, 'completed'));
        $this->repo->save($this->makeSession(1, 'preview'));
        $this->repo->save($this->makeSession(1, 'active'));

        $response = $this->handler->handle($this->makeRequest(1));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(2, $body['data']);
        $this->assertSame(2, $body['meta']['total']);
        foreach ($body['data'] as $row) {
            $this->assertNotSame('preview', $row['outcome']);
        }
    }

    public function testFiltersByOutcome(): void
    {
        $this->repo->save($this->makeSession(1, 'completed'));
        $this->repo->save($this->makeSession(1, 'dropped'));
        $this->repo->save($this->makeSession(1, 'converted'));

        $response = $this->handler->handle($this->makeRequest(1, ['outcome' => 'dropped']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(1, $body['data']);
        $this->assertSame('dropped', $body['data'][0]['outcome']);
        $this->assertSame(1, $body['meta']['total']);
    }

    public function testFiltersByHasConversion(): void
    {
        $this->repo->save($this->makeSession(1, 'converted', true));
        $this->repo->save($this->makeSession(1, 'completed', false));
        $this->repo->save($this->makeSession(1, 'completed', false));

        $response = $this->handler->handle($this->makeRequest(1, ['has_conversion' => '1']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(1, $body['data']);
        $this->assertTrue($body['data'][0]['has_conversion']);
        $this->assertSame(1, $body['meta']['total']);
    }

    public function testFiltersByScenarioId(): void
    {
        $this->repo->save($this->makeSession(1, 'completed', false, 10));
        $this->repo->save($this->makeSession(1, 'completed', false, 20));

        $response = $this->handler->handle($this->makeRequest(1, ['scenario_id' => '10']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(1, $body['data']);
        $this->assertSame(10, $body['data'][0]['scenario_id']);
    }

    public function testPagination(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->repo->save($this->makeSession(1));
        }

        $response = $this->handler->handle($this->makeRequest(1, ['limit' => '2', 'offset' => '2']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertCount(2, $body['data']);
        $this->assertSame(5, $body['meta']['total']);
        $this->assertSame(2, $body['meta']['limit']);
        $this->assertSame(2, $body['meta']['offset']);
    }

    public function testLimitClampedAt200(): void
    {
        $response = $this->handler->handle($this->makeRequest(1, ['limit' => '999']));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertSame(200, $body['meta']['limit']);
    }

    public function testResponseContainsExpectedFields(): void
    {
        $this->repo->save($this->makeSession(1));

        $response = $this->handler->handle($this->makeRequest(1));
        $body     = json_decode((string) $response->getBody(), true);

        $row = $body['data'][0];
        $this->assertArrayHasKey('id', $row);
        $this->assertArrayHasKey('scenario_id', $row);
        $this->assertArrayHasKey('outcome', $row);
        $this->assertArrayHasKey('has_conversion', $row);
        $this->assertArrayHasKey('started_at', $row);
        $this->assertArrayHasKey('ended_at', $row);
        // variables must NOT be in the list view
        $this->assertArrayNotHasKey('variables', $row);
        $this->assertArrayNotHasKey('messages', $row);
    }
}
