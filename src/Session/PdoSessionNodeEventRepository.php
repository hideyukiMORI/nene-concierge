<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoSessionNodeEventRepository implements SessionNodeEventRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function record(SessionNodeEvent $event): void
    {
        $this->query->insert(
            'INSERT INTO session_node_events (organization_id, session_id, scenario_id, node_id, entered_at, exited_at, branch_taken)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $event->organizationId,
                $event->sessionId,
                $event->scenarioId,
                $event->nodeId,
                $event->enteredAt,
                $event->exitedAt,
                $event->branchTaken,
            ],
        );
    }

    /** @return list<SessionNodeEvent> */
    public function findBySession(string $sessionId, int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM session_node_events WHERE session_id = ? AND organization_id = ? ORDER BY entered_at ASC',
            [$sessionId, $organizationId],
        );

        return array_map($this->hydrate(...), $rows);
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): SessionNodeEvent
    {
        return new SessionNodeEvent(
            sessionId:      (string) $row['session_id'],
            organizationId: (int) $row['organization_id'],
            scenarioId:     (int) $row['scenario_id'],
            nodeId:         (string) $row['node_id'],
            enteredAt:      (string) $row['entered_at'],
            exitedAt:       isset($row['exited_at']) ? (string) $row['exited_at'] : null,
            branchTaken:    isset($row['branch_taken']) ? (string) $row['branch_taken'] : null,
            id:             isset($row['id']) ? (int) $row['id'] : null,
        );
    }
}
