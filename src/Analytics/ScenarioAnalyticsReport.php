<?php

declare(strict_types=1);

namespace NeNeConcierge\Analytics;

/**
 * Full analytics report for one scenario over a period.
 */
final readonly class ScenarioAnalyticsReport
{
    /**
     * @param list<NodeAnalytics> $nodes
     * @param list<string>        $bottlenecks  nodeIds with high drop-off
     */
    public function __construct(
        public int    $scenarioId,
        public int    $totalSessions,
        public int    $completedSessions,
        public int    $convertedSessions,
        public string $periodFrom,
        public string $periodTo,
        public array  $nodes,
        public array  $bottlenecks,
    ) {
    }
}
