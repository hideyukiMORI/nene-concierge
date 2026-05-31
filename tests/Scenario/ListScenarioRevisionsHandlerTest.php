<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Auth\ActorContext;
use NeNeConcierge\Scenario\CreateScenarioInput;
use NeNeConcierge\Scenario\CreateScenarioUseCase;
use NeNeConcierge\Scenario\ListScenarioRevisionsHandler;
use NeNeConcierge\Scenario\ListScenarioRevisionsUseCase;
use NeNeConcierge\Scenario\ScenarioRevisionRecorder;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class ListScenarioRevisionsHandlerTest extends TestCase
{
    private Psr17Factory                       $psr17;
    private JsonResponseFactory                $json;
    private InMemoryScenarioRevisionRepository $revisionRepo;
    private ListScenarioRevisionsHandler       $handler;

    protected function setUp(): void
    {
        $this->psr17 = new Psr17Factory();
        $this->json  = new JsonResponseFactory($this->psr17, $this->psr17);

        $scenarioRepo  = new InMemoryScenarioRepository();
        $nodeRepo      = new InMemoryScenarioNodeRepository();
        $edgeRepo      = new InMemoryScenarioEdgeRepository();
        $this->revisionRepo = new InMemoryScenarioRevisionRepository();
        $recorder      = new ScenarioRevisionRecorder($this->revisionRepo, $nodeRepo, $edgeRepo);
        $actor         = new ActorContext(userId: 1, email: 'tester@example.com');

        // シナリオを 3 件作成してリビジョンを蓄積
        $createUC = new CreateScenarioUseCase($scenarioRepo, $nodeRepo, $edgeRepo, $recorder);
        $createUC->execute(new CreateScenarioInput(name: 'Scenario A'), 1, $actor);
        $createUC->execute(new CreateScenarioInput(name: 'Scenario B'), 1, $actor);
        $createUC->execute(new CreateScenarioInput(name: 'Org2 Only'), 2, $actor);  // 別 org

        $this->handler = new ListScenarioRevisionsHandler(
            new ListScenarioRevisionsUseCase($this->revisionRepo),
            $this->json,
        );
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** @param array<string, string> $query */
    private function req(int $orgId = 1, array $query = []): ServerRequestInterface
    {
        $uri = $this->psr17->createUri('/api/v1/scenario-revisions');
        if ($query !== []) {
            $uri = $uri->withQuery(http_build_query($query));
        }

        return $this->psr17
            ->createServerRequest('GET', $uri)
            ->withAttribute('nene2.org.id', $orgId)
            ->withQueryParams($query);
    }

    // ── 基本動作 ──────────────────────────────────────────────────────────────

    public function testReturnsAllRevisionsForOrg(): void
    {
        $response = $this->handler->handle($this->req(1));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(2, $body['meta']['total']);
        self::assertCount(2, $body['data']);
    }

    public function testOrganizationIsolation(): void
    {
        $response = $this->handler->handle($this->req(2));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(1, $body['meta']['total']);
    }

    public function testResponseShape(): void
    {
        $response = $this->handler->handle($this->req(1));
        $body     = json_decode((string) $response->getBody(), true);
        $item     = $body['data'][0];

        self::assertArrayHasKey('id', $item);
        self::assertArrayHasKey('scenario_id', $item);
        self::assertArrayHasKey('scenario_name', $item);
        self::assertArrayHasKey('revision_no', $item);
        self::assertArrayHasKey('user_id', $item);
        self::assertArrayHasKey('user_email', $item);
        self::assertArrayHasKey('operation', $item);
        self::assertArrayHasKey('name', $item);
        self::assertArrayHasKey('status', $item);
        self::assertArrayHasKey('node_count', $item);
        self::assertArrayHasKey('edge_count', $item);
        self::assertArrayHasKey('created_at', $item);
    }

    // ── ページネーション: limit クランプ ─────────────────────────────────────

    public function testLimitDefaultIs50(): void
    {
        $response = $this->handler->handle($this->req(1));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(50, $body['meta']['limit']);
    }

    public function testLimitIsClampedToMax200(): void
    {
        $response = $this->handler->handle($this->req(1, ['limit' => '500']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $body['meta']['limit']);
    }

    public function testLimitIsClampedToMin1(): void
    {
        $response = $this->handler->handle($this->req(1, ['limit' => '0']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(1, $body['meta']['limit']);
    }

    public function testLimitBoundaryExactly200(): void
    {
        $response = $this->handler->handle($this->req(1, ['limit' => '200']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $body['meta']['limit']);
    }

    public function testLimitBoundaryExactly1(): void
    {
        $response = $this->handler->handle($this->req(1, ['limit' => '1']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(1, $body['meta']['limit']);
    }

    public function testNegativeLimitIsClampedToMin1(): void
    {
        $response = $this->handler->handle($this->req(1, ['limit' => '-5']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(1, $body['meta']['limit']);
    }

    public function testOffsetDefaultIsZero(): void
    {
        $response = $this->handler->handle($this->req(1));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(0, $body['meta']['offset']);
    }

    public function testNegativeOffsetIsClampedToZero(): void
    {
        $response = $this->handler->handle($this->req(1, ['offset' => '-1']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(0, $body['meta']['offset']);
    }

    // ── 日付パース ────────────────────────────────────────────────────────────

    public function testEmptyDateFromIsIgnored(): void
    {
        $response = $this->handler->handle($this->req(1, ['date_from' => '']));
        $body     = json_decode((string) $response->getBody(), true);

        // フィルターなし → 全件
        self::assertSame(2, $body['meta']['total']);
    }

    public function testInvalidDateIsIgnored(): void
    {
        $response = $this->handler->handle($this->req(1, ['date_from' => 'not-a-date']));
        $body     = json_decode((string) $response->getBody(), true);

        // strtotime が false → null 扱い → フィルターなし
        self::assertSame(2, $body['meta']['total']);
    }

    // ── フィルター ────────────────────────────────────────────────────────────

    public function testFilterByOperation(): void
    {
        $response = $this->handler->handle($this->req(1, ['operation' => 'create']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(2, $body['meta']['total']);
        foreach ($body['data'] as $item) {
            self::assertSame('create', $item['operation']);
        }
    }

    public function testEmptyOperationFilterIsIgnored(): void
    {
        $response = $this->handler->handle($this->req(1, ['operation' => '']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(2, $body['meta']['total']);
    }

    public function testEmptyQueryFilterIsIgnored(): void
    {
        $response = $this->handler->handle($this->req(1, ['q' => '']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(2, $body['meta']['total']);
    }
}
