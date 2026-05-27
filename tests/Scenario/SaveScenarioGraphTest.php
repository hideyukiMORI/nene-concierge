<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use Nene2\Routing\Router;
use Nene2\Validation\ValidationException;
use NeNeConcierge\Scenario\SaveScenarioGraphEdgeInput;
use NeNeConcierge\Scenario\SaveScenarioGraphHandler;
use NeNeConcierge\Scenario\SaveScenarioGraphInput;
use NeNeConcierge\Scenario\SaveScenarioGraphNodeInput;
use NeNeConcierge\Scenario\SaveScenarioGraphUseCase;
use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioStatus;
use PHPUnit\Framework\TestCase;

final class SaveScenarioGraphTest extends TestCase
{
    private const int ORG = 1;

    private InMemoryScenarioRepository     $scenarioRepo;
    private InMemoryScenarioNodeRepository $nodeRepo;
    private InMemoryScenarioEdgeRepository $edgeRepo;
    private SaveScenarioGraphUseCase       $useCase;

    protected function setUp(): void
    {
        $this->scenarioRepo = new InMemoryScenarioRepository();
        $this->nodeRepo     = new InMemoryScenarioNodeRepository();
        $this->edgeRepo     = new InMemoryScenarioEdgeRepository();
        $this->useCase      = new SaveScenarioGraphUseCase(
            $this->scenarioRepo,
            $this->nodeRepo,
            $this->edgeRepo,
        );
    }

    private function seedScenario(int $id = 1): Scenario
    {
        $scenario = new Scenario(
            id:             $id,
            organizationId: self::ORG,
            name:           'Test',
            description:    null,
            status:         ScenarioStatus::Draft,
            createdAt:      null,
            updatedAt:      null,
        );
        $this->scenarioRepo->save($scenario);

        return $scenario;
    }

    // ── happy path ────────────────────────────────────────────────────────────

    public function testSaveEmptyGraphClearsExisting(): void
    {
        $this->seedScenario();

        $this->useCase->execute(new SaveScenarioGraphInput(
            scenarioId:     1,
            organizationId: self::ORG,
            nodes:          [],
            edges:          [],
        ));

        self::assertEmpty($this->nodeRepo->findByScenario(1, self::ORG));
        self::assertEmpty($this->edgeRepo->findByScenario(1, self::ORG));
    }

    public function testSaveNodesAndEdges(): void
    {
        $this->seedScenario();

        $this->useCase->execute(new SaveScenarioGraphInput(
            scenarioId:     1,
            organizationId: self::ORG,
            nodes:          [
                new SaveScenarioGraphNodeInput(
                    nodeId:    'aaa',
                    type:      ScenarioNodeType::Message,
                    label:     'Hello',
                    data:      ['text' => 'Hi there'],
                    positionX: 100.0,
                    positionY: 200.0,
                ),
                new SaveScenarioGraphNodeInput(
                    nodeId:    'bbb',
                    type:      ScenarioNodeType::End,
                    label:     'Done',
                    data:      [],
                    positionX: 300.0,
                    positionY: 200.0,
                ),
            ],
            edges:          [
                new SaveScenarioGraphEdgeInput('aaa', 'bbb', null),
            ],
        ));

        $nodes = $this->nodeRepo->findByScenario(1, self::ORG);
        $edges = $this->edgeRepo->findByScenario(1, self::ORG);

        self::assertCount(2, $nodes);
        self::assertCount(1, $edges);
        self::assertSame('aaa', $nodes[0]->nodeId);
        self::assertSame('bbb', $nodes[1]->nodeId);
        self::assertSame('aaa', $edges[0]->sourceNodeId);
        self::assertSame('bbb', $edges[0]->targetNodeId);
    }

    public function testReplaceExistingGraph(): void
    {
        $this->seedScenario();

        // First save: 3 nodes
        $this->useCase->execute(new SaveScenarioGraphInput(
            scenarioId:     1,
            organizationId: self::ORG,
            nodes:          [
                new SaveScenarioGraphNodeInput('n1', ScenarioNodeType::Message, 'A', [], 0, 0),
                new SaveScenarioGraphNodeInput('n2', ScenarioNodeType::Message, 'B', [], 0, 0),
                new SaveScenarioGraphNodeInput('n3', ScenarioNodeType::End, 'C', [], 0, 0),
            ],
            edges:          [
                new SaveScenarioGraphEdgeInput('n1', 'n2', null),
                new SaveScenarioGraphEdgeInput('n2', 'n3', null),
            ],
        ));

        // Second save: 2 nodes (replace)
        $this->useCase->execute(new SaveScenarioGraphInput(
            scenarioId:     1,
            organizationId: self::ORG,
            nodes:          [
                new SaveScenarioGraphNodeInput('x1', ScenarioNodeType::Message, 'Start', [], 0, 0),
                new SaveScenarioGraphNodeInput('x2', ScenarioNodeType::End, 'Fin', [], 0, 0),
            ],
            edges:          [
                new SaveScenarioGraphEdgeInput('x1', 'x2', 'go'),
            ],
        ));

        $nodes = $this->nodeRepo->findByScenario(1, self::ORG);
        $edges = $this->edgeRepo->findByScenario(1, self::ORG);

        self::assertCount(2, $nodes);
        self::assertSame('x1', $nodes[0]->nodeId);
        self::assertCount(1, $edges);
        self::assertSame('go', $edges[0]->label);
    }

    public function testNodeDataIsPreserved(): void
    {
        $this->seedScenario();

        $data = ['text' => 'Welcome!', 'choices' => ['Yes', 'No']];

        $this->useCase->execute(new SaveScenarioGraphInput(
            scenarioId:     1,
            organizationId: self::ORG,
            nodes:          [
                new SaveScenarioGraphNodeInput('n1', ScenarioNodeType::Message, 'Msg', $data, 50.0, 75.0),
            ],
            edges:          [],
        ));

        $node = $this->nodeRepo->findByNodeId('n1', 1, self::ORG);

        self::assertNotNull($node);
        self::assertSame($data, $node->data);
        self::assertSame(50.0, $node->positionX);
        self::assertSame(75.0, $node->positionY);
    }

    // ── error cases ───────────────────────────────────────────────────────────

    public function testThrowsWhenScenarioNotFound(): void
    {
        $this->expectException(ScenarioNotFoundException::class);

        $this->useCase->execute(new SaveScenarioGraphInput(
            scenarioId:     999,
            organizationId: self::ORG,
            nodes:          [],
            edges:          [],
        ));
    }

    public function testValidationErrorOnInvalidNodeType(): void
    {
        $this->expectException(ValidationException::class);

        $psr17   = new \Nyholm\Psr7\Factory\Psr17Factory();
        $json    = new \Nene2\Http\JsonResponseFactory($psr17, $psr17);
        $handler = new SaveScenarioGraphHandler($this->useCase, $json);

        $request = $psr17
            ->createServerRequest('PUT', '/api/v1/scenarios/1/graph')
            ->withAttribute('nene2.org.id', 1)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => '1'])
            ->withParsedBody([
                'nodes' => [
                    [
                        'node_id' => 'n1',
                        'type'    => 'invalid_type',
                        'label'   => 'Test',
                        'data'    => [],
                    ],
                ],
                'edges' => [],
            ]);

        $handler->handle($request);
    }

    public function testValidationErrorOnMissingNodeId(): void
    {
        $this->expectException(ValidationException::class);

        $psr17   = new \Nyholm\Psr7\Factory\Psr17Factory();
        $json    = new \Nene2\Http\JsonResponseFactory($psr17, $psr17);
        $handler = new SaveScenarioGraphHandler($this->useCase, $json);

        $request = $psr17
            ->createServerRequest('PUT', '/api/v1/scenarios/1/graph')
            ->withAttribute('nene2.org.id', 1)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => '1'])
            ->withParsedBody([
                'nodes' => [
                    [
                        'type'  => 'message',
                        'label' => 'No ID',
                        'data'  => [],
                    ],
                ],
                'edges' => [],
            ]);

        $handler->handle($request);
    }
}
