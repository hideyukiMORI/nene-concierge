<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Action\ActionDispatcher;
use NeNeConcierge\Action\ActionLogRepositoryInterface;
use NeNeConcierge\Engine\ConditionEvaluator;
use NeNeConcierge\Engine\EngineException;
use NeNeConcierge\Engine\ScenarioEngine;
use NeNeConcierge\Engine\VariableInterpolator;
use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Session\SessionOutcome;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioEdgeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioNodeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioRepository;
use NeNeConcierge\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

final class EnginePhase2Test extends TestCase
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
            new ActionDispatcher([], $this->createStub(ActionLogRepositoryInterface::class), new FixedClock()),
            new FixedClock(),
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function seedScenario(int $orgId = 1, bool $published = true): int
    {
        $scenario = new Scenario(
            name:           'Phase 2 Scenario',
            status:         $published ? ScenarioStatus::Published : ScenarioStatus::Draft,
            organizationId: $orgId,
        );

        return $this->scenarioRepo->save($scenario);
    }

    // ── Condition node tests ──────────────────────────────────────────────────

    public function testConditionNodeFollowsTrueBranchWhenConditionMet(): void
    {
        $id = $this->seedScenario();

        $nodes = [
            new ScenarioNode(
                'ask',
                $id,
                1,
                ScenarioNodeType::Message,
                'Are you a pro user?',
                ['collect_variable' => 'plan']
            ),
            new ScenarioNode('check', $id, 1, ScenarioNodeType::Condition, 'Check plan', [
                'conditions' => [['variable' => 'plan', 'operator' => 'eq', 'value' => 'pro']],
            ]),
            new ScenarioNode('pro_end', $id, 1, ScenarioNodeType::End, 'Welcome, pro user!'),
            new ScenarioNode('free_end', $id, 1, ScenarioNodeType::End, 'Upgrade to pro!'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);

        $edges = [
            new ScenarioEdge($id, 1, 'ask', 'check'),
            new ScenarioEdge($id, 1, 'check', 'pro_end', 'true'),
            new ScenarioEdge($id, 1, 'check', 'free_end', 'false'),
        ];
        $this->edgeRepo->replaceAll($id, 1, $edges);

        $start = $this->engine->start($id, organizationId: 1);
        // Collect variable: answer = 'pro'
        $step1 = $this->engine->step($start->sessionId, 1, 'check', 'pro');
        self::assertSame('check', $step1->node->nodeId);

        // Condition auto-routes — pass empty chosenEdgeTarget
        $step2 = $this->engine->step($start->sessionId, 1, '');
        self::assertSame('pro_end', $step2->node->nodeId);
        self::assertTrue($step2->node->isTerminal);
    }

    public function testConditionNodeFollowsFalseBranchWhenConditionNotMet(): void
    {
        $id = $this->seedScenario();

        $nodes = [
            new ScenarioNode('ask', $id, 1, ScenarioNodeType::Message, 'Plan?', ['collect_variable' => 'plan']),
            new ScenarioNode('check', $id, 1, ScenarioNodeType::Condition, 'Check plan', [
                'conditions' => [['variable' => 'plan', 'operator' => 'eq', 'value' => 'pro']],
            ]),
            new ScenarioNode('pro_end', $id, 1, ScenarioNodeType::End, 'Pro!'),
            new ScenarioNode('free_end', $id, 1, ScenarioNodeType::End, 'Free!'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);

        $edges = [
            new ScenarioEdge($id, 1, 'ask', 'check'),
            new ScenarioEdge($id, 1, 'check', 'pro_end', 'true'),
            new ScenarioEdge($id, 1, 'check', 'free_end', 'false'),
        ];
        $this->edgeRepo->replaceAll($id, 1, $edges);

        $start = $this->engine->start($id, organizationId: 1);
        $this->engine->step($start->sessionId, 1, 'check', 'free');
        $step2 = $this->engine->step($start->sessionId, 1, '');

        self::assertSame('free_end', $step2->node->nodeId);
    }

    public function testConditionBranchTakenIsRecordedInNodeEvent(): void
    {
        $id = $this->seedScenario();

        $nodes = [
            new ScenarioNode('start', $id, 1, ScenarioNodeType::Message, 'Hi', ['collect_variable' => 'plan']),
            new ScenarioNode('check', $id, 1, ScenarioNodeType::Condition, 'Check', [
                'conditions' => [['variable' => 'plan', 'operator' => 'eq', 'value' => 'pro']],
            ]),
            new ScenarioNode('end_pro', $id, 1, ScenarioNodeType::End, 'Pro!'),
            new ScenarioNode('end_free', $id, 1, ScenarioNodeType::End, 'Free!'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);

        $edges = [
            new ScenarioEdge($id, 1, 'start', 'check'),
            new ScenarioEdge($id, 1, 'check', 'end_pro', 'true'),
            new ScenarioEdge($id, 1, 'check', 'end_free', 'false'),
        ];
        $this->edgeRepo->replaceAll($id, 1, $edges);

        $start = $this->engine->start($id, organizationId: 1);
        $this->engine->step($start->sessionId, 1, 'check', 'pro');
        $this->engine->step($start->sessionId, 1, '');

        $events = $this->eventRepo->findBySession($start->sessionId, 1);
        // start, check, end_pro entered
        self::assertCount(3, $events);

        $checkEvent = $events[1];
        self::assertSame('check', $checkEvent->nodeId);
        // check node itself has no branchTaken (it's the node being entered, not the branch source)

        $endEvent = $events[2];
        self::assertSame('end_pro', $endEvent->nodeId);
        self::assertSame('true', $endEvent->branchTaken);
    }

    // ── Variable collection tests ─────────────────────────────────────────────

    public function testAnswerIsStoredAsSessionVariable(): void
    {
        $id = $this->seedScenario();

        $nodes = [
            new ScenarioNode(
                'ask_name',
                $id,
                1,
                ScenarioNodeType::Message,
                'What is your name?',
                ['collect_variable' => 'name']
            ),
            new ScenarioNode('end', $id, 1, ScenarioNodeType::End, 'Hi {{name}}!'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);
        $this->edgeRepo->replaceAll($id, 1, [new ScenarioEdge($id, 1, 'ask_name', 'end')]);

        $start = $this->engine->start($id, organizationId: 1);
        $step  = $this->engine->step($start->sessionId, 1, 'end', 'Alice');

        // The session should have the variable stored
        $session = $this->sessionRepo->findById($start->sessionId, 1);
        self::assertNotNull($session);
        self::assertSame('Alice', $session->variables['name']);

        // And it's interpolated in the label
        self::assertSame('Hi Alice!', $step->node->label);
    }

    public function testAnswerWithoutCollectVariableIsIgnored(): void
    {
        $id = $this->seedScenario();

        $nodes = [
            new ScenarioNode('start', $id, 1, ScenarioNodeType::Message, 'Continue?'), // no collect_variable
            new ScenarioNode('end', $id, 1, ScenarioNodeType::End, 'Done'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);
        $this->edgeRepo->replaceAll($id, 1, [new ScenarioEdge($id, 1, 'start', 'end')]);

        $start = $this->engine->start($id, organizationId: 1);
        $this->engine->step($start->sessionId, 1, 'end', 'some answer');

        $session = $this->sessionRepo->findById($start->sessionId, 1);
        self::assertNotNull($session);
        self::assertSame([], $session->variables);
    }

    public function testVariablesAccumulateAcrossNodes(): void
    {
        $id = $this->seedScenario();

        $nodes = [
            new ScenarioNode('q1', $id, 1, ScenarioNodeType::Message, 'Name?', ['collect_variable' => 'name']),
            new ScenarioNode('q2', $id, 1, ScenarioNodeType::Message, 'Plan?', ['collect_variable' => 'plan']),
            new ScenarioNode('end', $id, 1, ScenarioNodeType::End, 'Hi {{name}}, plan: {{plan}}'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);

        $edges = [
            new ScenarioEdge($id, 1, 'q1', 'q2'),
            new ScenarioEdge($id, 1, 'q2', 'end'),
        ];
        $this->edgeRepo->replaceAll($id, 1, $edges);

        $start = $this->engine->start($id, 1);
        $this->engine->step($start->sessionId, 1, 'q2', 'Alice');
        $step2 = $this->engine->step($start->sessionId, 1, 'end', 'pro');

        self::assertSame('Hi Alice, plan: pro', $step2->node->label);

        $session = $this->sessionRepo->findById($start->sessionId, 1);
        self::assertNotNull($session);
        self::assertSame(['name' => 'Alice', 'plan' => 'pro'], $session->variables);
    }

    // ── Preview tests ─────────────────────────────────────────────────────────

    public function testPreviewWorksOnDraftScenario(): void
    {
        $id = $this->seedScenario(published: false);

        $nodes = [
            new ScenarioNode('start', $id, 1, ScenarioNodeType::Message, 'Hello!'),
            new ScenarioNode('end', $id, 1, ScenarioNodeType::End, 'Bye!'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);
        $this->edgeRepo->replaceAll($id, 1, [new ScenarioEdge($id, 1, 'start', 'end')]);

        // Non-preview should throw because it's a draft
        $this->expectException(EngineException::class);
        $this->engine->start($id, organizationId: 1, preview: false);
    }

    public function testPreviewSessionOutcomeRemainsPreview(): void
    {
        $id = $this->seedScenario(published: false);

        $nodes = [
            new ScenarioNode('start', $id, 1, ScenarioNodeType::Message, 'Hello!'),
            new ScenarioNode('end', $id, 1, ScenarioNodeType::End, 'Bye!'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);
        $this->edgeRepo->replaceAll($id, 1, [new ScenarioEdge($id, 1, 'start', 'end')]);

        $start = $this->engine->start($id, organizationId: 1, preview: true);
        $step  = $this->engine->step($start->sessionId, 1, 'end');

        // Preview sessions never change to Completed
        self::assertSame(SessionOutcome::Preview, $step->outcome);

        $session = $this->sessionRepo->findById($start->sessionId, 1);
        self::assertNotNull($session);
        self::assertSame(SessionOutcome::Preview, $session->outcome);
        self::assertNull($session->endedAt);
    }

    public function testPreviewOnPublishedScenarioAlsoWorks(): void
    {
        $id = $this->seedScenario(published: true);

        $nodes = [
            new ScenarioNode('start', $id, 1, ScenarioNodeType::Message, 'Hi'),
            new ScenarioNode('end', $id, 1, ScenarioNodeType::End, 'Done'),
        ];
        $this->nodeRepo->replaceAll($id, 1, $nodes);
        $this->edgeRepo->replaceAll($id, 1, [new ScenarioEdge($id, 1, 'start', 'end')]);

        $result = $this->engine->start($id, organizationId: 1, preview: true);
        $session = $this->sessionRepo->findById($result->sessionId, 1);

        self::assertNotNull($session);
        self::assertSame(SessionOutcome::Preview, $session->outcome);
    }
}
