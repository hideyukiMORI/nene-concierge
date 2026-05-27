<?php

declare(strict_types=1);

namespace NeNeConcierge\Dashboard;

/**
 * Aggregated KPI statistics for the admin dashboard.
 *
 * @param list<array{date: string, count: int}> $dailySessions
 */
final readonly class DashboardStats
{
    /**
     * @param list<array{date: string, count: int}> $dailySessions
     */
    public function __construct(
        public int   $sessions7d,
        public int   $converted7d,
        public float $conversionRate7d,
        public int   $activeSessions,
        public int   $publishedScenarios,
        public int   $actionFailures24h,
        public array $dailySessions,
    ) {
    }
}
