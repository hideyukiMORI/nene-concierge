<?php

declare(strict_types=1);

namespace NeNeConcierge\Analytics;

/**
 * Aggregated analytics for a single scenario node over a given period.
 *
 * drop_off_rate = fraction of visitors who entered this node and never reached any next node.
 * branch_percentages is populated for condition nodes: label => fraction.
 */
final readonly class NodeAnalytics
{
    /**
     * @param array<string, float> $branchPercentages label => [0, 1]
     */
    public function __construct(
        public string $nodeId,
        public int    $visitCount,
        public int    $avgDwellMs,
        public float  $dropOffRate,
        public array  $branchPercentages,
    ) {
    }
}
