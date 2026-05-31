<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Analytics;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeNeConcierge\Analytics\ScenarioAnalyticsUseCase;
use NeNeConcierge\Auth\ActorContext;
use NeNeConcierge\Scenario\CreateScenarioInput;
use NeNeConcierge\Scenario\CreateScenarioUseCase;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioRevisionRecorder;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioEdgeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioNodeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioRevisionRepository;
use PHPUnit\Framework\TestCase;

/**
 * ScenarioAnalyticsUseCase のテスト。
 *
 * DB アクセスは DatabaseQueryExecutorInterface のモックで差し替える。
 * aggregateNodes() / resolvePeriod() はプライベートのため execute() 経由で検証する。
 */
final class ScenarioAnalyticsUseCaseTest extends TestCase
{
    private InMemoryScenarioRepository $scenarioRepo;
    private int                        $scenarioId;

    protected function setUp(): void
    {
        $nodeRepo     = new InMemoryScenarioNodeRepository();
        $edgeRepo     = new InMemoryScenarioEdgeRepository();
        $revisionRepo = new InMemoryScenarioRevisionRepository();
        $recorder     = new ScenarioRevisionRecorder($revisionRepo, $nodeRepo, $edgeRepo);
        $actor        = new ActorContext(userId: 1, email: 'tester@example.com');

        $this->scenarioRepo = new InMemoryScenarioRepository();
        $createUC           = new CreateScenarioUseCase($this->scenarioRepo, $nodeRepo, $edgeRepo, $recorder);
        $this->scenarioId   = $createUC->execute(new CreateScenarioInput(name: 'Analytics Test'), 1, $actor);
    }

    // ── ヘルパー ──────────────────────────────────────────────────────────────

    /**
     * DatabaseQueryExecutorInterface モックを生成し、セッション集計 + ノード集計の
     * 戻り値を設定する。
     *
     * @param array<string, mixed>   $sessionRow  fetchOne() が返す行
     * @param list<array<string, mixed>> $nodeRows fetchAll() が返す行リスト
     */
    private function makeExecutor(array $sessionRow, array $nodeRows = []): DatabaseQueryExecutorInterface
    {
        $executor = $this->createMock(DatabaseQueryExecutorInterface::class);

        $executor->method('fetchOne')->willReturn($sessionRow);
        $executor->method('fetchAll')->willReturn($nodeRows);

        return $executor;
    }

    private function makeUseCase(DatabaseQueryExecutorInterface $executor): ScenarioAnalyticsUseCase
    {
        return new ScenarioAnalyticsUseCase($executor, $this->scenarioRepo);
    }

    // ── 基本動作 ──────────────────────────────────────────────────────────────

    public function testThrowsScenarioNotFoundForUnknownScenario(): void
    {
        $executor = $this->makeExecutor([]);
        $useCase  = $this->makeUseCase($executor);

        $this->expectException(ScenarioNotFoundException::class);
        $useCase->execute(scenarioId: 999, organizationId: 1);
    }

    public function testReturnsReportWithCorrectScenarioId(): void
    {
        $executor = $this->makeExecutor(['total' => 10, 'completed' => 8, 'converted' => 3]);
        $useCase  = $this->makeUseCase($executor);

        $report = $useCase->execute($this->scenarioId, 1);

        self::assertSame($this->scenarioId, $report->scenarioId);
    }

    public function testReturnsSessionTotals(): void
    {
        $executor = $this->makeExecutor(['total' => 50, 'completed' => 40, 'converted' => 10]);
        $useCase  = $this->makeUseCase($executor);

        $report = $useCase->execute($this->scenarioId, 1);

        self::assertSame(50, $report->totalSessions);
        self::assertSame(40, $report->completedSessions);
        self::assertSame(10, $report->convertedSessions);
    }

    public function testReturnsZeroSessionsWhenNoData(): void
    {
        $executor = $this->makeExecutor(['total' => null, 'completed' => null, 'converted' => null]);
        $useCase  = $this->makeUseCase($executor);

        $report = $useCase->execute($this->scenarioId, 1);

        self::assertSame(0, $report->totalSessions);
        self::assertSame(0, $report->completedSessions);
        self::assertSame(0, $report->convertedSessions);
    }

    public function testReturnsEmptyNodesAndBottlenecksWhenNoEvents(): void
    {
        $executor = $this->makeExecutor(['total' => 5, 'completed' => 5, 'converted' => 0], []);
        $useCase  = $this->makeUseCase($executor);

        $report = $useCase->execute($this->scenarioId, 1);

        self::assertSame([], $report->nodes);
        self::assertSame([], $report->bottlenecks);
    }

    // ── ノード集計 ────────────────────────────────────────────────────────────

    public function testAggregatesNodeVisitCountAndDropOff(): void
    {
        $nodeRows = [
            [
                'node_id'      => 'n1',
                'visit_count'  => 10,
                'avg_dwell_ms' => 500,
                'drop_count'   => 2,
                'branch_taken' => null,
            ],
        ];

        $executor = $this->makeExecutor(['total' => 10, 'completed' => 8, 'converted' => 0], $nodeRows);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1);

        self::assertCount(1, $report->nodes);
        $node = $report->nodes[0];
        self::assertSame('n1', $node->nodeId);
        self::assertSame(10, $node->visitCount);
        self::assertSame(500, $node->avgDwellMs);
        self::assertSame(0.2, $node->dropOffRate);   // 2/10 = 0.2
    }

    public function testMergesMultipleRowsForSameNodeId(): void
    {
        // 同一ノードが branch_taken 別に 2 行出てくるケース
        $nodeRows = [
            ['node_id' => 'cond1', 'visit_count' => 6, 'avg_dwell_ms' => 100, 'drop_count' => 0, 'branch_taken' => 'true'],
            ['node_id' => 'cond1', 'visit_count' => 4, 'avg_dwell_ms' => 200, 'drop_count' => 1, 'branch_taken' => 'false'],
        ];

        $executor = $this->makeExecutor(['total' => 10, 'completed' => 9, 'converted' => 0], $nodeRows);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1);

        self::assertCount(1, $report->nodes);
        $node = $report->nodes[0];
        self::assertSame(10, $node->visitCount);   // 6 + 4
        self::assertSame(1, $node->dropOffRate > 0 ? 1 : 0);  // drops > 0

        self::assertArrayHasKey('true', $node->branchPercentages);
        self::assertArrayHasKey('false', $node->branchPercentages);
        self::assertEqualsWithDelta(0.6, $node->branchPercentages['true'], 0.001);
        self::assertEqualsWithDelta(0.4, $node->branchPercentages['false'], 0.001);
    }

    public function testBottleneckDetectedWhenDropOffRateAtLeast50Percent(): void
    {
        $nodeRows = [
            ['node_id' => 'bad', 'visit_count' => 10, 'avg_dwell_ms' => null, 'drop_count' => 5, 'branch_taken' => null],  // 50% → bottleneck
            ['node_id' => 'ok',  'visit_count' => 10, 'avg_dwell_ms' => null, 'drop_count' => 4, 'branch_taken' => null],  // 40% → not bottleneck
        ];

        $executor = $this->makeExecutor(['total' => 10, 'completed' => 5, 'converted' => 0], $nodeRows);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1);

        self::assertContains('bad', $report->bottlenecks);
        self::assertNotContains('ok', $report->bottlenecks);
    }

    public function testBottleneckThresholdIsExclusive49Percent(): void
    {
        // 49% は閾値未満 → bottleneck にならない
        $nodeRows = [
            ['node_id' => 'n', 'visit_count' => 100, 'avg_dwell_ms' => null, 'drop_count' => 49, 'branch_taken' => null],
        ];

        $executor = $this->makeExecutor(['total' => 100, 'completed' => 51, 'converted' => 0], $nodeRows);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1);

        self::assertNotContains('n', $report->bottlenecks);
    }

    public function testDropOffRateIsZeroWhenZeroVisits(): void
    {
        $nodeRows = [
            ['node_id' => 'n', 'visit_count' => 0, 'avg_dwell_ms' => null, 'drop_count' => 0, 'branch_taken' => null],
        ];

        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0], $nodeRows);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1);

        self::assertSame(0.0, $report->nodes[0]->dropOffRate);
    }

    public function testAvgDwellMsIsZeroWhenNullFromDb(): void
    {
        $nodeRows = [
            ['node_id' => 'n', 'visit_count' => 5, 'avg_dwell_ms' => null, 'drop_count' => 0, 'branch_taken' => null],
        ];

        $executor = $this->makeExecutor(['total' => 5, 'completed' => 5, 'converted' => 0], $nodeRows);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1);

        self::assertSame(0, $report->nodes[0]->avgDwellMs);
    }

    // ── 期間解決 ──────────────────────────────────────────────────────────────

    public function testPeriod7dIsDefault(): void
    {
        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0]);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1, '7d');

        // periodFrom は約 7 日前、periodTo は現在に近い
        $from = strtotime($report->periodFrom);
        $to   = strtotime($report->periodTo);

        self::assertGreaterThan(0, $from);
        self::assertGreaterThan($from, $to);
        self::assertEqualsWithDelta(7 * 86400, $to - $from, 5);  // ±5 秒
    }

    public function testPeriod1d(): void
    {
        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0]);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1, '1d');

        $diff = strtotime($report->periodTo) - strtotime($report->periodFrom);
        self::assertEqualsWithDelta(86400, $diff, 5);
    }

    public function testPeriod30d(): void
    {
        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0]);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1, '30d');

        $diff = strtotime($report->periodTo) - strtotime($report->periodFrom);
        self::assertEqualsWithDelta(30 * 86400, $diff, 5);
    }

    public function testPeriod90d(): void
    {
        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0]);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1, '90d');

        $diff = strtotime($report->periodTo) - strtotime($report->periodFrom);
        self::assertEqualsWithDelta(90 * 86400, $diff, 5);
    }

    public function testCustomPeriodWithExplicitDates(): void
    {
        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0]);
        $report   = $this->makeUseCase($executor)->execute(
            $this->scenarioId,
            1,
            'custom',
            from: '2026-01-01',
            to:   '2026-01-31',
        );

        self::assertStringStartsWith('2026-01-01', $report->periodFrom);
        self::assertStringStartsWith('2026-01-31', $report->periodTo);
    }

    public function testCustomPeriodFallsBackToDefaults(): void
    {
        // from/to が null の場合はデフォルト（-7 days〜today）が適用される
        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0]);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1, 'custom');

        $diff = strtotime($report->periodTo) - strtotime($report->periodFrom);
        // '2026-01-31 23:59:59' - '2026-01-01 00:00:00' ではなく今日 - 7 days
        self::assertGreaterThan(0, $diff);
    }

    public function testUnknownPeriodDefaultsTo7d(): void
    {
        $executor = $this->makeExecutor(['total' => 0, 'completed' => 0, 'converted' => 0]);
        $report   = $this->makeUseCase($executor)->execute($this->scenarioId, 1, 'invalid-period');

        $diff = strtotime($report->periodTo) - strtotime($report->periodFrom);
        self::assertEqualsWithDelta(7 * 86400, $diff, 5);
    }
}
