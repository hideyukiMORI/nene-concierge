<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Scenario\CreateScenarioInput;
use NeNeConcierge\Scenario\CreateScenarioUseCase;
use NeNeConcierge\Scenario\DeleteScenarioUseCase;
use NeNeConcierge\Scenario\GetScenarioUseCase;
use NeNeConcierge\Scenario\ListScenariosUseCase;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Scenario\UpdateScenarioInput;
use NeNeConcierge\Scenario\UpdateScenarioUseCase;
use PHPUnit\Framework\TestCase;

final class ScenarioUseCaseTest extends TestCase
{
    private InMemoryScenarioRepository     $scenarioRepo;
    private InMemoryScenarioNodeRepository $nodeRepo;
    private InMemoryScenarioEdgeRepository $edgeRepo;

    protected function setUp(): void
    {
        $this->scenarioRepo = new InMemoryScenarioRepository();
        $this->nodeRepo     = new InMemoryScenarioNodeRepository();
        $this->edgeRepo     = new InMemoryScenarioEdgeRepository();
    }

    public function testCreateAndListScenarios(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $list   = new ListScenariosUseCase($this->scenarioRepo);

        $id1 = $create->execute(new CreateScenarioInput(name: 'Scenario A'), organizationId: 1);
        $id2 = $create->execute(new CreateScenarioInput(name: 'Scenario B'), organizationId: 1);
        $create->execute(new CreateScenarioInput(name: 'Other Org'), organizationId: 2);

        self::assertNotSame($id1, $id2);

        $result = $list->execute(organizationId: 1, limit: 20, offset: 0);
        self::assertSame(2, $result->total);
        self::assertCount(2, $result->items);
    }

    public function testGetScenarioIncludesNodesAndEdges(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
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
            organizationId: 1,
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
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'Old Name'), organizationId: 1);
        $update->execute(new UpdateScenarioInput(scenarioId: $id, name: 'New Name'), organizationId: 1);

        $result = $get->execute($id, organizationId: 1);
        self::assertSame('New Name', $result->scenario->name);
    }

    public function testUpdateScenarioStatus(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'Draft'), organizationId: 1);

        $updateInput = new UpdateScenarioInput(scenarioId: $id, status: ScenarioStatus::Published);
        $update->execute($updateInput, organizationId: 1);

        $result = $get->execute($id, organizationId: 1);
        self::assertSame(ScenarioStatus::Published, $result->scenario->status);
    }

    public function testUpdateScenarioReplacesNodes(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $update = new UpdateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(
            new CreateScenarioInput(
                name:  'WithNodes',
                nodes: [['node_id' => 'old', 'type' => 'message', 'label' => 'Old']],
            ),
            organizationId: 1,
        );

        $update->execute(
            new UpdateScenarioInput(
                scenarioId: $id,
                nodes: [
                    ['node_id' => 'n1', 'type' => 'message', 'label' => 'Start'],
                    ['node_id' => 'n2', 'type' => 'end', 'label' => 'End'],
                ],
            ),
            organizationId: 1,
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
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $delete = new DeleteScenarioUseCase($this->scenarioRepo);
        $list   = new ListScenariosUseCase($this->scenarioRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'ToDelete'), organizationId: 1);
        $delete->execute($id, organizationId: 1);

        $result = $list->execute(organizationId: 1, limit: 20, offset: 0);
        self::assertSame(0, $result->total);
    }

    public function testDeleteScenarioThrowsForUnknownId(): void
    {
        $delete = new DeleteScenarioUseCase($this->scenarioRepo);

        $this->expectException(ScenarioNotFoundException::class);
        $delete->execute(scenarioId: 999, organizationId: 1);
    }

    public function testOrganizationIsolation(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(new CreateScenarioInput(name: 'Org1 Only'), organizationId: 1);

        // Org 2 cannot see org 1's scenario
        $this->expectException(ScenarioNotFoundException::class);
        $get->execute($id, organizationId: 2);
    }

    public function testNodeTypeIsPreservedCorrectly(): void
    {
        $create = new CreateScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);
        $get    = new GetScenarioUseCase($this->scenarioRepo, $this->nodeRepo, $this->edgeRepo);

        $id = $create->execute(
            new CreateScenarioInput(
                name:  'Types',
                nodes: [
                    ['node_id' => 'n1', 'type' => 'message', 'label' => 'Msg'],
                    ['node_id' => 'n2', 'type' => 'end', 'label' => 'End'],
                ],
            ),
            organizationId: 1,
        );

        $result  = $get->execute($id, organizationId: 1);
        $nodeMap = [];

        foreach ($result->nodes as $node) {
            $nodeMap[$node->nodeId] = $node->type;
        }

        self::assertSame(ScenarioNodeType::Message, $nodeMap['n1']);
        self::assertSame(ScenarioNodeType::End, $nodeMap['n2']);
    }
}
