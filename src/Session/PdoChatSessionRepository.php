<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoChatSessionRepository implements ChatSessionRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findById(string $id, int $organizationId): ?ChatSession
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM sessions WHERE id = ? AND organization_id = ? LIMIT 1',
            [$id, $organizationId],
        );

        return $row !== null ? $this->hydrate($row) : null;
    }

    public function save(ChatSession $session): void
    {
        $this->query->execute(
            'INSERT INTO sessions (id, organization_id, scenario_id, current_node_id, outcome, has_conversion, started_at, ended_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [
                $session->id,
                $session->organizationId,
                $session->scenarioId,
                $session->currentNodeId,
                $session->outcome->value,
                (int) $session->hasConversion,
                $session->startedAt,
                $session->endedAt,
            ],
        );
    }

    public function update(ChatSession $session): void
    {
        $this->query->execute(
            'UPDATE sessions SET current_node_id = ?, outcome = ?, has_conversion = ?, ended_at = ?
             WHERE id = ? AND organization_id = ?',
            [
                $session->currentNodeId,
                $session->outcome->value,
                (int) $session->hasConversion,
                $session->endedAt,
                $session->id,
                $session->organizationId,
            ],
        );
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): ChatSession
    {
        return new ChatSession(
            id:             (string) $row['id'],
            organizationId: (int) $row['organization_id'],
            scenarioId:     (int) $row['scenario_id'],
            currentNodeId:  isset($row['current_node_id']) ? (string) $row['current_node_id'] : null,
            outcome:        SessionOutcome::from((string) $row['outcome']),
            hasConversion:  (bool) $row['has_conversion'],
            startedAt:      (string) $row['started_at'],
            endedAt:        isset($row['ended_at']) ? (string) $row['ended_at'] : null,
        );
    }
}
