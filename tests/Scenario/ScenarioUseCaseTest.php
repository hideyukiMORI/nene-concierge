<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Auth\ActorContext;
use NeNeConcierge\Scenario\CreateScenarioInput;
use NeNeConcierge\Scenario\CreateScenarioUseCase;
use NeNeConcierge\Scenario\DeleteScenarioUseCase;
use NeNeConcierge\Scenario\GetScenarioUseCase;
use NeNeConcierge\Scenario\ListScenariosUseCase;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioRevisionRecorder;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Scenario\UpdateScenarioInput;
use NeNeConcierge\Scenario\UpdateScenarioUseCase;
use PHPUnit\Framework\TestCase;

final class ScenarioUseCaseTest extends TestCase
{
    private InMemoryScenarioRepository           $scenarioRepo;
    private InMemoryScenarioNodeRepository       $nodeRepo;
    private InMemoryScenarioEdgeRepository       $edgeRepo;
    private InMemoryScenarioRevisionRepository   $revisionRepo;
    private ScenarioRevisionRecorder             $recorder;
    private ActorContext                         $actor;

    protected function setUp(): void
    {
        $this->scenarioRepo = new InMemoryScenarioRepository();
        $this->nodeRepo     = new InMemoryScenarioNodeRepository();
        $this->edgeRepo     = new InMemoryScenarioEdgeRepository();
        $this->revisionRepo = new InMemoryScenarioRevisionRepository();
        $this->recorder     = new ScenarioRevisionRecorder($this->revisionRepo, $this->nodeRepo, $this->edgeRepo);
        $this->actor        = new ActorContext(userId: 1, email: 'tester@example.com');
    }

    private function createUseCase(): CreateScenarioUseCase
    {
        return new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
    }

    private function updateUseCase(): UpdateScenarioUseCase
    {
        return new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo, $this->recorder);
    }

    private function deleteUseCase(): DeleteScenarioUseCase
    {
        return new DeleteScenarioUseCase($this->scenarioRepo, $this->recorder);
    }

    public function testCreateAndListScenarios(): void
    {
        $create = $this->createUseCase();
        $list   = new ListScenariosUseCase($this->scenarioRepo);

        $id1 = $create->execute(new CreateScenarioInput(name: 'Scenario A'), 1, $this->actor);
        $id2 = $create->execute(new CreateScenarioInput(name: 'Scenario B'), 1, $this->actor);
        $create->execute(new CreateScenarioInput(name: 'Other Org'), 2, $this->actor);

        self::assertNotSame($id1, $id2);

        $result = $list->execute(organizationId: 1, limit: 20, offset: 0);
        self::assertSame(2, $result->total);
        self::assertCount(2, $result->items);
    }

    public function testGetScenarioIncludesNodesAndEdges(): void
    {
        $create = $this->createUseCase();
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(
            new CreateScenarioInput(
                name:  'Test',
                nodes: [
                    ['node_id' => 'n1', 'type' => 'message', 'label' => 'Hello'],
                    ['node_id' => 'n2', 'type' => 'end', 'label' => 'Bye'],
                ],
                edges: [
                    ['source_node_id' => 'n1', 'target_node_id' => 'n2', 'label' => 'next'],
                ],
            ),
            1,
            $this->actor,
        );

        $result = $get->execute($id, organizationId: 1);

        self::assertSame('Test', $result->scenario->name);
        self::assertSame(ScenarioStatus::Draft, $result->scenario->status);
        self::assertCount(2, $result->nodes);
        self::assertCount(1, $result->edges);
        self::assertSame('n1', $result->edges[0]->sourceNodeId);
        self::assertSame('n2', $result->edges[0]->targetNodeId);
    }

    public function testGetScenarioThrowsForUnknownId(): void
    {
        $get = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $this->expectException(ScenarioNotFoundException::class);
        $get->execute(scenarioId: 999, organizationId: 1);
    }

    public function testUpdateScenarioName(): void
    {
        $create = $this->createUseCase();
        $update = $this->updateUseCase();
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'Old Name'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'New Name'), 1, $this->actor);

        $result = $get->execute($id, organizationId: 1);
        self::assertSame('New Name', $result->scenario->name);
    }

    public function testUpdateScenarioStatus(): void
    {
        $create = $this->createUseCase();
        $update = $this->updateUseCase();
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'Draft'), 1, $this->actor);

        $updateInput = new UpdateScenarioInput(scenarioId: $id, status: ScenarioStatus::Published);
        $update->execute($updateInput, 1, $this->actor);

        $result = $get->execute($id, organizationId: 1);
        self::assertSame(ScenarioStatus::Published, $result->scenario->status);
    }

    public function testUpdateScenarioReplacesNodes(): void
    {
        $create = $this->createUseCase();
        $update = $this->updateUseCase();
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(
            new CreateScenarioInput(
                name:  'WithNodes',
                nodes: [['node_id' => 'old', 'type' => 'message', 'label' => 'Old']],
            ),
            1,
            $this->actor,
        );

        $update->execute(
            new UpdateScenarioInput(
                scenarioId: $id,
                nodes: [
                    ['node_id' => 'n1', 'type' => 'message', 'label' => 'Start'],
                    ['node_id' => 'n2', 'type' => 'end', 'label' => 'End'],
                ],
            ),
            1,
            $this->actor,
        );

        $result = $get->execute($id, organizationId: 1);
        self::assertCount(2, $result->nodes);

        $nodeIds = array_map(static fn (ScenarioNode $n): string => $n->nodeId, $result->nodes);
        self::assertContains('n1', $nodeIds);
        self::assertContains('n2', $nodeIds);
        self::assertNotContains('old', $nodeIds);
    }

    public function testDeleteScenario(): void
    {
        $create = $this->createUseCase();
        $delete = $this->deleteUseCase();
        $list   = new ListScenariosUseCase($this->scenarioRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'ToDelete'), 1, $this->actor);
        $delete->execute($id, 1, $this->actor);

        $result = $list->execute(organizationId: 1, limit: 20, offset: 0);
        self::assertSame(0, $result->total);
    }

    public function testDeleteScenarioThrowsForUnknownId(): void
    {
        $delete = $this->deleteUseCase();

        $this->expectException(ScenarioNotFoundException::class);
        $delete->execute(999, 1, $this->actor);
    }

    public function testOrganizationIsolation(): void
    {
        $create = $this->createUseCase();
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'Org1 Only'), 1, $this->actor);

        // Org 2 cannot see org 1's scenario
        $this->expectException(ScenarioNotFoundException::class);
        $get->execute($id, organizationId: 2);
    }

    public function testNodeTypeIsPreservedCorrectly(): void
    {
        $create = $this->createUseCase();
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(
            new CreateScenarioInput(
                name:  'Types',
                nodes: [
                    ['node_id' => 'n1', 'type' => 'message', 'label' => 'Msg'],
                    ['node_id' => 'n2', 'type' => 'end', 'label' => 'End'],
                ],
            ),
            1,
            $this->actor,
        );

        $result  = $get->execute($id, organizationId: 1);
        $nodeMap = [];

        foreach ($result->nodes as $node) {
            $nodeMap[$node->nodeId] = $node->type;
        }

        self::assertSame(ScenarioNodeType::Message, $nodeMap['n1']);
        self::assertSame(ScenarioNodeType::End, $nodeMap['n2']);
    }

    public function testRevisionsAreRecordedOnCreateAndUpdate(): void
    {
        $create = $this->createUseCase();
        $update = $this->updateUseCase();

        $id = $create->execute(new CreateScenarioInput(name: 'V1'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'V2'), 1, $this->actor);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, status: ScenarioStatus::Published), 1, $this->actor);

        self::assertCount(3, $this->revisionRepo->store);
        self::assertSame('create', $this->revisionRepo->store[0]->operation);
        self::assertSame('update', $this->revisionRepo->store[1]->operation);
        self::assertSame('status_change', $this->revisionRepo->store[2]->operation);
        self::assertSame('tester@example.com', $this->revisionRepo->store[0]->userEmail);
        self::assertSame(1, $this->revisionRepo->store[0]->userId);
    }
}
