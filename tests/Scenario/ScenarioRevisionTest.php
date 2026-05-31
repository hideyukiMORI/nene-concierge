<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Auth\ActorContext;
use NeNeConcierge\Scenario\CreateScenarioInput;
use NeNeConcierge\Scenario\CreateScenarioUseCase;
use NeNeConcierge\Scenario\GetScenarioRevisionUseCase;
use NeNeConcierge\Scenario\ListScenarioHistoryUseCase;
use NeNeConcierge\Scenario\ListScenarioRevisionsInput;
use NeNeConcierge\Scenario\ListScenarioRevisionsUseCase;
use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioRevisionNotFoundException;
use NeNeConcierge\Scenario\ScenarioRevisionRecorder;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Scenario\UpdateScenarioInput;
use NeNeConcierge\Scenario\UpdateScenarioUseCase;
use PHPUnit\Framework\TestCase;

final class ScenarioRevisionTest extends TestCase
{
    private InMemoryScenarioRepository         $scenarioRepo;
    private InMemoryScenarioNodeRepository     $nodeRepo;
    private InMemoryScenarioEdgeRepository     $edgeRepo;
    private InMemoryScenarioRevisionRepository $revisionRepo;
    private ScenarioRevisionRecorder           $recorder;
    private ActorContext                       $actor;

    protected function setUp(): void
    {
        $this->scenarioRepo = new InMemoryScenarioRepository();
        $this->nodeRepo     = new InMemoryScenarioNodeRepository();
        $this->edgeRepo     = new InMemoryScenarioEdgeRepository();
        $this->revisionRepo = new InMemoryScenarioRevisionRepository();
        $this->recorder     = new ScenarioRevisionRecorder($this->revisionRepo, $this->nodeRepo, $this->edgeRepo);
        $this->actor        = new ActorContext(userId: 1, email: 'tester@example.com');
    }

    // ── ScenarioRevisionRecorder ──────────────────────────────────────────────

    public function testRecorderSkipsWhenScenarioIdIsZero(): void
    {
        $scenario = new Scenario(
            name:           'Ghost',
            status:         ScenarioStatus::Draft,
            organizationId: 1,
            id:             null,  // id = null → scenarioId が 0 になる
        );

        $this->recorder->record($scenario, 'create', $this->actor);
        self::assertCount(0, $this->revisionRepo->store);
    }

    public function testRecorderSavesSnapshotByDefault(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $id     = $create->execute(
            new CreateScenarioInput(
                name:  'Snap',
                nodes: [
                    ['node_id' => 'n1', 'type' => 'message', 'label' => 'Hello'],
                ],
            ),
            1,
            $this->actor,
        );

        $revision = $this->revisionRepo->store[0];
        self::assertNotNull($revision->snapshotJson);

        $snap = json_decode($revision->snapshotJson, true);
        self::assertSame('Snap', $snap['name']);
        self::assertCount(1, $snap['nodes']);
    }

    public function testRecorderSkipsSnapshotWhenFlagFalse(): void
    {
        $scenario = $this->scenarioRepo->findById(
            $this->scenarioRepo->save(new Scenario('S', ScenarioStatus::Draft, 1)),
            1,
        );
        assert($scenario !== null);

        $this->recorder->record($scenario, 'delete', $this->actor, captureSnapshot: false);

        $revision = $this->revisionRepo->store[0];
        self::assertNull($revision->snapshotJson);
        self::assertSame(0, $revision->nodeCount);
        self::assertSame(0, $revision->edgeCount);
    }

    public function testRecorderIncrementsRevisionNo(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);

        $id = $create->execute(new CreateScenarioInput(name: 'V'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'V2'), 1, $this->actor);

        self::assertSame(1, $this->revisionRepo->store[0]->revisionNo);
        self::assertSame(2, $this->revisionRepo->store[1]->revisionNo);
    }

    public function testRecorderStoresActorInfo(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $create->execute(new CreateScenarioInput(name: 'Actor Test'), 1, $this->actor);

        $revision = $this->revisionRepo->store[0];
        self::assertSame(1, $revision->userId);
        self::assertSame('tester@example.com', $revision->userEmail);
    }

    public function testRecorderIsolatesOrganizations(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $create->execute(new CreateScenarioInput(name: 'Org1'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'Org2'), 2, $this->actor);

        $org1 = $this->revisionRepo->countByScenario(1, 1);
        $org2 = $this->revisionRepo->countByScenario(2, 2);

        self::assertSame(1, $org1);
        self::assertSame(1, $org2);
    }

    // ── ListScenarioHistoryUseCase ────────────────────────────────────────────

    public function testListHistoryThrowsForUnknownScenario(): void
    {
        $useCase = new ListScenarioHistoryUseCase($this->scenarioRepo, $this->revisionRepo);

        $this->expectException(ScenarioNotFoundException::class);
        $useCase->execute(scenarioId: 999, organizationId: 1, limit: 10, offset: 0);
    }

    public function testListHistoryReturnsEmptyForNewScenario(): void
    {
        // シナリオは存在するが履歴なし
        $scenarioId = $this->scenarioRepo->save(new Scenario('Empty', ScenarioStatus::Draft, 1));

        $useCase = new ListScenarioHistoryUseCase($this->scenarioRepo, $this->revisionRepo);
        $result  = $useCase->execute($scenarioId, 1, 10, 0);

        self::assertCount(0, $result->items);
        self::assertSame(0, $result->total);
    }

    public function testListHistoryReturnsRevisionsInDescendingOrder(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);

        $id = $create->execute(new CreateScenarioInput(name: 'V1'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'V2'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'V3'), 1, $this->actor);

        $useCase = new ListScenarioHistoryUseCase($this->scenarioRepo, $this->revisionRepo);
        $result  = $useCase->execute($id, 1, 10, 0);

        self::assertSame(3, $result->total);
        self::assertSame(3, $result->items[0]->revisionNo);
        self::assertSame(2, $result->items[1]->revisionNo);
        self::assertSame(1, $result->items[2]->revisionNo);
    }

    public function testListHistoryPaginationLimitOffset(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);

        $id = $create->execute(new CreateScenarioInput(name: 'P'), 1, $this->actor);
        for ($i = 0; $i < 4; $i++) {
            $update->execute(new UpdateScenarioInput(scenarioId: $id, name: "V{$i}"), 1, $this->actor);
        }

        $useCase = new ListScenarioHistoryUseCase($this->scenarioRepo, $this->revisionRepo);
        $page    = $useCase->execute($id, 1, limit: 2, offset: 1);

        self::assertSame(5, $page->total);
        self::assertCount(2, $page->items);
    }

    public function testListHistoryOrganizationIsolation(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $id1    = $create->execute(new CreateScenarioInput(name: 'Org1'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'Org2'), 2, $this->actor);

        $useCase = new ListScenarioHistoryUseCase($this->scenarioRepo, $this->revisionRepo);

        // org 2 は org 1 のシナリオ履歴を見えない
        $this->expectException(ScenarioNotFoundException::class);
        $useCase->execute($id1, organizationId: 2, limit: 10, offset: 0);
    }

    // ── GetScenarioRevisionUseCase ────────────────────────────────────────────

    public function testGetRevisionThrowsForUnknownId(): void
    {
        $useCase = new GetScenarioRevisionUseCase($this->revisionRepo);

        $this->expectException(ScenarioRevisionNotFoundException::class);
        $useCase->execute(id: 999, organizationId: 1);
    }

    public function testGetRevisionReturnsPreviousAsNull(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $id     = $create->execute(new CreateScenarioInput(name: 'First'), 1, $this->actor);

        $revId = $this->revisionRepo->store[0]->id;
        assert($revId !== null);

        $useCase = new GetScenarioRevisionUseCase($this->revisionRepo);
        $result  = $useCase->execute($revId, organizationId: 1);

        self::assertSame($revId, $result->revision->id);
        self::assertNull($result->previous);
    }

    public function testGetRevisionReturnsPreviousRevision(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);

        $id = $create->execute(new CreateScenarioInput(name: 'R1'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'R2'), 1, $this->actor);

        $rev2Id = $this->revisionRepo->store[1]->id;
        assert($rev2Id !== null);

        $useCase = new GetScenarioRevisionUseCase($this->revisionRepo);
        $result  = $useCase->execute($rev2Id, organizationId: 1);

        self::assertNotNull($result->previous);
        self::assertSame(1, $result->previous->revisionNo);
    }

    public function testGetRevisionOrganizationIsolation(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $create->execute(new CreateScenarioInput(name: 'Org1'), 1, $this->actor);

        $revId = $this->revisionRepo->store[0]->id;
        assert($revId !== null);

        $useCase = new GetScenarioRevisionUseCase($this->revisionRepo);

        $this->expectException(ScenarioRevisionNotFoundException::class);
        $useCase->execute($revId, organizationId: 2);  // 別 org
    }

    // ── ListScenarioRevisionsUseCase ──────────────────────────────────────────

    public function testListRevisionsNoFiltersReturnsAll(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $create->execute(new CreateScenarioInput(name: 'A'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'B'), 1, $this->actor);

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);
        $result  = $useCase->execute(new ListScenarioRevisionsInput(organizationId: 1));

        self::assertSame(2, $result->total);
        self::assertCount(2, $result->items);
    }

    public function testListRevisionsFilterByScenarioId(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $id1    = $create->execute(new CreateScenarioInput(name: 'A'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'B'), 1, $this->actor);

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);
        $result  = $useCase->execute(new ListScenarioRevisionsInput(
            organizationId: 1,
            scenarioId:     $id1,
        ));

        self::assertSame(1, $result->total);
        self::assertSame($id1, $result->items[0]->scenarioId);
    }

    public function testListRevisionsFilterByOperation(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);

        $id = $create->execute(new CreateScenarioInput(name: 'S'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'S2'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, status: ScenarioStatus::Published), 1, $this->actor);

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);

        $creates = $useCase->execute(new ListScenarioRevisionsInput(organizationId: 1, operation: 'create'));
        self::assertSame(1, $creates->total);
        self::assertSame('create', $creates->items[0]->operation);

        $statusChanges = $useCase->execute(new ListScenarioRevisionsInput(organizationId: 1, operation: 'status_change'));
        self::assertSame(1, $statusChanges->total);
    }

    public function testListRevisionsFilterByUserId(): void
    {
        $actor2 = new ActorContext(userId: 2, email: 'other@x.com');
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);

        $create->execute(new CreateScenarioInput(name: 'ByUser1'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'ByUser2'), 1, $actor2);

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);
        $result  = $useCase->execute(new ListScenarioRevisionsInput(organizationId: 1, userId: 2));

        self::assertSame(1, $result->total);
        self::assertSame(2, $result->items[0]->userId);
    }

    public function testListRevisionsFilterByKeywordQuery(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $create->execute(new CreateScenarioInput(name: 'Sales Flow'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'Support Bot'), 1, $this->actor);

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);
        $result  = $useCase->execute(new ListScenarioRevisionsInput(organizationId: 1, query: 'sales'));

        self::assertSame(1, $result->total);
        self::assertStringContainsStringIgnoringCase('Sales', $result->items[0]->name ?? '');
    }

    public function testListRevisionsPaginationLimitOffset(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        for ($i = 0; $i < 5; $i++) {
            $create->execute(new CreateScenarioInput(name: "Scenario {$i}"), 1, $this->actor);
        }

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);
        $page    = $useCase->execute(new ListScenarioRevisionsInput(
            organizationId: 1,
            limit:          2,
            offset:         1,
        ));

        self::assertSame(5, $page->total);
        self::assertCount(2, $page->items);
    }

    public function testListRevisionsOrganizationIsolation(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $create->execute(new CreateScenarioInput(name: 'Org1 Only'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'Org2 Only'), 2, $this->actor);

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);
        $result  = $useCase->execute(new ListScenarioRevisionsInput(organizationId: 1));

        self::assertSame(1, $result->total);
    }

    public function testListRevisionsEmptyQueryFilterIsIgnored(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
        $create->execute(new CreateScenarioInput(name: 'Foo'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'Bar'), 1, $this->actor);

        $useCase = new ListScenarioRevisionsUseCase($this->revisionRepo);
        $result  = $useCase->execute(new ListScenarioRevisionsInput(organizationId: 1, query: ''));

        self::assertSame(2, $result->total);
    }
}
