<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Engine\ConditionEvaluator;
use NeNeConcierge\Engine\EngineException;
use NeNeConcierge\Engine\ScenarioEngine;
use NeNeConcierge\Engine\VariableInterpolator;
use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Session\SessionOutcome;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioEdgeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioNodeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioRepository;
use PHPUnit\Framework\TestCase;

final class EngineTest extends TestCase
{
    private InMemoryScenarioRepository     $scenarioRepo;
    private InMemoryScenarioNodeRepository $nodeRepo;
    private InMemoryScenarioEdgeRepository $edgeRepo;
    private InMemoryChatSessionRepository  $sessionRepo;
    private InMemorySessionNodeEventRepository $eventRepo;
    private ScenarioEngine $engine;

    protected function setUp(): void
    {
        $this->scenarioRepo = new InMemoryScenarioRepository();
        $this->nodeRepo     = new InMemoryScenarioNodeRepository();
        $this->edgeRepo     = new InMemoryScenarioEdgeRepository();
        $this->sessionRepo  = new InMemoryChatSessionRepository();
        $this->eventRepo    = new InMemorySessionNodeEventRepository();

        $this->engine = new ScenarioEngine(
            $this->scenarioRepo,
            $this->nodeRepo,
            $this->edgeRepo,
            $this->sessionRepo,
            $this->eventRepo,
            new ConditionEvaluator(),
            new VariableInterpolator(),
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function seedPublishedScenario(int $orgId = 1): int
    {
        /** @var \NeNeConcierge\Scenario\Scenario $scenario */
        $scenario = new \NeNeConcierge\Scenario\Scenario(
            name:           'Test Scenario',
            status:         ScenarioStatus::Published,
            organizationId: $orgId,
        );
        $id = $this->scenarioRepo->save($scenario);

        $nodes = [
            new ScenarioNode('start', $id, $orgId, ScenarioNodeType::Message, 'Welcome!'),
            new ScenarioNode('q1', $id, $orgId, ScenarioNodeType::Message, 'How can we help?'),
            new ScenarioNode('end', $id, $orgId, ScenarioNodeType::End, 'Thank you!'),
        ];
        $this->nodeRepo->replaceAll($id, $orgId, $nodes);

        $edges = [
            new ScenarioEdge($id, $orgId, 'start', 'q1', 'Continue'),
            new ScenarioEdge($id, $orgId, 'q1', 'end', 'Finish'),
        ];
        $this->edgeRepo->replaceAll($id, $orgId, $edges);

        return $id;
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function testStartSessionReturnsStartNode(): void
    {
        $scenarioId = $this->seedPublishedScenario();

        $result = $this->engine->start($scenarioId, organizationId: 1);

        self::assertNotEmpty($result->sessionId);
        self::assertSame('start', $result->node->nodeId);
        self::assertSame(ScenarioNodeType::Message, $result->node->type);
        self::assertFalse($result->node->isTerminal);
        self::assertCount(1, $result->node->choices);
        self::assertSame('q1', $result->node->choices[0]->targetNodeId);
    }

    public function testStartSessionPersistsSession(): void
    {
        $scenarioId = $this->seedPublishedScenario();

        $result  = $this->engine->start($scenarioId, organizationId: 1);
        $session = $this->sessionRepo->findById($result->sessionId, organizationId: 1);

        self::assertNotNull($session);
        self::assertSame(SessionOutcome::Active, $session->outcome);
        self::assertSame('start', $session->currentNodeId);
    }

    public function testStartSessionRecordsNodeEvent(): void
    {
        $scenarioId = $this->seedPublishedScenario();

        $result = $this->engine->start($scenarioId, organizationId: 1);
        $events = $this->eventRepo->findBySession($result->sessionId, organizationId: 1);

        self::assertCount(1, $events);
        self::assertSame('start', $events[0]->nodeId);
        self::assertNull($events[0]->exitedAt); // not terminal → null
    }

    public function testStartSessionThrowsForDraftScenario(): void
    {
        $scenario = new \NeNeConcierge\Scenario\Scenario(
            name:           'Draft',
            status:         ScenarioStatus::Draft,
            organizationId: 1,
        );
        $id = $this->scenarioRepo->save($scenario);

        $this->expectException(EngineException::class);
        $this->engine->start($id, organizationId: 1);
    }

    public function testStartSessionThrowsForUnknownScenario(): void
    {
        $this->expectException(EngineException::class);
        $this->engine->start(scenarioId: 999, organizationId: 1);
    }

    public function testStepAdvancesToNextNode(): void
    {
        $scenarioId = $this->seedPublishedScenario();

        $startResult = $this->engine->start($scenarioId, organizationId: 1);
        $stepResult  = $this->engine->step($startResult->sessionId, organizationId: 1, chosenEdgeTarget: 'q1');

        self::assertSame('q1', $stepResult->node->nodeId);
        self::assertSame(ScenarioNodeType::Message, $stepResult->node->type);
        self::assertFalse($stepResult->node->isTerminal);
        self::assertSame(SessionOutcome::Active, $stepResult->outcome);
    }

    public function testStepToEndNodeCompletesSession(): void
    {
        $scenarioId = $this->seedPublishedScenario();

        $startResult = $this->engine->start($scenarioId, organizationId: 1);
        $this->engine->step($startResult->sessionId, organizationId: 1, chosenEdgeTarget: 'q1');
        $endResult = $this->engine->step($startResult->sessionId, organizationId: 1, chosenEdgeTarget: 'end');

        self::assertTrue($endResult->node->isTerminal);
        self::assertSame(SessionOutcome::Completed, $endResult->outcome);

        $session = $this->sessionRepo->findById($startResult->sessionId, organizationId: 1);
        self::assertNotNull($session);
        self::assertSame(SessionOutcome::Completed, $session->outcome);
        self::assertNotNull($session->endedAt);
    }

    public function testStepThrowsForInvalidEdge(): void
    {
        $scenarioId = $this->seedPublishedScenario();

        $startResult = $this->engine->start($scenarioId, organizationId: 1);

        $this->expectException(EngineException::class);
        // 'end' is not directly reachable from 'start'
        $this->engine->step($startResult->sessionId, organizationId: 1, chosenEdgeTarget: 'end');
    }

    public function testStepThrowsForCompletedSession(): void
    {
        $scenarioId = $this->seedPublishedScenario();

        $startResult = $this->engine->start($scenarioId, organizationId: 1);
        $this->engine->step($startResult->sessionId, organizationId: 1, chosenEdgeTarget: 'q1');
        $this->engine->step($startResult->sessionId, organizationId: 1, chosenEdgeTarget: 'end');

        $this->expectException(EngineException::class);
        $this->engine->step($startResult->sessionId, organizationId: 1, chosenEdgeTarget: 'q1');
    }

    public function testStartNodeDetectionWithNoIncomingEdge(): void
    {
        // Build a scenario where 'a' has no incoming edges → it's the start
        $scenario = new \NeNeConcierge\Scenario\Scenario(
            name:           'Detect',
            status:         ScenarioStatus::Published,
            organizationId: 1,
        );
        $id = $this->scenarioRepo->save($scenario);

        $nodes = [
            new ScenarioNode('b', $id, 1, ScenarioNodeType::End, 'End'),
            new ScenarioNode('a', $id, 1, ScenarioNodeType::Message, 'Start'), // listed second
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);

        $edges = [new ScenarioEdge($id, 1, 'a', 'b')];
        $this->edgeRepo->replaceAll($id, 1, $edges);

        $result = $this->engine->start($id, organizationId: 1);
        self::assertSame('a', $result->node->nodeId);
    }

    public function testSingleNodeScenarioIsImmediatelyTerminal(): void
    {
        $scenario = new \NeNeConcierge\Scenario\Scenario(
            name:           'OneNode',
            status:         ScenarioStatus::Published,
            organizationId: 1,
        );
        $id = $this->scenarioRepo->save($scenario);

        $nodes = [new ScenarioNode('only', $id, 1, ScenarioNodeType::End, 'Done')];
        $this->nodeRepo->replaceAll($id, 1, $nodes);
        $this->edgeRepo->replaceAll($id, 1, []);

        $result = $this->engine->start($id, organizationId: 1);

        self::assertTrue($result->node->isTerminal);
        self::assertEmpty($result->node->choices);

        $session = $this->sessionRepo->findById($result->sessionId, organizationId: 1);
        self::assertNotNull($session);
        self::assertSame(SessionOutcome::Completed, $session->outcome);

        $events = $this->eventRepo->findBySession($result->sessionId, 1);
        self::assertCount(1, $events);
        self::assertNotNull($events[0]->exitedAt); // terminal → exited_at set
    }
}
