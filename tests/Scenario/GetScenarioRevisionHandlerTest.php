<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use NeNeConcierge\Auth\ActorContext;
use NeNeConcierge\Scenario\CreateScenarioInput;
use NeNeConcierge\Scenario\CreateScenarioUseCase;
use NeNeConcierge\Scenario\GetScenarioRevisionHandler;
use NeNeConcierge\Scenario\GetScenarioRevisionUseCase;
use NeNeConcierge\Scenario\ScenarioRevision;
use NeNeConcierge\Scenario\ScenarioRevisionRecorder;
use NeNeConcierge\Scenario\UpdateScenarioInput;
use NeNeConcierge\Scenario\UpdateScenarioUseCase;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class GetScenarioRevisionHandlerTest extends TestCase
{
    private Psr17Factory                       $psr17;
    private JsonResponseFactory                $json;
    private InMemoryScenarioRevisionRepository $revisionRepo;
    private GetScenarioRevisionHandler         $handler;
    private ActorContext                       $actor;

    protected function setUp(): void
    {
        $this->psr17        = new Psr17Factory();
        $this->json         = new JsonResponseFactory($this->psr17, $this->psr17);
        $this->actor        = new ActorContext(userId: 1, email: 'tester@example.com');
        $this->revisionRepo = new InMemoryScenarioRevisionRepository();
        $this->handler      = new GetScenarioRevisionHandler(
            new GetScenarioRevisionUseCase($this->revisionRepo),
            $this->json,
        );
    }

    private function req(int $id, int $orgId = 1): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('GET', '/api/v1/scenario-revisions/' . $id)
            ->withAttribute('nene2.org.id', $orgId)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => (string) $id]);
    }

    private function seedRevision(
        int $scenarioId = 1,
        int $orgId = 1,
        ?string $snapshotJson = null,
    ): ScenarioRevision {
        $this->revisionRepo->append(new ScenarioRevision(
            scenarioId:     $scenarioId,
            organizationId: $orgId,
            revisionNo:     1,
            userId:         1,
            userEmail:      'tester@example.com',
            operation:      'create',
            name:           'My Scenario',
            description:    null,
            status:         'draft',
            nodeCount:      2,
            edgeCount:      1,
            snapshotJson:   $snapshotJson,
        ));

        return $this->revisionRepo->store[0];
    }

    // ── 基本レスポンス ─────────────────────────────────────────────────────────

    public function testReturnsRevisionWithNoPrevious(): void
    {
        $rev      = $this->seedRevision();
        $response = $this->handler->handle($this->req($rev->id ?? 1));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertArrayHasKey('revision', $body);
        self::assertNull($body['previous']);

        $r = $body['revision'];
        self::assertSame(1, $r['scenario_id']);
        self::assertSame(1, $r['revision_no']);
        self::assertSame('create', $r['operation']);
        self::assertSame(2, $r['node_count']);
    }

    public function testReturnsPreviousRevisionWhenExists(): void
    {
        $scenarioRepo = new InMemoryScenarioRepository();
        $nodeRepo     = new InMemoryScenarioNodeRepository();
        $edgeRepo     = new InMemoryScenarioEdgeRepository();
        $recorder     = new ScenarioRevisionRecorder($this->revisionRepo, $nodeRepo, $edgeRepo);

        $createUC = new CreateScenarioUseCase($scenarioRepo, $nodeRepo, $edgeRepo, $recorder);
        $updateUC = new UpdateScenarioUseCase($scenarioRepo, $nodeRepo, $edgeRepo, $recorder);
        $id       = $createUC->execute(new CreateScenarioInput(name: 'V1'), 1, $this->actor);
        $updateUC->execute(new UpdateScenarioInput(scenarioId: $id, name: 'V2'), 1, $this->actor);

        // revision 2 を取得
        $rev2Id = $this->revisionRepo->store[1]->id;
        assert($rev2Id !== null);

        $response = $this->handler->handle($this->req($rev2Id));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertNotNull($body['previous']);
        self::assertSame(1, $body['previous']['revision_no']);
    }

    // ── snapshot JSON parsing ─────────────────────────────────────────────────

    public function testSnapshotIsNullWhenRevisionHasNoSnapshot(): void
    {
        $rev      = $this->seedRevision(snapshotJson: null);
        $response = $this->handler->handle($this->req($rev->id ?? 1));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertNull($body['revision']['snapshot']);
    }

    public function testSnapshotIsParsedFromValidJson(): void
    {
        $json     = json_encode(['name' => 'Snap', 'nodes' => [], 'edges' => []]);
        assert($json !== false);
        $rev      = $this->seedRevision(snapshotJson: $json);
        $response = $this->handler->handle($this->req($rev->id ?? 1));
        $body     = json_decode((string) $response->getBody(), true);

        $snapshot = $body['revision']['snapshot'];
        self::assertIsArray($snapshot);
        self::assertSame('Snap', $snapshot['name']);
        self::assertSame([], $snapshot['nodes']);
    }

    public function testSnapshotIsNullForInvalidJson(): void
    {
        $rev      = $this->seedRevision(snapshotJson: 'not-valid-json{{{');
        $response = $this->handler->handle($this->req($rev->id ?? 1));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertNull($body['revision']['snapshot']);
    }

    public function testSnapshotIsNullForEmptyString(): void
    {
        $rev      = $this->seedRevision(snapshotJson: '');
        $response = $this->handler->handle($this->req($rev->id ?? 1));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertNull($body['revision']['snapshot']);
    }
}
