<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Action\ActionDispatcher;
use NeNeConcierge\Engine\ConditionEvaluator;
use NeNeConcierge\Engine\ScenarioEngine;
use NeNeConcierge\Engine\VariableInterpolator;
use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Session\SessionOutcome;
use NeNeConcierge\Tests\Action\InMemoryActionLogRepository;
use NeNeConcierge\Tests\Action\SpyActionAdapter;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioEdgeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioNodeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioRepository;
use PHPUnit\Framework\TestCase;

/**
 * Tests for ScenarioEngine Phase 3: action node execution.
 *
 * Exercises:
 * - action node triggers dispatcher and marks session as converted
 * - failing action node logs failure but session continues
 * - action nodes in preview sessions are skipped
 * - action node auto-follows its outgoing edge
 */
final class EngineActionTest extends TestCase
{
    private InMemoryScenarioRepository     $scenarioRepo;
    private InMemoryScenarioNodeRepository $nodeRepo;
    private InMemoryScenarioEdgeRepository $edgeRepo;
    private InMemoryChatSessionRepository  $sessionRepo;
    private InMemorySessionNodeEventRepository $eventRepo;
    private InMemoryActionLogRepository    $actionLogRepo;

    protected function setUp(): void
    {
        $this->scenarioRepo  = new InMemoryScenarioRepository();
        $this->nodeRepo      = new InMemoryScenarioNodeRepository();
        $this->edgeRepo      = new InMemoryScenarioEdgeRepository();
        $this->sessionRepo   = new InMemoryChatSessionRepository();
        $this->eventRepo     = new InMemorySessionNodeEventRepository();
        $this->actionLogRepo = new InMemoryActionLogRepository();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeEngine(SpyActionAdapter ...$adapters): ScenarioEngine
    {
        $dispatcher = new ActionDispatcher(array_values($adapters), $this->actionLogRepo);

        return new ScenarioEngine(
            $this->scenarioRepo,
            $this->nodeRepo,
            $this->edgeRepo,
            $this->sessionRepo,
            $this->eventRepo,
            new ConditionEvaluator(),
            new VariableInterpolator(),
            $dispatcher,
        );
    }

    /**
     * Builds: message → action → end
     * Returns the auto-assigned scenario id.
     */
    private function seedThreeNodeScenario(int $orgId = 1, bool $published = true): int
    {
        $scenario = new Scenario(
            name:           'Action Scenario',
            status:         $published ? ScenarioStatus::Published : ScenarioStatus::Draft,
            organizationId: $orgId,
        );
        $id = $this->scenarioRepo->save($scenario);

        $this->nodeRepo->replaceAll($id, $orgId, [
            new ScenarioNode('msg-1', $id, $orgId, ScenarioNodeType::Message, 'Hello'),
            new ScenarioNode('action-1', $id, $orgId, ScenarioNodeType::Action, 'Send notification', ['adapter' => 'http']),
            new ScenarioNode('end-1', $id, $orgId, ScenarioNodeType::End, 'Done'),
        ]);

        $this->edgeRepo->replaceAll($id, $orgId, [
            new ScenarioEdge($id, $orgId, 'msg-1', 'action-1', 'next'),
            new ScenarioEdge($id, $orgId, 'action-1', 'end-1', null),
        ]);

        return $id;
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function testActionNodeExecutesAdapterAndSetsConversion(): void
    {
        $adapter = new SpyActionAdapter('http');
        $engine  = $this->makeEngine($adapter);
        $orgId   = 1;

        $scenarioId = $this->seedThreeNodeScenario($orgId);
        $start      = $engine->start($scenarioId, $orgId);

        // step from message → action node
        $engine->step($start->sessionId, $orgId, 'action-1');

        $this->assertTrue($adapter->called, 'Adapter should have been called.');
        $this->assertCount(1, $this->actionLogRepo->logs);
        $this->assertSame('success', $this->actionLogRepo->logs[0]->status);

        // step from action node → end (action auto-follows edge)
        $engine->step($start->sessionId, $orgId, 'end-1');

        $session = $this->sessionRepo->findById($start->sessionId, $orgId);
        $this->assertNotNull($session);
        $this->assertTrue($session->hasConversion, 'Session should be marked as converted after successful action.');
        $this->assertSame(SessionOutcome::Completed, $session->outcome);
    }

    public function testFailingActionNodeLogsFailureAndSessionContinues(): void
    {
        $adapter = new SpyActionAdapter('http', throws: true);
        $engine  = $this->makeEngine($adapter);
        $orgId   = 1;

        $scenarioId = $this->seedThreeNodeScenario($orgId);
        $start      = $engine->start($scenarioId, $orgId);

        // step from message → action (adapter throws but engine absorbs it)
        $engine->step($start->sessionId, $orgId, 'action-1');

        $this->assertTrue($adapter->called);
        $this->assertCount(1, $this->actionLogRepo->logs);
        $this->assertSame('failure', $this->actionLogRepo->logs[0]->status);

        // session is still active — step to end
        $engine->step($start->sessionId, $orgId, 'end-1');

        $session = $this->sessionRepo->findById($start->sessionId, $orgId);
        $this->assertNotNull($session);
        $this->assertFalse($session->hasConversion, 'Session should NOT be marked as converted after failed action.');
        $this->assertSame(SessionOutcome::Completed, $session->outcome);
    }

    public function testActionNodeSkippedInPreviewSession(): void
    {
        $adapter = new SpyActionAdapter('http');
        $engine  = $this->makeEngine($adapter);
        $orgId   = 1;

        $scenarioId = $this->seedThreeNodeScenario($orgId, published: false);   // draft scenario

        $start = $engine->start($scenarioId, $orgId, preview: true);

        // step into action node — adapter must NOT be called
        $engine->step($start->sessionId, $orgId, 'action-1');

        $this->assertFalse($adapter->called, 'Adapter must not be called during preview.');
        $this->assertCount(0, $this->actionLogRepo->logs, 'No action logs expected for preview.');

        $session = $this->sessionRepo->findById($start->sessionId, $orgId);
        $this->assertNotNull($session);
        $this->assertSame(SessionOutcome::Preview, $session->outcome);
    }

    public function testActionNodeViewContainsOutgoingEdgeAsChoice(): void
    {
        $adapter = new SpyActionAdapter('http');
        $engine  = $this->makeEngine($adapter);
        $orgId   = 1;

        $scenarioId = $this->seedThreeNodeScenario($orgId);
        $start      = $engine->start($scenarioId, $orgId);

        // step: message → action
        $stepResult = $engine->step($start->sessionId, $orgId, 'action-1');
        $this->assertSame('action-1', $stepResult->node->nodeId);

        // The action node view should have 'end-1' as its only choice
        $this->assertCount(1, $stepResult->node->choices);
        $this->assertSame('end-1', $stepResult->node->choices[0]->targetNodeId);
    }
}
