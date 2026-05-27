<?php

declare(strict_types=1);

namespace NeNeConcierge\Dashboard;

interface DashboardRepositoryInterface
{
    public function getStats(int $organizationId): DashboardStats;
}
