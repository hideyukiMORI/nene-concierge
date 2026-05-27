<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoActionLogRepository implements ActionLogRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function append(ActionLog $log): void
    {
        $this->query->insert(
            'INSERT INTO action_logs (organization_id, session_id, scenario_id, node_id, adapter, status, error_message, executed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $log->organizationId,
                $log->sessionId,
                $log->scenarioId,
                $log->nodeId,
                $log->adapter,
                $log->status,
                $log->errorMessage,
                $log->executedAt,
            ],
        );
    }

    /** @return list<ActionLog> */
    public function findBySession(string $sessionId, int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM action_logs WHERE session_id = ? AND organization_id = ? ORDER BY executed_at ASC',
            [$sessionId, $organizationId],
        );

        return array_map($this->hydrate(...), $rows);
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
        [$sql, $params] = $this->buildListQuery(
            'SELECT *',
            $organizationId,
            $adapter,
            $status,
            $scenarioId,
        );
        $sql .= ' ORDER BY executed_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $rows = $this->query->fetchAll($sql, $params);

        /** @var list<ActionLog> */
        return array_map($this->hydrate(...), $rows);
    }

    public function countByOrganization(
        int     $organizationId,
        ?string $adapter    = null,
        ?string $status     = null,
        ?int    $scenarioId = null,
    ): int {
        [$sql, $params] = $this->buildListQuery(
            'SELECT COUNT(*)',
            $organizationId,
            $adapter,
            $status,
            $scenarioId,
        );

        $row = $this->query->fetchAll($sql, $params);

        return isset($row[0]) ? (int) array_values($row[0])[0] : 0;
    }

    /**
     * Build the base query (without ORDER BY / LIMIT / OFFSET).
     *
     * @return array{0: string, 1: list<mixed>}
     */
    private function buildListQuery(
        string  $select,
        int     $organizationId,
        ?string $adapter,
        ?string $status,
        ?int    $scenarioId,
    ): array {
        $where  = ['organization_id = ?'];
        $params = [$organizationId];

        if ($adapter !== null) {
            $where[]  = 'adapter = ?';
            $params[] = $adapter;
        }

        if ($status !== null) {
            $where[]  = 'status = ?';
            $params[] = $status;
        }

        if ($scenarioId !== null) {
            $where[]  = 'scenario_id = ?';
            $params[] = $scenarioId;
        }

        $sql = "{$select} FROM action_logs WHERE " . implode(' AND ', $where);

        return [$sql, $params];
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): ActionLog
    {
        return new ActionLog(
            organizationId: (int) $row['organization_id'],
            sessionId:      (string) $row['session_id'],
            scenarioId:     (int) $row['scenario_id'],
            nodeId:         (string) $row['node_id'],
            adapter:        (string) $row['adapter'],
            status:         (string) $row['status'],
            executedAt:     (string) $row['executed_at'],
            errorMessage:   isset($row['error_message']) ? (string) $row['error_message'] : null,
            id:             isset($row['id']) ? (int) $row['id'] : null,
        );
    }
}
