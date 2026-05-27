<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Dashboard;

use NeNeConcierge\Dashboard\DashboardRepositoryInterface;
use NeNeConcierge\Dashboard\DashboardStats;

final class InMemoryDashboardRepository implements DashboardRepositoryInterface
{
    private DashboardStats $stats;

    public function __construct()
    {
        $this->stats = new DashboardStats(
            sessions7d:         0,
            converted7d:        0,
            conversionRate7d:   0.0,
            activeSessions:     0,
            publishedScenarios: 0,
            actionFailures24h:  0,
            dailySessions:      [],
        );
    }

    public function setStats(DashboardStats $stats): void
    {
        $this->stats = $stats;
    }

    public function getStats(int $organizationId): DashboardStats
    {
        return $this->stats;
    }
}
