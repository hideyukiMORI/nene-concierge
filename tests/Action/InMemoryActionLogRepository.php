<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Action;

use NeNeConcierge\Action\ActionLog;
use NeNeConcierge\Action\ActionLogRepositoryInterface;

final class InMemoryActionLogRepository implements ActionLogRepositoryInterface
{
    /** @var list<ActionLog> */
    public array $logs = [];

    public function append(ActionLog $log): void
    {
        $this->logs[] = $log;
    }

    /** @return list<ActionLog> */
    public function findBySession(string $sessionId, int $organizationId): array
    {
        return array_values(array_filter(
            $this->logs,
            static fn (ActionLog $l) => $l->sessionId === $sessionId && $l->organizationId === $organizationId,
        ));
    }

    /** @return list<ActionLog> */
    public function listByOrganization(
        int     $organizationId,
        ?string $adapter    = null,
        ?string $status     = null,
        ?int    $scenarioId = null,
        int     $limit      = 50,
        int     $offset     = 0,
    ): array {
        $filtered = $this->filterLogs($organizationId, $adapter, $status, $scenarioId);

        /** @var list<ActionLog> */
        return array_slice($filtered, $offset, $limit);
    }

    public function countByOrganization(
        int     $organizationId,
        ?string $adapter    = null,
        ?string $status     = null,
        ?int    $scenarioId = null,
    ): int {
        return count($this->filterLogs($organizationId, $adapter, $status, $scenarioId));
    }

    /**
     * @return list<ActionLog>
     */
    private function filterLogs(
        int     $organizationId,
        ?string $adapter,
        ?string $status,
        ?int    $scenarioId,
    ): array {
        $result = [];

        foreach ($this->logs as $l) {
            if ($l->organizationId !== $organizationId) {
                continue;
            }

            if ($adapter !== null && $l->adapter !== $adapter) {
                continue;
            }

            if ($status !== null && $l->status !== $status) {
                continue;
            }

            if ($scenarioId !== null && $l->scenarioId !== $scenarioId) {
                continue;
            }

            $result[] = $l;
        }

        return $result;
    }
}
