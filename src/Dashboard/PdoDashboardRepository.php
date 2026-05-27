<?php

declare(strict_types=1);

namespace NeNeConcierge\Dashboard;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoDashboardRepository implements DashboardRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function getStats(int $organizationId): DashboardStats
    {
        $sessions7d   = $this->countSessions7d($organizationId);
        $converted7d  = $this->countConverted7d($organizationId);
        $convRate     = $sessions7d > 0 ? round($converted7d / $sessions7d * 100, 1) : 0.0;
        $active       = $this->countActiveSessions($organizationId);
        $published    = $this->countPublishedScenarios($organizationId);
        $failures24h  = $this->countActionFailures24h($organizationId);
        $daily        = $this->fetchDailySessions($organizationId);

        return new DashboardStats(
            sessions7d:         $sessions7d,
            converted7d:        $converted7d,
            conversionRate7d:   $convRate,
            activeSessions:     $active,
            publishedScenarios: $published,
            actionFailures24h:  $failures24h,
            dailySessions:      $daily,
        );
    }

    private function countSessions7d(int $orgId): int
    {
        $row = $this->query->fetchAll(
            "SELECT COUNT(*) AS cnt FROM sessions
             WHERE organization_id = ? AND outcome != 'preview'
               AND started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            [$orgId],
        );

        return isset($row[0]) ? (int) $row[0]['cnt'] : 0;
    }

    private function countConverted7d(int $orgId): int
    {
        $row = $this->query->fetchAll(
            "SELECT COUNT(*) AS cnt FROM sessions
             WHERE organization_id = ? AND outcome = 'converted'
               AND started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            [$orgId],
        );

        return isset($row[0]) ? (int) $row[0]['cnt'] : 0;
    }

    private function countActiveSessions(int $orgId): int
    {
        $row = $this->query->fetchAll(
            "SELECT COUNT(*) AS cnt FROM sessions
             WHERE organization_id = ? AND outcome = 'active'",
            [$orgId],
        );

        return isset($row[0]) ? (int) $row[0]['cnt'] : 0;
    }

    private function countPublishedScenarios(int $orgId): int
    {
        $row = $this->query->fetchAll(
            "SELECT COUNT(*) AS cnt FROM scenarios
             WHERE organization_id = ? AND status = 'published'",
            [$orgId],
        );

        return isset($row[0]) ? (int) $row[0]['cnt'] : 0;
    }

    private function countActionFailures24h(int $orgId): int
    {
        $row = $this->query->fetchAll(
            "SELECT COUNT(*) AS cnt FROM action_logs
             WHERE organization_id = ? AND status = 'failure'
               AND executed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
            [$orgId],
        );

        return isset($row[0]) ? (int) $row[0]['cnt'] : 0;
    }

    /**
     * @return list<array{date: string, count: int}>
     */
    private function fetchDailySessions(int $orgId): array
    {
        $rows = $this->query->fetchAll(
            "SELECT DATE(started_at) AS date, COUNT(*) AS cnt
             FROM sessions
             WHERE organization_id = ? AND outcome != 'preview'
               AND started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(started_at)
             ORDER BY date ASC",
            [$orgId],
        );

        $result = [];

        foreach ($rows as $row) {
            $result[] = [
                'date'  => (string) $row['date'],
                'count' => (int) $row['cnt'],
            ];
        }

        /** @var list<array{date: string, count: int}> */
        return $result;
    }
}
