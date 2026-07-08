<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Action\ActionDispatcher;
use NeNeConcierge\Engine\ConditionEvaluator;
use NeNeConcierge\Engine\EngineException;
use NeNeConcierge\Engine\ScenarioEngine;
use NeNeConcierge\Engine\VariableInterpolator;
use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Session\ChatSession;
use NeNeConcierge\Session\SessionOutcome;
use NeNeConcierge\Tests\Action\InMemoryActionLogRepository;
use NeNeConcierge\Tests\Action\SpyActionAdapter;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioEdgeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioNodeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioRepository;
use NeNeConcierge\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

/**
 * ScenarioEngine の境界値テスト。
 *
 * カバレッジ:
 * - start: 空ノードリスト → EngineException
 * - start: 全ノードに入辺あり（サイクル）→ EngineException
 * - step: 終了済みセッション → EngineException
 * - step: 落下済みセッション → EngineException
 * - step: current_node_id = null → EngineException
 * - step: current node が存在しない → EngineException
 * - step: condition ノード出辺なし → EngineException
 * - step: action ノード出辺なしでも step できる（end として機能）
 * - step: action ノードが出力変数をセッションにマージする
 * - step: preview session で action はスキップされる
 * - step: 複数選択肢から正しいエッジを辿る
 */
final class EngineBoundaryTest extends TestCase
{
    private InMemoryScenarioRepository     $scenarioRepo;
    private InMemoryScenarioNodeRepository $nodeRepo;
    private InMemoryScenarioEdgeRepository $edgeRepo;
    private InMemoryChatSessionRepository  $sessionRepo;
    private InMemorySessionNodeEventRepository $eventRepo;
    private InMemoryActionLogRepository    $actionLogRepo;
    private ScenarioEngine                 $engine;

    protected function setUp(): void
    {
        $this->scenarioRepo  = new InMemoryScenarioRepository();
        $this->nodeRepo      = new InMemoryScenarioNodeRepository();
        $this->edgeRepo      = new InMemoryScenarioEdgeRepository();
        $this->sessionRepo   = new InMemoryChatSessionRepository();
        $this->eventRepo     = new InMemorySessionNodeEventRepository();
        $this->actionLogRepo = new InMemoryActionLogRepository();

        $this->engine = $this->makeEngine();
    }

    // ── ヘルパー ──────────────────────────────────────────────────────────────

    private function makeEngine(SpyActionAdapter ...$adapters): ScenarioEngine
    {
        $dispatcher = new ActionDispatcher(array_values($adapters), $this->actionLogRepo, new FixedClock());

        return new ScenarioEngine(
            $this->scenarioRepo,
            $this->nodeRepo,
            $this->edgeRepo,
            $this->sessionRepo,
            $this->eventRepo,
            new ConditionEvaluator(),
            new VariableInterpolator(),
            $dispatcher,
            new FixedClock(),
        );
    }

    private function saveScenario(bool $published = true, int $orgId = 1): int
    {
        return $this->scenarioRepo->save(new Scenario(
            name:           'Test',
            status:         $published ? ScenarioStatus::Published : ScenarioStatus::Draft,
            organizationId: $orgId,
        ));
    }

    private function node(string $nodeId, ScenarioNodeType $type, int $scenarioId, int $orgId = 1): ScenarioNode
    {
        return new ScenarioNode(
            nodeId:         $nodeId,
            scenarioId:     $scenarioId,
            organizationId: $orgId,
            type:           $type,
            label:          $nodeId,
            data:           [],
        );
    }

    private function edge(string $src, string $tgt, int $scenarioId, ?string $label = null, int $orgId = 1): ScenarioEdge
    {
        return new ScenarioEdge(
            sourceNodeId:   $src,
            targetNodeId:   $tgt,
            scenarioId:     $scenarioId,
            organizationId: $orgId,
            label:          $label,
        );
    }

    // ── start: 空ノードリスト ─────────────────────────────────────────────────

    public function testStartThrowsForEmptyNodeList(): void
    {
        $sid = $this->saveScenario();
        // ノードを追加しない

        $this->expectException(EngineException::class);
        $this->engine->start($sid, 1);
    }

    // ── start: サイクル（全ノードに入辺あり） ─────────────────────────────────

    public function testStartThrowsWhenAllNodesHaveIncomingEdges(): void
    {
        $sid = $this->saveScenario();

        $n1 = $this->node('n1', ScenarioNodeType::Message, $sid);
        $n2 = $this->node('n2', ScenarioNodeType::Message, $sid);
        $this->nodeRepo->replaceAll($sid, 1, [$n1, $n2]);

        // n1 → n2 → n1 のサイクル（どちらにも入辺がある）
        $this->edgeRepo->replaceAll($sid, 1, [
            $this->edge('n1', 'n2', $sid),
            $this->edge('n2', 'n1', $sid),
        ]);

        $this->expectException(EngineException::class);
        $this->expectExceptionMessageMatches('/No start node/');
        $this->engine->start($sid, 1);
    }

    // ── step: 終了済みセッション ──────────────────────────────────────────────

    public function testStepThrowsForCompletedSession(): void
    {
        $sid = $this->saveScenario();
        $n1  = $this->node('n1', ScenarioNodeType::Message, $sid);
        $n2  = $this->node('n2', ScenarioNodeType::End, $sid);
        $this->nodeRepo->replaceAll($sid, 1, [$n1, $n2]);
        $this->edgeRepo->replaceAll($sid, 1, [$this->edge('n1', 'n2', $sid)]);

        $result = $this->engine->start($sid, 1);
        // n1 → n2 (End) でセッション完了
        $this->engine->step($result->sessionId, 1, 'n2');

        $this->expectException(EngineException::class);
        $this->engine->step($result->sessionId, 1, 'n2');
    }

    public function testStepThrowsForDroppedSession(): void
    {
        $sid = $this->saveScenario();
        $n1  = $this->node('n1', ScenarioNodeType::Message, $sid);
        $this->nodeRepo->replaceAll($sid, 1, [$n1]);

        $result = $this->engine->start($sid, 1);

        // 手動で dropped に書き換え
        $session = $this->sessionRepo->findById($result->sessionId, 1);
        assert($session !== null);
        $this->sessionRepo->update(new ChatSession(
            id:             $session->id,
            organizationId: $session->organizationId,
            scenarioId:     $session->scenarioId,
            currentNodeId:  $session->currentNodeId,
            outcome:        SessionOutcome::Dropped,
            hasConversion:  false,
            startedAt:      $session->startedAt,
        ));

        $this->expectException(EngineException::class);
        $this->engine->step($result->sessionId, 1, 'n1');
    }

    // ── step: currentNodeId = null ────────────────────────────────────────────

    public function testStepThrowsWhenCurrentNodeIdIsNull(): void
    {
        // セッションを直接 currentNodeId = null で作成
        $sid     = $this->saveScenario();
        $session = new ChatSession(
            id:             'sess-null',
            organizationId: 1,
            scenarioId:     $sid,
            currentNodeId:  null,
            outcome:        SessionOutcome::Active,
            hasConversion:  false,
            startedAt:      date('Y-m-d H:i:s'),
        );
        $this->sessionRepo->save($session);

        $this->expectException(EngineException::class);
        $this->engine->step('sess-null', 1, 'anywhere');
    }

    // ── step: 現在ノードが DB に存在しない ────────────────────────────────────

    public function testStepThrowsWhenCurrentNodeDoesNotExist(): void
    {
        $sid     = $this->saveScenario();
        $session = new ChatSession(
            id:             'sess-ghost',
            organizationId: 1,
            scenarioId:     $sid,
            currentNodeId:  'ghost-node',
            outcome:        SessionOutcome::Active,
            hasConversion:  false,
            startedAt:      date('Y-m-d H:i:s'),
        );
        $this->sessionRepo->save($session);

        $this->expectException(EngineException::class);
        $this->engine->step('sess-ghost', 1, 'anywhere');
    }

    // ── step: condition ノードに出辺なし ──────────────────────────────────────

    public function testStepThrowsWhenConditionNodeHasNoOutgoingEdge(): void
    {
        $sid = $this->saveScenario();

        $cond = new ScenarioNode(
            nodeId:         'cond1',
            scenarioId:     $sid,
            organizationId: 1,
            type:           ScenarioNodeType::Condition,
            label:          'Cond',
            data:           ['conditions' => [['variable' => 'x', 'operator' => 'eq', 'value' => 'y']]],
        );
        $start = $this->node('start', ScenarioNodeType::Message, $sid);

        $this->nodeRepo->replaceAll($sid, 1, [$start, $cond]);
        // start → cond1 の辺のみ。cond1 からの出辺はなし
        $this->edgeRepo->replaceAll($sid, 1, [$this->edge('start', 'cond1', $sid)]);

        $result = $this->engine->start($sid, 1);
        // start から cond1 へ移動（この step はOK）
        $this->engine->step($result->sessionId, 1, 'cond1');

        // cond1 が current になり、そこから解決しようとすると出辺なし → EngineException
        $this->expectException(EngineException::class);
        $this->engine->step($result->sessionId, 1, '');
    }

    // ── step: action ノードの出力変数がセッションにマージされる ───────────────

    public function testActionNodeOutputVariablesMergedIntoSession(): void
    {
        $spy             = new SpyActionAdapter('qr');
        $spy->outputVars = ['qr_url' => 'data:image/png;base64,DUMMY'];
        $engine          = $this->makeEngine($spy);

        $sid = $this->saveScenario();
        $msg = $this->node('msg', ScenarioNodeType::Message, $sid);
        $act = new ScenarioNode(
            nodeId:         'act',
            scenarioId:     $sid,
            organizationId: 1,
            type:           ScenarioNodeType::Action,
            label:          'Action',
            data:           ['adapter' => 'qr', 'params' => ['content' => 'https://example.com']],
        );
        $end = $this->node('end', ScenarioNodeType::End, $sid);

        $this->nodeRepo->replaceAll($sid, 1, [$msg, $act, $end]);
        $this->edgeRepo->replaceAll($sid, 1, [
            $this->edge('msg', 'act', $sid),
            $this->edge('act', 'end', $sid),
        ]);

        $startResult = $engine->start($sid, 1);
        $engine->step($startResult->sessionId, 1, 'act');  // msg → act (action fires)
        $engine->step($startResult->sessionId, 1, 'end');  // act → end

        $session = $this->sessionRepo->findById($startResult->sessionId, 1);
        assert($session !== null);
        self::assertArrayHasKey('qr_url', $session->variables);
        self::assertSame('data:image/png;base64,DUMMY', $session->variables['qr_url']);
    }

    // ── step: 単一ノードシナリオは start で即 Completed ─────────────────────

    public function testSingleEndNodeScenarioCompletesOnStart(): void
    {
        $sid = $this->saveScenario();
        $end = $this->node('end', ScenarioNodeType::End, $sid);
        $this->nodeRepo->replaceAll($sid, 1, [$end]);

        $result  = $this->engine->start($sid, 1);
        $session = $this->sessionRepo->findById($result->sessionId, 1);

        self::assertNotNull($session);
        self::assertSame(SessionOutcome::Completed, $session->outcome);
        self::assertTrue($result->node->isTerminal);
    }

    // ── step: 複数選択肢から正しいエッジを辿る ───────────────────────────────

    public function testStepFollowsCorrectChoiceAmongMultipleEdges(): void
    {
        $sid = $this->saveScenario();
        $q   = $this->node('q', ScenarioNodeType::Message, $sid);
        $a   = $this->node('a', ScenarioNodeType::End, $sid);
        $b   = $this->node('b', ScenarioNodeType::End, $sid);

        $this->nodeRepo->replaceAll($sid, 1, [$q, $a, $b]);
        $this->edgeRepo->replaceAll($sid, 1, [
            $this->edge('q', 'a', $sid, 'Option A'),
            $this->edge('q', 'b', $sid, 'Option B'),
        ]);

        $start = $this->engine->start($sid, 1);

        // Option B を選ぶ
        $step = $this->engine->step($start->sessionId, 1, 'b');
        self::assertSame('b', $step->node->nodeId);
        self::assertTrue($step->node->isTerminal);
    }

    // ── step: 存在しないセッション ────────────────────────────────────────────

    public function testStepThrowsForUnknownSession(): void
    {
        $this->expectException(EngineException::class);
        $this->engine->step('no-such-session', 1, 'anywhere');
    }

    // ── step: 変数補間が step 後のノードラベルに反映される ────────────────────

    public function testStepInterpolatesVariablesInNextNodeLabel(): void
    {
        $sid = $this->saveScenario();

        $q = new ScenarioNode(
            nodeId:         'q',
            scenarioId:     $sid,
            organizationId: 1,
            type:           ScenarioNodeType::Message,
            label:          'What is your name?',
            data:           ['collect_variable' => 'name'],
        );
        $reply = new ScenarioNode(
            nodeId:         'reply',
            scenarioId:     $sid,
            organizationId: 1,
            type:           ScenarioNodeType::End,
            label:          'Hello, {{name}}!',
            data:           [],
        );

        $this->nodeRepo->replaceAll($sid, 1, [$q, $reply]);
        $this->edgeRepo->replaceAll($sid, 1, [$this->edge('q', 'reply', $sid)]);

        $start = $this->engine->start($sid, 1);
        $step  = $this->engine->step($start->sessionId, 1, 'reply', answer: 'Alice');

        self::assertSame('Hello, Alice!', $step->node->label);
    }
}
