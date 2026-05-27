<?php

declare(strict_types=1);

namespace NeNeConcierge\Analytics;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioRepositoryInterface;

/**
 * Aggregates session_node_events and sessions for a given scenario + period.
 *
 * Excludes 'preview' sessions from all counts.
 *
 * Period resolution:
 *   1d  → last 24 h
 *   7d  → last 7 days
 *   30d → last 30 days
 *   90d → last 90 days
 *   custom → requires from + to (Y-m-d)
 *
 * Bottleneck threshold: drop_off_rate >= 0.5 (configurable).
 */
final readonly class ScenarioAnalyticsUseCase
{
    private const BOTTLENECK_THRESHOLD = 0.5;

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private ScenarioRepositoryInterface    $scenarios,
    ) {
    }

    public function execute(
        int     $scenarioId,
        int     $organizationId,
        string  $period = '7d',
        ?string $from   = null,
        ?string $to     = null,
    ): ScenarioAnalyticsReport {
        // Verify scenario exists
        $scenario = $this->scenarios->findById($scenarioId, $organizationId);

        if ($scenario === null) {
            throw new ScenarioNotFoundException($scenarioId);
        }

        [$fromDate, $toDate] = $this->resolvePeriod($period, $from, $to);

        // Session totals (exclude preview)
        $sessionRow = $this->query->fetchOne(
            "SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN outcome = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN outcome = 'converted' THEN 1 ELSE 0 END) AS converted
             FROM sessions
             WHERE scenario_id = ?
               AND organization_id = ?
               AND outcome != 'preview'
               AND started_at BETWEEN ? AND ?",
            [$scenarioId, $organizationId, $fromDate, $toDate],
        );

        $totalSessions     = (int) ($sessionRow['total'] ?? 0);
        $completedSessions = (int) ($sessionRow['completed'] ?? 0);
        $convertedSessions = (int) ($sessionRow['converted'] ?? 0);

        // Per-node aggregates
        $nodeRows = $this->query->fetchAll(
            "SELECT
                sne.node_id,
                COUNT(*) AS visit_count,
                AVG(CASE
                    WHEN sne.exited_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MICROSECOND, sne.entered_at, sne.exited_at) / 1000
                    ELSE NULL
                END) AS avg_dwell_ms,
                SUM(CASE WHEN sne.exited_at IS NULL THEN 1 ELSE 0 END) AS drop_count,
                sne.branch_taken
             FROM session_node_events sne
             INNER JOIN sessions s ON s.id = sne.session_id
             WHERE sne.scenario_id = ?
               AND sne.organization_id = ?
               AND s.outcome != 'preview'
               AND sne.entered_at BETWEEN ? AND ?
             GROUP BY sne.node_id, sne.branch_taken",
            [$scenarioId, $organizationId, $fromDate, $toDate],
        );

        $nodes = $this->aggregateNodes($nodeRows);
        $bottlenecks = array_values(array_map(
            static fn (NodeAnalytics $n): string => $n->nodeId,
            array_filter($nodes, static fn (NodeAnalytics $n) => $n->dropOffRate >= self::BOTTLENECK_THRESHOLD),
        ));

        return new ScenarioAnalyticsReport(
            scenarioId:        $scenarioId,
            totalSessions:     $totalSessions,
            completedSessions: $completedSessions,
            convertedSessions: $convertedSessions,
            periodFrom:        $fromDate,
            periodTo:          $toDate,
            nodes:             $nodes,
            bottlenecks:       $bottlenecks,
        );
    }

    /**
     * @return array{string, string}  [from, to] as 'Y-m-d H:i:s' strings
     */
    private function resolvePeriod(string $period, ?string $from, ?string $to): array
    {
        if ($period === 'custom') {
            $fromDate = ($from ?? date('Y-m-d', strtotime('-7 days'))) . ' 00:00:00';
            $toDate   = ($to ?? date('Y-m-d')) . ' 23:59:59';

            return [$fromDate, $toDate];
        }

        $days = match ($period) {
            '1d'    => 1,
            '30d'   => 30,
            '90d'   => 90,
            default => 7,
        };

        return [
            date('Y-m-d H:i:s', strtotime("-{$days} days")),
            date('Y-m-d H:i:s'),
        ];
    }

    /**
     * @param list<array<string, mixed>> $rows  Raw grouped rows from the DB
     *
     * @return list<NodeAnalytics>
     */
    private function aggregateNodes(array $rows): array
    {
        /** @var array<string, array{visits: int, dwell_sum: int, dwell_count: int, drops: int, branches: array<string, int>}> $byNode */
        $byNode = [];

        foreach ($rows as $row) {
            $nodeId     = (string) $row['node_id'];
            $visits     = (int) $row['visit_count'];
            $drops      = (int) $row['drop_count'];
            $dwellMs    = $row['avg_dwell_ms'] !== null ? (int) round((float) $row['avg_dwell_ms']) : null;
            $branchTaken = isset($row['branch_taken']) ? (string) $row['branch_taken'] : null;

            if (!isset($byNode[$nodeId])) {
                $byNode[$nodeId] = ['visits' => 0, 'dwell_sum' => 0, 'dwell_count' => 0, 'drops' => 0, 'branches' => []];
            }

            $byNode[$nodeId]['visits'] += $visits;
            $byNode[$nodeId]['drops']  += $drops;

            if ($dwellMs !== null) {
                $byNode[$nodeId]['dwell_sum']   += $dwellMs * $visits;
                $byNode[$nodeId]['dwell_count'] += $visits;
            }

            if ($branchTaken !== null) {
                $byNode[$nodeId]['branches'][$branchTaken] = ($byNode[$nodeId]['branches'][$branchTaken] ?? 0) + $visits;
            }
        }

        $result = [];

        foreach ($byNode as $nodeId => $agg) {
            $visits     = $agg['visits'];
            $drops      = $agg['drops'];
            $dropOffRate = $visits > 0 ? round($drops / $visits, 4) : 0.0;
            $avgDwellMs  = $agg['dwell_count'] > 0 ? (int) round($agg['dwell_sum'] / $agg['dwell_count']) : 0;

            $branchPercentages = [];

            foreach ($agg['branches'] as $label => $count) {
                $branchPercentages[$label] = $visits > 0 ? round($count / $visits, 4) : 0.0;
            }

            $result[] = new NodeAnalytics(
                nodeId:            $nodeId,
                visitCount:        $visits,
                avgDwellMs:        $avgDwellMs,
                dropOffRate:       $dropOffRate,
                branchPercentages: $branchPercentages,
            );
        }

        return $result;
    }
}
